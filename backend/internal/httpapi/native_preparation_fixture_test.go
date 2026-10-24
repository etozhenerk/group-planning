package httpapi

import (
	"context"
	"encoding/base64"
	"fmt"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func seedNativePreparationFixture(t *testing.T, store *memory.Store, identityService *identity.Service, kind string, index int) iosFixtureCredential {
	t.Helper()
	ctx := context.Background()
	currentCode, otherCode := "invite-guest-task-"+kind, "task-organizer-"+kind
	organizer := kind == "owner" || kind == "cancel"
	if organizer {
		currentCode, otherCode = "task-"+kind, "invite-guest-task-friend-"+kind
	}

	credential := iosCredential(t, identityService, currentCode)
	otherCredential := iosCredential(t, identityService, otherCode)
	profile := func(value iosFixtureCredential) meetings.Actor {
		principal, err := identityService.Authenticate(ctx, value.Token, false)
		if err != nil {
			t.Fatal(err)
		}

		return meetings.Actor{ID: principal.User.ID, Name: principal.User.DisplayName}
	}
	current, other := profile(credential), profile(otherCredential)
	owner, guest := other, current
	if organizer {
		owner, guest = current, other
	}

	id := fmt.Sprintf("d3c70000-0000-4000-8000-%012d", index)
	key := func(offset int) string { return fmt.Sprintf("d3c70000-0000-4000-8000-%012d", index+offset) }
	now := time.Now().UTC()
	service := meetings.NewService(store, time.Now)
	token := base64.RawURLEncoding.EncodeToString([]byte(fmt.Sprintf("%016d", index+7000)))
	if err := store.Update(ctx, func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: id, OrganizerID: owner.ID, Title: "Вечер с друзьями", StartsOn: now.AddDate(0, 0, 2).Format("2006-01-02"), Timezone: "Europe/Moscow", Revision: 1, CreatedAt: now, Status: meetings.Upcoming, ScheduleVersion: 1}); err != nil {
			return err
		}

		return w.InsertInvitation(meetings.Invitation{ID: key(1), MeetingID: id, Token: token, CreatedAt: now})
	}); err != nil {
		t.Fatal(err)
	}

	if _, err := service.Respond(ctx, guest, "", token, meetings.Going, 0, key(2)); err != nil {
		t.Fatal(err)
	}

	if kind == "owner" {
		return credential
	}

	recipient := guest.ID
	if kind == "conflict" {
		recipient = ""
	}

	task, err := service.CreatePreparationTask(ctx, owner, id, meetings.CreatePreparationTaskInput{Title: "Заказать пиццу", RecipientID: recipient}, key(3))
	if err != nil {
		t.Fatal(err)
	}

	if kind == "cancel" || kind == "decline" {
		if _, err := service.ActOnPreparationTask(ctx, guest, id, task.Task.ID, meetings.PreparationActionInput{Action: meetings.TaskAccept, ExpectedRevision: 1}, key(4)); err != nil {
			t.Fatal(err)
		}
	}

	return credential
}

func verifyNativePreparationFixture(t *testing.T, store *memory.Store, faults *nativePreparationFaults) {
	t.Helper()
	expected := map[int]meetings.PreparationTaskState{100: meetings.TaskOffered, 200: meetings.TaskCompleted, 300: meetings.TaskDeclined, 400: meetings.TaskCancelled, 500: meetings.TaskAccepted}
	if err := store.View(context.Background(), func(r meetings.Reader) error {
		for index, state := range expected {
			id := fmt.Sprintf("d3c70000-0000-4000-8000-%012d", index)
			tasks, err := r.PreparationTasks(id)
			if err != nil {
				return err
			}

			if len(tasks) != 1 || tasks[0].State != state {
				t.Errorf("task scenario %d: wrong count/state", index)
				continue
			}

			if index == 100 && (tasks[0].Assignee != nil || tasks[0].RecipientID == "") {
				t.Error("native proposal auto-assigned or lost recipient")
			}

			entries, err := r.Feed(id)
			if err != nil {
				return err
			}

			created, accepted := 0, 0
			for _, entry := range entries {
				if entry.Kind == "preparation_task_created" {
					created++
				}

				if entry.Kind == "preparation_task_accepted" {
					accepted++
				}
			}

			if created != 1 || accepted > 1 {
				t.Errorf("task scenario %d duplicated feed event", index)
			}
		}

		return nil
	}); err != nil {
		t.Fatal(err)
	}

	faults.mu.Lock()
	defer faults.mu.Unlock()
	t.Logf("task participant reads: %d; injected failure on read %d", faults.peopleReads, faults.peopleFailAt)
	for _, name := range []string{"task-owner", "task-recipient"} {
		record := faults.retries[name]
		if record == nil || record.attempts != 2 || !record.exact {
			t.Errorf("%s did not repeat the original body/key", name)
		}
	}
}
