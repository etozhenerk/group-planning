package meetings_test

import (
	"context"
	"errors"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type failedTaskStore struct {
	meetings.Store
	writeTask bool
}

func (s failedTaskStore) Update(ctx context.Context, fn func(meetings.Writer) error) error {
	return s.Store.Update(ctx, func(w meetings.Writer) error { return fn(failedTaskWriter{Writer: w, writeTask: s.writeTask}) })
}

type failedTaskWriter struct {
	meetings.Writer
	writeTask bool
}

func (w failedTaskWriter) SavePreparationTask(task meetings.PreparationTask) error {
	if w.writeTask {
		return errors.New("injected task storage failure")
	}

	return w.Writer.SavePreparationTask(task)
}

func (w failedTaskWriter) AppendEntry(entry meetings.FeedEntry) (meetings.FeedEntry, error) {
	if !w.writeTask && strings.HasPrefix(entry.Kind, "preparation_task_") {
		return meetings.FeedEntry{}, errors.New("injected task event failure")
	}

	return w.Writer.AppendEntry(entry)
}

func TestPreparationRollbackForStorageAndFeedFailures(t *testing.T) {
	for _, writeTask := range []bool{false, true} {
		f := setup(t)
		broken := meetings.NewService(failedTaskStore{Store: f.store, writeTask: writeTask}, func() time.Time { return time.Unix(f.clock.Load(), 0) })
		_, err := broken.CreatePreparationTask(ctx, owner, f.created.Details.Meeting.ID, meetings.CreatePreparationTaskInput{Title: "Заказать пиццу"}, key(100))
		if err == nil {
			t.Fatal("fault ignored")
		}

		must(t, f.store.View(ctx, func(r meetings.Reader) error {
			tasks, err := r.PreparationTasks(f.created.Details.Meeting.ID)
			if len(tasks) != 0 {
				t.Fatal("partial creation")
			}

			return err
		}))
		task := proposeTask(t, f, owner, "", 100).Task
		before := len(feed(t, f).Entries)
		_, err = broken.ActOnPreparationTask(ctx, owner, task.MeetingID, task.ID, meetings.PreparationActionInput{Action: meetings.TaskAccept, ExpectedRevision: 1}, key(101))
		if err == nil {
			t.Fatal("action fault ignored")
		}

		view, err := f.app.ReadPreparationTask(ctx, owner, task.MeetingID, task.ID)
		must(t, err)
		if view.Task.State != meetings.TaskOffered || view.Task.Assignee != nil || view.Task.Revision != 1 || len(feed(t, f).Entries) != before {
			t.Fatal("partial action committed")
		}

		accepted := taskAction(t, f, owner, task, meetings.TaskAccept, 101)
		if accepted.Task.State != meetings.TaskAccepted {
			t.Fatal("retry after rollback failed")
		}
	}
}

func TestPreparationConcurrentCreationCopiesAndCrossMeetingIsolation(t *testing.T) {
	f := setup(t)
	var group sync.WaitGroup
	ids := make(chan string, 10)
	for range 10 {
		group.Go(func() {
			view, err := f.app.CreatePreparationTask(ctx, owner, f.created.Details.Meeting.ID, meetings.CreatePreparationTaskInput{Title: "Заказать пиццу"}, key(100))
			if err != nil {
				t.Error(err)
				return
			}

			ids <- view.Task.ID
		})
	}

	group.Wait()
	close(ids)
	id := ""
	for value := range ids {
		if id != "" && id != value {
			t.Fatal("duplicate task on concurrent retry")
		}

		id = value
	}

	view, err := f.app.ReadPreparationTask(ctx, owner, f.created.Details.Meeting.ID, id)
	must(t, err)
	accepted := taskAction(t, f, owner, view.Task, meetings.TaskAccept, 101)
	accepted.Task.Assignee.Name = "mutation outside transaction"
	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		tasks, err := r.PreparationTasks(view.Task.MeetingID)
		if err != nil {
			return err
		}

		if len(tasks) != 1 || tasks[0].Assignee.Name != owner.Name {
			t.Fatal("write shared actor pointer")
		}

		tasks[0].Assignee.Name = "mutation within view"
		task, err := r.PreparationTask(id)
		if err == nil && task.Assignee.Name != owner.Name {
			t.Fatal("read shared actor pointer")
		}

		return err
	}))
	other, err := f.app.Create(ctx, owner, validInput(), key(102))
	must(t, err)
	_, err = f.app.ReadPreparationTask(ctx, owner, other.Details.Meeting.ID, id)
	assertError(t, err, meetings.ErrNotFound)
	_, err = f.app.ActOnPreparationTask(ctx, owner, other.Details.Meeting.ID, id, meetings.PreparationActionInput{Action: meetings.TaskAccept, ExpectedRevision: 1}, key(101))
	assertError(t, err, meetings.ErrNotFound)
	_, err = f.app.ActOnPreparationTask(ctx, owner, view.Task.MeetingID, id, meetings.PreparationActionInput{Action: meetings.TaskComplete, ExpectedRevision: 2}, key(101))
	assertError(t, err, meetings.ErrIdempotencyConflict)
}
