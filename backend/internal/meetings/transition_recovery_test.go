package meetings_test

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func missingJobFixture(t *testing.T) *fixture {
	t.Helper()
	f := setup(t)
	meeting := currentMeeting(t, f)
	f.store = memory.New()
	must(t, f.store.Update(ctx, func(w meetings.Writer) error { return w.SaveMeeting(meeting) }))
	f.app = meetings.NewService(f.store, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	f.clock.Store(meeting.PastAt.Unix())

	return f
}

func TestReconciliationRepairsMissingJobOnce(t *testing.T) {
	f := missingJobFixture(t)
	var wg sync.WaitGroup
	for range 12 {
		wg.Go(func() {
			_, _, err := f.app.ReconcileTransitions(ctx, "", 10)
			if err != nil {
				t.Error(err)
			}
		})
	}

	wg.Wait()
	stats, err := f.app.ReadTransitionStats(ctx)
	must(t, err)
	if stats.Pending != 1 || stats.Overdue != 1 {
		t.Fatalf("repair duplicated: %+v", stats)
	}

	options := meetings.DefaultTransitionOptions()
	job, err := f.app.ClaimTransition(ctx, options)
	must(t, err)
	_, _, err = f.app.ReconcileTransitions(ctx, "", 10)
	must(t, err)
	if currentJob(t, f, 1) != job {
		t.Fatal("sweep changed lease")
	}

	must(t, f.app.FailTransition(ctx, job, options, receiptFailure))
	before := currentJob(t, f, 1)
	_, _, err = f.app.ReconcileTransitions(ctx, "", 10)
	must(t, err)
	if currentJob(t, f, 1) != before {
		t.Fatal("sweep reset backoff")
	}
}

func TestLeaseExpiryAndControlledRetry(t *testing.T) {
	f := setup(t)
	f.clock.Store(currentMeeting(t, f).PastAt.Unix())
	options := meetings.DefaultTransitionOptions()
	old, err := f.app.ClaimTransition(ctx, options)
	must(t, err)
	f.clock.Add(int64(options.Lease/time.Second) + 1)
	newer, err := f.app.ClaimTransition(ctx, options)
	must(t, err)
	if newer.LeaseToken == old.LeaseToken || newer.Attempts != 2 {
		t.Fatal("lease was not fenced")
	}

	assertError(t, f.app.CompleteTransition(ctx, old), meetings.ErrTransitionLeaseLost)
	if currentMeeting(t, f).Status != meetings.Upcoming {
		t.Fatal("stale lease committed")
	}

	must(t, f.app.CompleteTransition(ctx, newer))

	f = setup(t)
	f.clock.Store(currentMeeting(t, f).PastAt.Unix())
	options.MaxAttempts = 1
	_, err = f.app.ClaimTransition(ctx, options)
	must(t, err)
	f.clock.Add(int64(options.Lease/time.Second) + 1)
	exhausted, err := f.app.ClaimTransition(ctx, options)
	must(t, err)
	if exhausted.State != meetings.TransitionFailed {
		t.Fatal("lease expiry bypassed attempt limit")
	}

	_, _, err = f.app.ReconcileTransitions(ctx, "", 10)
	must(t, err)
	if currentJob(t, f, 1) != exhausted {
		t.Fatal("sweep reset exhausted attempt history")
	}

	must(t, f.app.RetryFailedTransition(ctx, exhausted.MeetingID, 1))
	job, err := f.app.ClaimTransition(ctx, options)
	must(t, err)
	if job.ManualRetries != 1 || job.Attempts != 1 {
		t.Fatal("controlled retry not recorded")
	}

	must(t, f.app.CompleteTransition(ctx, job))
}

func TestRetryOfSupersededFailedScheduleDoesNotRequeue(t *testing.T) {
	f := setup(t)
	f.clock.Store(currentMeeting(t, f).PastAt.Unix())
	options := meetings.DefaultTransitionOptions()
	options.MaxAttempts = 1
	job, err := f.app.ClaimTransition(ctx, options)
	must(t, err)
	must(t, f.app.FailTransition(ctx, job, options, receiptFailure))
	_, err = f.app.Update(ctx, owner, job.MeetingID, meetings.UpdateInput{StartsAt: meetings.Field{Present: true, Value: "2026-11-01T19:00:00+03:00"}, ExpectedRevision: 1}, key(2))
	must(t, err)
	must(t, f.app.RetryFailedTransition(ctx, job.MeetingID, 1))
	if currentJob(t, f, 1).State != meetings.TransitionCompleted || currentMeeting(t, f).Status != meetings.Upcoming {
		t.Fatal("stale retry changed new schedule")
	}
}

type afterSelectionStore struct {
	meetings.Store
	hook func()
	once sync.Once
}

func (s *afterSelectionStore) View(ctx context.Context, fn func(meetings.Reader) error) error {
	err := s.Store.View(ctx, fn)
	if err == nil {
		s.once.Do(s.hook)
	}

	return err
}

func TestReconciliationRechecksMovedSchedule(t *testing.T) {
	f := missingJobFixture(t)
	store := &afterSelectionStore{Store: f.store, hook: func() {
		_, err := f.app.Update(ctx, owner, f.created.Details.Meeting.ID, meetings.UpdateInput{StartsAt: meetings.Field{Present: true, Value: "2026-11-01T19:00:00+03:00"}, ExpectedRevision: 1}, key(2))
		must(t, err)
	}}
	app := meetings.NewService(store, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	_, repaired, err := app.ReconcileTransitions(ctx, "", 10)
	must(t, err)
	if repaired != 0 {
		t.Fatal("repaired old schedule")
	}

	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		_, err := r.TransitionJob(f.created.Details.Meeting.ID, 1)
		assertError(t, err, meetings.ErrNotFound)

		return nil
	}))
}

func TestReconciliationUsesBoundedPages(t *testing.T) {
	f := missingJobFixture(t)
	original := currentMeeting(t, f)
	for i := 0; i < 3; i++ {
		copy := original
		copy.ID = key(50 + i)
		must(t, f.store.Update(ctx, func(w meetings.Writer) error { return w.SaveMeeting(copy) }))
	}

	total := 0
	after := ""
	pages := 0
	for {
		next, repaired, err := f.app.ReconcileTransitions(ctx, after, 1)
		must(t, err)
		total += repaired
		pages++
		if next == "" {
			break
		}

		after = next
		if pages > 6 {
			t.Fatal("unbounded scan")
		}
	}

	if total != 4 || pages != 5 {
		t.Fatalf("batch scan repaired=%d pages=%d", total, pages)
	}
}
