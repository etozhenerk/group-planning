package meetings_test

import (
	"errors"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func proposeTask(t *testing.T, f *fixture, author meetings.Actor, recipient string, n int) meetings.PreparationTaskView {
	t.Helper()
	view, err := f.app.CreatePreparationTask(ctx, author, f.created.Details.Meeting.ID, meetings.CreatePreparationTaskInput{Title: " Заказать пиццу ", RecipientID: recipient}, key(n))
	must(t, err)

	return view
}

func taskAction(t *testing.T, f *fixture, actor meetings.Actor, task meetings.PreparationTask, action meetings.PreparationAction, n int) meetings.PreparationTaskView {
	t.Helper()
	view, err := f.app.ActOnPreparationTask(ctx, actor, task.MeetingID, task.ID, meetings.PreparationActionInput{Action: action, ExpectedRevision: task.Revision}, key(n))
	must(t, err)

	return view
}

func TestPreparationAddressedProposalNeedsRecipientConsent(t *testing.T) {
	f := setup(t)
	respond(t, f, meetings.Going, 0, 20)
	offer := proposeTask(t, f, owner, guest.ID, 100)
	if offer.Task.Assignee != nil || offer.Task.State != meetings.TaskOffered || offer.CanAccept || !offer.CanCancel || offer.Task.Title != "Заказать пиццу" {
		t.Fatalf("proposal assigned work or wrong permissions: %+v", offer)
	}

	_, err := f.app.ActOnPreparationTask(ctx, owner, offer.Task.MeetingID, offer.Task.ID, meetings.PreparationActionInput{Action: meetings.TaskAccept, ExpectedRevision: 1}, key(101))
	assertError(t, err, meetings.ErrForbidden)
	view, err := f.app.ReadPreparationTask(ctx, guest, offer.Task.MeetingID, offer.Task.ID)
	must(t, err)
	if !view.CanAccept || !view.CanDecline || view.CanComplete || view.CanCancel {
		t.Fatal("recipient permissions are wrong")
	}

	accepted := taskAction(t, f, guest, offer.Task, meetings.TaskAccept, 102)
	if accepted.Task.Assignee == nil || *accepted.Task.Assignee != guest || !accepted.CanComplete || !accepted.CanDecline || accepted.CanAccept || accepted.Task.Revision != 2 {
		t.Fatalf("acceptance not explicit: %+v", accepted)
	}

	_, err = f.app.ActOnPreparationTask(ctx, owner, accepted.Task.MeetingID, accepted.Task.ID, meetings.PreparationActionInput{Action: meetings.TaskComplete, ExpectedRevision: 2}, key(103))
	assertError(t, err, meetings.ErrForbidden)
	completed := taskAction(t, f, guest, accepted.Task, meetings.TaskComplete, 104)
	if completed.Task.State != meetings.TaskCompleted || completed.CanAccept || completed.CanCancel || completed.CanDecline || completed.CanComplete {
		t.Fatal("completed task still actionable")
	}

	retry := taskAction(t, f, guest, offer.Task, meetings.TaskAccept, 102)
	if retry.Task.State != meetings.TaskCompleted || retry.Task.Revision != 3 {
		t.Fatal("late retry rolled back completion")
	}

	events := []string{}
	for _, entry := range feed(t, f).Entries {
		if strings.HasPrefix(entry.Kind, "preparation_task_") {
			events = append(events, entry.Kind)
		}
	}

	if strings.Join(events, ",") != "preparation_task_created,preparation_task_accepted,preparation_task_completed" {
		t.Fatalf("missing or duplicate event: %v", events)
	}
}

func TestPreparationDeclineCancelAndSelfProposal(t *testing.T) {
	f, actors := pollCompany(t)
	addressed := proposeTask(t, f, actors[1], actors[2].ID, 100)
	declined := taskAction(t, f, actors[2], addressed.Task, meetings.TaskDecline, 101)
	if declined.Task.Assignee != nil || declined.Task.State != meetings.TaskDeclined || declined.CanAccept {
		t.Fatal("decline assigned work")
	}

	self := proposeTask(t, f, actors[1], actors[1].ID, 102)
	if self.Task.Assignee != nil || !self.CanAccept || !self.CanDecline {
		t.Fatal("self proposal accepted implicitly")
	}

	accepted := taskAction(t, f, actors[1], self.Task, meetings.TaskAccept, 103)
	declined = taskAction(t, f, actors[1], accepted.Task, meetings.TaskDecline, 104)
	if declined.Task.State != meetings.TaskDeclined || declined.Task.Assignee == nil || declined.CanComplete {
		t.Fatal("decline lost history or remained assigned")
	}

	for i, actor := range []meetings.Actor{owner, actors[1]} {
		offer := proposeTask(t, f, actors[1], "", 110+i)
		accepted = taskAction(t, f, actors[2], offer.Task, meetings.TaskAccept, 120+i)
		cancelled := taskAction(t, f, actor, accepted.Task, meetings.TaskCancel, 130+i)
		if cancelled.Task.State != meetings.TaskCancelled || cancelled.Task.UpdatedBy != actor || cancelled.CanComplete {
			t.Fatal("author/organizer cancellation failed")
		}
	}

	general := proposeTask(t, f, actors[1], "", 140)
	_, err := f.app.ActOnPreparationTask(ctx, actors[2], general.Task.MeetingID, general.Task.ID, meetings.PreparationActionInput{Action: meetings.TaskDecline, ExpectedRevision: 1}, key(141))
	assertError(t, err, meetings.ErrForbidden)
}

func TestPreparationConcurrentAcceptanceHasOneAssignee(t *testing.T) {
	f, actors := pollCompany(t)
	task := proposeTask(t, f, owner, "", 100).Task
	var success, conflicts atomic.Int32
	var group sync.WaitGroup
	for i, actor := range actors {
		group.Go(func() {
			_, err := f.app.ActOnPreparationTask(ctx, actor, task.MeetingID, task.ID, meetings.PreparationActionInput{Action: meetings.TaskAccept, ExpectedRevision: 1}, key(110+i))
			var conflict *meetings.Conflict
			if err == nil {
				success.Add(1)
			} else if errors.As(err, &conflict) && conflict.Code == "task_revision_conflict" {
				conflicts.Add(1)
			} else {
				t.Errorf("unexpected concurrent result: %v", err)
			}
		})
	}

	group.Wait()
	if success.Load() != 1 || conflicts.Load() != int32(len(actors)-1) {
		t.Fatal("multiple assignees or missing conflict")
	}

	count := 0
	for _, entry := range feed(t, f).Entries {
		if entry.Kind == "preparation_task_accepted" {
			count++
		}
	}

	if count != 1 {
		t.Fatal("duplicate acceptance events")
	}
}

func TestPreparationAccessValidationAndPermanentCreateRetry(t *testing.T) {
	f := setup(t)
	respond(t, f, meetings.Going, 0, 20)
	task := proposeTask(t, f, guest, "", 100).Task
	accepted := taskAction(t, f, guest, task, meetings.TaskAccept, 101)
	respond(t, f, meetings.Maybe, 1, 21)
	_, err := f.app.ReadPreparationTask(ctx, guest, task.MeetingID, task.ID)
	assertError(t, err, meetings.ErrForbidden)
	_, err = f.app.ActOnPreparationTask(ctx, guest, task.MeetingID, task.ID, meetings.PreparationActionInput{Action: meetings.TaskAccept, ExpectedRevision: 1}, key(101))
	assertError(t, err, meetings.ErrForbidden)
	_, err = f.app.CreatePreparationTask(ctx, guest, task.MeetingID, meetings.CreatePreparationTaskInput{Title: task.Title}, key(100))
	assertError(t, err, meetings.ErrForbidden)
	_, err = f.app.CreatePreparationTask(ctx, owner, task.MeetingID, meetings.CreatePreparationTaskInput{Title: "Новое дело", RecipientID: guest.ID}, key(102))
	var validation meetings.ValidationError
	if !errors.As(err, &validation) || validation.Fields["recipient_id"] != "unavailable" {
		t.Fatalf("ineligible recipient: %v", err)
	}

	respond(t, f, meetings.Going, 2, 22)
	returned, err := f.app.ReadPreparationTask(ctx, guest, task.MeetingID, task.ID)
	must(t, err)
	if !returned.CanComplete || returned.Task.Revision != accepted.Task.Revision {
		t.Fatal("return changed task")
	}

	f.clock.Add(int64((31 * 24 * time.Hour) / time.Second))
	retry := proposeTask(t, f, guest, "", 100)
	if retry.Task.ID != task.ID || retry.Task.State != meetings.TaskAccepted {
		t.Fatal("expired receipt duplicated task")
	}

	_, err = f.app.CreatePreparationTask(ctx, guest, task.MeetingID, meetings.CreatePreparationTaskInput{Title: "Другое дело"}, key(100))
	assertError(t, err, meetings.ErrIdempotencyConflict)
	for i, title := range []string{"", "   ", strings.Repeat("🙂", 201)} {
		_, err = f.app.CreatePreparationTask(ctx, owner, task.MeetingID, meetings.CreatePreparationTaskInput{Title: title}, key(200+i))
		if !errors.As(err, &validation) {
			t.Fatal("invalid title accepted")
		}
	}
}
