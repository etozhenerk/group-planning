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
}
