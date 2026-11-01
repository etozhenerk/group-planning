package meetings_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestIndependentExpiredWorkerCannotAckNewLease(t *testing.T) {
	store := memory.New()
	now := time.Date(2026, 10, 27, 15, 0, 0, 0, time.UTC)
	app := meetings.NewService(store, func() time.Time { return now })
	must(t, store.Update(t.Context(), func(w meetings.Writer) error {
		return w.EnqueueChatHint(meetings.ChatHint{ID: "durable-id", Target: "user", TargetID: "u", MeetingID: "gone", Terminal: true, SchemaVersion: 1, CreatedAt: now, AvailableAt: now})
	}))
	var stolen []meetings.ChatHint
	stats, err := app.DispatchChat(t.Context(), chatPublisherFunc(func(ctx context.Context, h meetings.ChatHint) error {
		if h.ID != "durable-id" {
			t.Fatal(h)
		}
		// At the exact expiry another worker takes ownership before the old ACK.
		now = now.Add(30 * time.Second)
		return store.Update(ctx, func(w meetings.Writer) error {
			var err error
			stolen, err = w.LeaseChatHints(now, now.Add(30*time.Second), "new-worker", 1)
			return err
		})
	}))
	must(t, err)
	if stats.Published != 1 || stats.Acknowledged != 0 || stats.Deleted != 0 || len(stolen) != 1 || stolen[0].ID != "durable-id" || stolen[0].Attempts != 2 {
		t.Fatalf("old worker ack=%+v new lease=%+v", stats, stolen)
	}
	// Maintenance must not delete or replace the new worker's active lease.
	now = now.Add(time.Second)
	must(t, app.MaintainChat(t.Context()))
	must(t, store.Update(t.Context(), func(w meetings.Writer) error {
		ok, err := w.FinishChatHint("durable-id", "new-worker", now, time.Time{})
		if err != nil {
			return err
		}
		if !ok {
			t.Fatal("current owner lost lease")
		}
		n, err := w.DeleteDispatchedChatHints(100)
		if n != 1 {
			t.Fatalf("cleanup=%d", n)
		}
		return err
	}))
	t.Logf("expired worker stats=%+v; new owner ACK and cleanup succeeded", stats)
}

func TestIndependentElapsedRetryPersistsAndDoesNotReplaySuccess(t *testing.T) {
	store := memory.New()
	now := time.Date(2026, 10, 27, 15, 0, 0, 0, time.UTC)
	app := meetings.NewService(store, func() time.Time { return now })
	must(t, store.Update(t.Context(), func(w meetings.Writer) error {
		for _, id := range []string{"a-fail", "b-success"} {
			if err := w.EnqueueChatHint(meetings.ChatHint{ID: id, Target: "user", TargetID: "u", MeetingID: "gone", Terminal: true, SchemaVersion: 1, CreatedAt: now, AvailableAt: now}); err != nil {
				return err
			}
		}
		return nil
	}))
	_, err := app.DispatchChat(t.Context(), chatPublisherFunc(func(_ context.Context, h meetings.ChatHint) error {
		if h.ID == "a-fail" {
			return errors.New("broker failure")
		}
		now = now.Add(4 * time.Second)
		return nil
	}))
	must(t, err)
	quiet, err := app.DispatchChat(t.Context(), chatPublisherFunc(func(context.Context, meetings.ChatHint) error { t.Fatal("retry before backoff"); return nil }))
	must(t, err)
	if quiet.Claimed != 0 {
		t.Fatal(quiet)
	}
	now = now.Add(3 * time.Second)
	var ids []string
	retry, err := app.DispatchChat(t.Context(), chatPublisherFunc(func(_ context.Context, h meetings.ChatHint) error {
		ids = append(ids, h.ID)
		if h.Attempts != 2 {
			t.Fatal(h.Attempts)
		}
		return nil
	}))
	must(t, err)
	if len(ids) != 1 || ids[0] != "a-fail" || retry.Acknowledged != 1 || retry.Deleted != 1 {
		t.Fatalf("retry=%+v ids=%v", retry, ids)
	}
	t.Logf("immediate claims=%d delayed retry=%+v IDs=%v", quiet.Claimed, retry, ids)
}
