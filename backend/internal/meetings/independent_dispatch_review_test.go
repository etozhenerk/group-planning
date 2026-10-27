package meetings_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestIndependentRetryDeadlineElapsedInsidePublishBatch(t *testing.T) {
	store := memory.New()
	now := time.Date(2026, 10, 27, 12, 0, 0, 0, time.UTC)
	app := meetings.NewService(store, func() time.Time { return now })
	must(t, store.Update(t.Context(), func(w meetings.Writer) error {
		for _, id := range []string{"a-fails", "b-succeeds"} {
			if err := w.EnqueueChatHint(meetings.ChatHint{ID: id, Target: "user", TargetID: "u", MeetingID: "gone", Terminal: true, SchemaVersion: 1, CreatedAt: now, AvailableAt: now}); err != nil {
				return err
			}
		}

		return nil
	}))
	stats, err := app.DispatchChat(t.Context(), chatPublisherFunc(func(_ context.Context, h meetings.ChatHint) error {
		if h.ID == "a-fails" {
			return errors.New("independent transient broker error")
		}

		// Simulate elapsed work after an earlier event's retry was calculated.
		// No system clock change and no sleeping; both publishes finish within lease.
		now = now.Add(2 * time.Second)

		return nil
	}))
	t.Logf("observed stats=%+v error=%v", stats, err)
	if err != nil {
		t.Fatalf("one elapsed retry deadline aborted batch acknowledgements: %v", err)
	}

	if stats.Published != 1 || stats.Retried != 1 || stats.Acknowledged != 2 {
		t.Fatalf("unexpected mixed outcome: %+v", stats)
	}

	must(t, store.View(t.Context(), func(r meetings.Reader) error {
		early, err := r.PendingChatHints(now, 100)
		if err != nil {
			return err
		}

		pending, err := r.PendingChatHints(now.Add(3*time.Second), 100)
		if err != nil {
			return err
		}

		if len(early) != 0 || len(pending) != 1 || pending[0].ID != "a-fails" || pending[0].Attempts != 1 || pending[0].LeaseID != "" || pending[0].LeaseUntil != nil || pending[0].AvailableAt.Before(now.Add(time.Second)) || pending[0].AvailableAt.After(now.Add(2*time.Second)) {
			t.Fatal("retry lost, still leased or not based on acknowledgement", early, pending)
		}

		return nil
	}))
	now = now.Add(3 * time.Second)
	retried, err := app.DispatchChat(t.Context(), chatPublisherFunc(func(_ context.Context, h meetings.ChatHint) error {
		if h.ID != "a-fails" || h.Attempts != 2 {
			t.Fatal("successful event replayed or retry identity changed", h.ID, h.Attempts)
		}

		return nil
	}))
	must(t, err)
	if retried.Claimed != 1 || retried.Acknowledged != 1 || retried.Deleted != 1 {
		t.Fatal("failed event lost", retried)
	}
}
