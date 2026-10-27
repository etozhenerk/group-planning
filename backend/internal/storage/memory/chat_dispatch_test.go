package memory

import (
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestChatDispatchLeaseRollbackRecoveryAndCopies(t *testing.T) {
	s := New()
	now := time.Now().UTC()
	run := func(fn func(meetings.Writer) error) {
		t.Helper()
		if err := s.Update(t.Context(), fn); err != nil {
			t.Fatal(err)
		}
	}
	run(func(w meetings.Writer) error {
		return w.EnqueueChatHint(meetings.ChatHint{ID: "event", Target: "user", TargetID: "u", MeetingID: "deleted", Terminal: true, SchemaVersion: 1, CreatedAt: now, AvailableAt: now})
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

		if len(batch) != 1 || batch[0].ID != "event" || batch[0].Attempts != 2 {
			t.Fatal("restart lost stable event", batch)
		}

		ok, err := w.FinishChatHint("event", "first", now, time.Time{})
		if ok {
			t.Fatal("stale owner acknowledged newer lease")
		}

		return err
	})
	run(func(w meetings.Writer) error {
		ok, err := w.FinishChatHint("event", "restarted", now, now.Add(time.Minute))
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

		ok, err := w.FinishChatHint("event", "final", now, time.Time{})
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
