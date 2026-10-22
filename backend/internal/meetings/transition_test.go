package meetings_test

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func currentMeeting(t *testing.T, f *fixture) meetings.Meeting {
	t.Helper()
	var result meetings.Meeting
	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		var err error
		result, err = r.Meeting(f.created.Details.Meeting.ID)

		return err
	}))

	return result
}

func currentJob(t *testing.T, f *fixture, version uint64) meetings.TransitionJob {
	t.Helper()
	var result meetings.TransitionJob
	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		var err error
		result, err = r.TransitionJob(f.created.Details.Meeting.ID, version)

		return err
	}))

	return result
}

func TestTransitionWithoutReadsAndDuplicateDelivery(t *testing.T) {
	f := setup(t)
	options := meetings.DefaultTransitionOptions()
	original := currentMeeting(t, f)
	want := time.Date(2026, 10, 24, 21, 0, 0, 0, time.UTC)
	if original.Status != meetings.Upcoming || original.ScheduleVersion != 1 || original.PastAt == nil || !original.PastAt.Equal(want) {
		t.Fatalf("schedule: %+v", original)
	}

	_, err := f.app.ClaimTransition(ctx, options)
	assertError(t, err, meetings.ErrNotFound)
	f.clock.Store(want.Unix())
	// No GET is required to make the task eligible or persist the transition.
	job, err := f.app.ClaimTransition(ctx, options)
	must(t, err)
	must(t, f.app.CompleteTransition(ctx, job))
	must(t, f.app.CompleteTransition(ctx, job))
	got := currentMeeting(t, f)
	if got.Status != meetings.Past || got.Revision != 2 || got.ScheduleVersion != 1 || len(feed(t, f).Entries) != 1 {
		t.Fatalf("transition changed wrong state: %+v", got)
	}

	if currentJob(t, f, 1).State != meetings.TransitionCompleted {
		t.Fatal("job not acknowledged")
	}

	// A duplicate after committed status and lost acknowledgement is also safe.
	must(t, f.store.Update(ctx, func(w meetings.Writer) error { job.State = meetings.TransitionRunning; return w.SaveTransitionJob(job) }))
	must(t, f.app.CompleteTransition(ctx, job))
	if currentMeeting(t, f).Revision != 2 {
		t.Fatal("duplicate advanced revision")
	}
}

func TestScheduleUsesLocalMidnight(t *testing.T) {
	cases := []struct{ zone, start, due string }{
		{"America/New_York", "2026-03-08T00:00:00-05:00", "2026-03-09T04:00:00Z"},
		{"America/New_York", "2026-11-01T00:00:00-04:00", "2026-11-02T05:00:00Z"},
		{"America/Sao_Paulo", "2018-11-03T18:00:00-03:00", "2018-11-04T03:00:00Z"},
		{"Pacific/Apia", "2011-12-29T18:00:00-10:00", "2011-12-30T10:00:00Z"},
		{"Pacific/Kiritimati", "2026-12-31T23:00:00+14:00", "2026-12-31T10:00:00Z"},
	}
	for _, c := range cases {
		t.Run(c.zone+c.start, func(t *testing.T) {
			start, _ := time.Parse(time.RFC3339, c.start)
			due, _ := time.Parse(time.RFC3339, c.due)
			store := memory.New()
			app := meetings.NewService(store, func() time.Time { return start.Add(-time.Hour) })
			input := validInput()
			input.StartsAt = c.start
			input.Timezone = c.zone
			created, err := app.Create(ctx, owner, input, key(1))
			must(t, err)
			if !created.Details.Meeting.PastAt.Equal(due) {
				t.Fatalf("due=%s want=%s", created.Details.Meeting.PastAt, due)
			}
		})
	}
}

func TestReadsDoNotPerformTransitionAndTitleKeepsSchedule(t *testing.T) {
	f := setup(t)
	due := *currentMeeting(t, f).PastAt
	f.clock.Store(due.Add(time.Hour).Unix())
	page, err := f.app.Calendar(ctx, owner, meetings.CalendarQuery{Period: meetings.Upcoming, Limit: 10})
	must(t, err)
	if len(page.Meetings) != 1 || page.NextTransitionAt == nil || page.NextTransitionAt.After(page.AsOf) {
		t.Fatal("read changed status or hid overdue deadline")
	}

	_, err = f.app.Details(ctx, owner, f.created.Details.Meeting.ID)
	must(t, err)
	changed, err := f.app.Update(ctx, owner, f.created.Details.Meeting.ID, meetings.UpdateInput{Title: meetings.Field{Present: true, Value: "New title"}, ExpectedRevision: 1}, key(2))
	must(t, err)
	if changed.Meeting.ScheduleVersion != 1 || changed.Meeting.Status != meetings.Upcoming {
		t.Fatal("title rescheduled lifecycle")
	}

	job, err := f.app.ClaimTransition(ctx, meetings.DefaultTransitionOptions())
	must(t, err)
	must(t, f.app.CompleteTransition(ctx, job))
	if currentMeeting(t, f).Revision != 3 {
		t.Fatal("worker ignored title update")
	}
}

func TestRescheduleFencesOldJobAndReopensPastMeeting(t *testing.T) {
	f := setup(t)
	due := *currentMeeting(t, f).PastAt
	f.clock.Store(due.Unix())
	job, err := f.app.ClaimTransition(ctx, meetings.DefaultTransitionOptions())
	must(t, err)
	next, err := f.app.Update(ctx, owner, f.created.Details.Meeting.ID, meetings.UpdateInput{StartsAt: meetings.Field{Present: true, Value: "2026-10-27T19:00:00+03:00"}, ExpectedRevision: 1}, key(2))
	must(t, err)
	must(t, f.app.CompleteTransition(ctx, job))
	if got := currentMeeting(t, f); got.Status != meetings.Upcoming || got.ScheduleVersion != 2 || got.Revision != 2 {
		t.Fatalf("old task changed new schedule: %+v", got)
	}

	f.clock.Store(next.Meeting.PastAt.Unix())
	job, err = f.app.ClaimTransition(ctx, meetings.DefaultTransitionOptions())
	must(t, err)
	must(t, f.app.CompleteTransition(ctx, job))
	reopened, err := f.app.Update(ctx, owner, next.Meeting.ID, meetings.UpdateInput{StartsAt: meetings.Field{Present: true, Value: "2026-11-01T19:00:00+03:00"}, ExpectedRevision: 3}, key(3))
	must(t, err)
	if reopened.Meeting.Status != meetings.Upcoming || reopened.Meeting.ScheduleVersion != 3 {
		t.Fatal("past meeting did not reopen")
	}
}

func TestConcurrentTransitionAndDateChange(t *testing.T) {
	f := setup(t)
	f.clock.Store(currentMeeting(t, f).PastAt.Unix())
	job, err := f.app.ClaimTransition(ctx, meetings.DefaultTransitionOptions())
	must(t, err)
	var wg sync.WaitGroup
	var updateErr error
	wg.Go(func() { must(t, f.app.CompleteTransition(ctx, job)) })
	wg.Go(func() {
		_, updateErr = f.app.Update(ctx, owner, job.MeetingID, meetings.UpdateInput{StartsAt: meetings.Field{Present: true, Value: "2026-10-28T19:00:00+03:00"}, ExpectedRevision: 1}, key(2))
	})
	wg.Wait()
	got := currentMeeting(t, f)
	if updateErr == nil {
		if got.Status != meetings.Upcoming || got.ScheduleVersion != 2 {
			t.Fatal("stale job overwrote moved meeting")
		}
	} else {
		var conflict *meetings.Conflict
		if !errors.As(updateErr, &conflict) || got.Status != meetings.Past {
			t.Fatalf("unexpected race: %v %+v", updateErr, got)
		}
	}
}

type failingJobWriter struct{ meetings.Writer }

func (failingJobWriter) SaveTransitionJob(meetings.TransitionJob) error {
	return errors.New("enqueue failure")
}

type failingJobStore struct{ meetings.Store }

func (s failingJobStore) Update(ctx context.Context, fn func(meetings.Writer) error) error {
	return s.Store.Update(ctx, func(w meetings.Writer) error { return fn(failingJobWriter{w}) })
}

func TestEnqueueFailureRollsBackCreationAndReschedule(t *testing.T) {
	store := memory.New()
	now := time.Date(2026, 10, 20, 0, 0, 0, 0, time.UTC)
	broken := meetings.NewService(failingJobStore{store}, func() time.Time { return now })
	if _, err := broken.Create(ctx, owner, validInput(), key(1)); err == nil {
		t.Fatal("enqueue failure ignored")
	}

	must(t, store.View(ctx, func(r meetings.Reader) error {
		all, err := r.Meetings()
		if len(all) != 0 {
			t.Fatal("partial meeting")
		}

		return err
	}))
	f := setup(t)
	broken = meetings.NewService(failingJobStore{f.store}, func() time.Time { return now })
	_, err := broken.Update(ctx, owner, f.created.Details.Meeting.ID, meetings.UpdateInput{StartsAt: meetings.Field{Present: true, Value: "2026-10-25T19:00:00+03:00"}, ExpectedRevision: 1}, key(2))
	if err == nil || currentMeeting(t, f).ScheduleVersion != 1 || len(feed(t, f).Entries) != 1 {
		t.Fatal("partial reschedule")
	}
}

func TestConcurrentClaimsAndAcknowledgementRollback(t *testing.T) {
	f := setup(t)
	f.clock.Store(currentMeeting(t, f).PastAt.Unix())
	options := meetings.DefaultTransitionOptions()
	claims := make(chan meetings.TransitionJob, 12)
	var wg sync.WaitGroup
	for range 12 {
		wg.Go(func() {
			job, err := f.app.ClaimTransition(ctx, options)
			if err == nil {
				claims <- job
			} else if !errors.Is(err, meetings.ErrNotFound) {
				t.Error(err)
			}
		})
	}

	wg.Wait()
	close(claims)
	if len(claims) != 1 {
		t.Fatalf("concurrent leases: %d", len(claims))
	}

	job := <-claims
	broken := meetings.NewService(failingJobStore{f.store}, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	if err := broken.CompleteTransition(ctx, job); err == nil {
		t.Fatal("acknowledgement failure ignored")
	}

	if currentMeeting(t, f).Status != meetings.Upcoming || currentMeeting(t, f).Revision != 1 || currentJob(t, f, 1).State != meetings.TransitionRunning {
		t.Fatal("status committed without acknowledgement")
	}

	must(t, f.app.CompleteTransition(ctx, job))
	if currentMeeting(t, f).Status != meetings.Past || currentMeeting(t, f).Revision != 2 {
		t.Fatal("retry did not complete once")
	}
}
