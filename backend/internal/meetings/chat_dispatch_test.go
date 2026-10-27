package meetings_test

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

type chatPublisherFunc func(context.Context, meetings.ChatHint) error

func (f chatPublisherFunc) PublishChat(ctx context.Context, h meetings.ChatHint) error {
	return f(ctx, h)
}

func TestChatDispatcherBoundedMultiBatchBacklogAndRetry(t *testing.T) {
	store := memory.New()
	now := time.Now().UTC()
	app := meetings.NewService(store, func() time.Time { return now })
	must(t, store.Update(ctx, func(w meetings.Writer) error {
		// 5 messages/s * 60s * (one meeting + three recipients), not a timing benchmark.
		for i := range 1200 {
			if err := w.EnqueueChatHint(meetings.ChatHint{ID: fmt.Sprint(i), Target: "user", TargetID: fmt.Sprint(i % 3), MeetingID: "deleted", Terminal: true, SchemaVersion: 1, CreatedAt: now, AvailableAt: now}); err != nil {
				return err
			}
		}

		return nil
	}))
	published := map[string]int{}
	publisher := chatPublisherFunc(func(ctx context.Context, h meetings.ChatHint) error {
		// A View inside publication proves the write transaction is no longer held.
		if err := store.View(ctx, func(meetings.Reader) error { return nil }); err != nil {
			return err
		}

		published[h.ID]++
		if h.ID == "0" && published[h.ID] == 1 {
			return errors.New("broker failed")
		}

		return nil
	})
	first, err := app.DispatchChat(ctx, publisher)
	must(t, err)
	if first.Claimed != 1000 || first.Batches != 10 || !first.More || first.Retried != 1 {
		t.Fatal("unbounded/incomplete drain", first)
	}

	second, err := app.DispatchChat(ctx, publisher)
	must(t, err)
	if second.Claimed != 200 || second.More {
		t.Fatal("backlog did not drain", second)
	}

	now = now.Add(3 * time.Second)
	retry, err := app.DispatchChat(ctx, publisher)
	must(t, err)
	if retry.Claimed != 1 || published["0"] != 2 || first.Deleted+second.Deleted+retry.Deleted != 1200 {
		t.Fatal("retry/cleanup", retry)
	}

	stopped, cancel := context.WithCancel(ctx)
	cancel()
	_, err = app.DispatchChat(stopped, publisher)
	assertError(t, err, context.Canceled)
}

type failChatAckStore struct {
	meetings.Store
	updates int
	failure error
}

func (s *failChatAckStore) Update(ctx context.Context, fn func(meetings.Writer) error) error {
	s.updates++
	if s.updates == 2 {
		return s.failure
	}

	return s.Store.Update(ctx, fn)
}

func TestChatDispatcherCrashAfterPublishReplaysSameEvent(t *testing.T) {
	store := memory.New()
	now := time.Now().UTC()
	failure := errors.New("ack store unavailable")
	must(t, store.Update(ctx, func(w meetings.Writer) error {
		return w.EnqueueChatHint(meetings.ChatHint{ID: "stable-event", Target: "user", TargetID: "u", MeetingID: "deleted", Terminal: true, SchemaVersion: 1, CreatedAt: now, AvailableAt: now})
	}))
	failing := meetings.NewService(&failChatAckStore{Store: store, failure: failure}, func() time.Time { return now })
	ids := []string{}
	publisher := chatPublisherFunc(func(_ context.Context, h meetings.ChatHint) error { ids = append(ids, h.ID); return nil })
	first, err := failing.DispatchChat(ctx, publisher)
	assertError(t, err, failure)
	if first.Published != 1 || first.Acknowledged != 0 {
		t.Fatal("uncommitted ack counted", first)
	}

	restarted := meetings.NewService(store, func() time.Time { return now })
	quiet, err := restarted.DispatchChat(ctx, publisher)
	must(t, err)
	if quiet.Claimed != 0 {
		t.Fatal("active claim reused")
	}

	now = now.Add(31 * time.Second)
	done, err := restarted.DispatchChat(ctx, publisher)
	must(t, err)
	if done.Acknowledged != 1 || len(ids) != 2 || ids[0] != ids[1] {
		t.Fatal("crash lost/changed durable event", done, ids)
	}
}

func TestChatRetentionDrainsSeveralShortBatches(t *testing.T) {
	store := memory.New()
	now := time.Now().UTC()
	old := now.Add(-8 * 24 * time.Hour)
	must(t, store.Update(ctx, func(w meetings.Writer) error {
		for i := range 2500 {
			if err := w.EnqueueChatHint(meetings.ChatHint{ID: fmt.Sprint(i), Target: "user", TargetID: "u", MeetingID: "deleted", Terminal: true, SchemaVersion: 1, CreatedAt: old, AvailableAt: old}); err != nil {
				return err
			}
		}

		return nil
	}))
	app := meetings.NewService(store, func() time.Time { return now })
	more, err := app.MaintainChatBatches(ctx)
	must(t, err)
	if !more {
		t.Fatal("unbounded retention drain did not yield")
	}

	more, err = app.MaintainChatBatches(ctx)
	must(t, err)
	if more {
		t.Fatal("retention backlog not drained")
	}

	must(t, store.View(ctx, func(r meetings.Reader) error {
		hints, err := r.PendingChatHints(now, 100)
		if err != nil {
			return err
		}

		if len(hints) != 25 {
			t.Fatalf("lost/coalesced replacements: %d", len(hints))
		}

		for _, h := range hints {
			if !h.Invalidation || !h.Terminal || h.CreatedAt.Before(now) {
				t.Fatal("stale pending survived", h.ID)
			}
		}

		return nil
	}))
}
