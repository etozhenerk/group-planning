package postgres

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestChatDispatchLeaseRollbackRecoveryIntegration(t *testing.T) {
	db, id, now := chatSQLFixture(t)
	s := db.Meetings()
	run := func(fn func(meetings.Writer) error) {
		t.Helper()
		if err := s.Update(t.Context(), fn); err != nil {
			t.Fatal(err)
		}
	}
	run(func(w meetings.Writer) error {
		return w.EnqueueChatHint(meetings.ChatHint{ID: id + "-event", Target: "user", TargetID: "u", MeetingID: id, Terminal: true, SchemaVersion: 1, CreatedAt: now, AvailableAt: now})
	})
	abort := errors.New("rollback")
	err := s.Update(t.Context(), func(w meetings.Writer) error {
		_, err := w.LeaseChatHints(now, now.Add(time.Second), "rolled-back", 1)
		if err != nil {
			return err
		}

		return abort
	})
	if !errors.Is(err, abort) {
		t.Fatal(err)
	}

	run(func(w meetings.Writer) error {
		batch, err := w.LeaseChatHints(now, now.Add(time.Second), "first", 1)
		if err != nil {
			return err
		}

		if len(batch) != 1 || batch[0].Attempts != 1 {
			t.Fatalf("claim: %+v", batch)
		}

		*batch[0].LeaseUntil = now.Add(-time.Hour)

		return nil
	})
	run(func(w meetings.Writer) error {
		batch, err := w.LeaseChatHints(now, now.Add(time.Second), "second", 1)
		if len(batch) != 0 {
			t.Fatal("active lease leaked/aliased")
		}

		return err
	})
	now = now.Add(time.Second)
	run(func(w meetings.Writer) error {
		batch, err := w.LeaseChatHints(now, now.Add(time.Second), "restarted", 1)
		if err != nil {
			return err
		}

		if len(batch) != 1 || batch[0].ID != id+"-event" || batch[0].Attempts != 2 {
			t.Fatal("restart lost stable event", batch)
		}

		ok, err := w.FinishChatHint(id+"-event", "first", now, time.Time{})
		if ok {
			t.Fatal("stale owner acknowledged newer lease")
		}

		return err
	})
	run(func(w meetings.Writer) error {
		ok, err := w.FinishChatHint(id+"-event", "restarted", now, now.Add(time.Minute))
		if !ok {
			t.Fatal("retry did not commit")
		}

		return err
	})
	run(func(w meetings.Writer) error {
		batch, err := w.LeaseChatHints(now, now.Add(time.Second), "early", 1)
		if len(batch) != 0 {
			t.Fatal("retry ignored backoff")
		}

		return err
	})
	now = now.Add(time.Minute)
	run(func(w meetings.Writer) error {
		batch, err := w.LeaseChatHints(now, now.Add(time.Second), "final", 1)
		if err != nil {
			return err
		}

		if len(batch) != 1 {
			t.Fatal("retry missing")
		}

		ok, err := w.FinishChatHint(id+"-event", "final", now, time.Time{})
		if !ok {
			t.Fatal("ack missing")
		}

		return err
	})
	run(func(w meetings.Writer) error {
		count, err := w.DeleteDispatchedChatHints(100)
		if count != 1 {
			t.Fatal("delivered row retained", count)
		}

		return err
	})
}

type chatDispatchPublisherFunc func(context.Context, meetings.ChatHint) error

func (f chatDispatchPublisherFunc) PublishChat(ctx context.Context, hint meetings.ChatHint) error {
	return f(ctx, hint)
}

func TestChatDispatchElapsedRetryIntegration(t *testing.T) {
	db, id, now := chatSQLFixture(t)
	store := db.Meetings()
	requireChatSQL(t, store.Update(t.Context(), func(w meetings.Writer) error {
		for _, suffix := range []string{"-a-fails", "-b-succeeds"} {
			if err := w.EnqueueChatHint(meetings.ChatHint{ID: id + suffix, Target: "user", TargetID: id + "-owner", MeetingID: id, Terminal: true, SchemaVersion: 1, CreatedAt: now, AvailableAt: now}); err != nil {
				return err
			}
		}

		return nil
	}))
	app := meetings.NewService(store, func() time.Time { return now })
	published := map[string]int{}
	publisher := chatDispatchPublisherFunc(func(_ context.Context, hint meetings.ChatHint) error {
		published[hint.ID]++
		if hint.ID == id+"-a-fails" && published[hint.ID] == 1 {
			return errors.New("transient broker failure")
		}

		if hint.ID == id+"-b-succeeds" {
			now = now.Add(2 * time.Second)
		}

		return nil
	})
	stats, err := app.DispatchChat(t.Context(), publisher)
	requireChatSQL(t, err)
	if stats.Published != 1 || stats.Retried != 1 || stats.Acknowledged != 2 || stats.Deleted != 1 {
		t.Fatal("mixed batch not acknowledged", stats)
	}

	requireChatSQL(t, store.View(t.Context(), func(r meetings.Reader) error {
		early, err := r.PendingChatHints(now, 100)
		if err != nil {
			return err
		}

		pending, err := r.PendingChatHints(now.Add(3*time.Second), 100)
		if err != nil {
			return err
		}

		if len(early) != 0 || len(pending) != 1 || pending[0].ID != id+"-a-fails" || pending[0].Attempts != 1 || pending[0].LeaseID != "" || pending[0].LeaseUntil != nil || pending[0].AvailableAt.Before(now.Add(time.Second)) || pending[0].AvailableAt.After(now.Add(2*time.Second)) {
			t.Fatal("retry lost, still leased or not based on acknowledgement", early, pending)
		}

		return nil
	}))
	now = now.Add(3 * time.Second)
	retried, err := app.DispatchChat(t.Context(), publisher)
	requireChatSQL(t, err)
	if retried.Claimed != 1 || retried.Acknowledged != 1 || retried.Deleted != 1 || published[id+"-a-fails"] != 2 || published[id+"-b-succeeds"] != 1 {
		t.Fatal("successful event replayed or failed event lost", retried, published)
	}
}
