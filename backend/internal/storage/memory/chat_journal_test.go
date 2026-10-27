package memory

import (
	"context"
	"errors"
	"math"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestChatJournalAtomicRangesAndOverflow(t *testing.T) {
	store := New()
	now := time.Now().UTC()
	change := meetings.ChatChange{MeetingID: "m", Kind: "meeting_changed", ResourceKind: "meeting", ResourceID: "m", CreatedAt: now}
	mustChat := func(err error) {
		t.Helper()
		if err != nil {
			t.Fatal(err)
		}
	}
	mustChat(store.Update(t.Context(), func(w meetings.Writer) error { return w.SaveMeeting(meetings.Meeting{ID: "m"}) }))
	aborted := errors.New("abort")
	appendBatch := func(w meetings.Writer) error {
		if _, err := w.AppendChatChanges("m", "epoch", []meetings.ChatChange{change, change, change}); err != nil {
			return err
		}

		return w.EnqueueChatHint(meetings.ChatHint{ID: "hint", Target: "meeting", TargetID: "m", MeetingID: "m", Epoch: "epoch", LatestSequence: 3, SchemaVersion: 1, CreatedAt: now, AvailableAt: now})
	}
	err := store.Update(t.Context(), func(w meetings.Writer) error {
		if err := appendBatch(w); err != nil {
			return err
		}

		return aborted
	})
	if !errors.Is(err, aborted) {
		t.Fatal(err)
	}

	mustChat(store.View(t.Context(), func(r meetings.Reader) error {
		if _, err := r.ChatStream("m"); !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("stream escaped rollback", err)
		}

		hints, err := r.PendingChatHints(now, 100)
		if len(hints) != 0 {
			t.Fatal("outbox escaped rollback")
		}

		return err
	}))
	mustChat(store.Update(t.Context(), appendBatch))
	var retained meetings.Reader
	mustChat(store.View(t.Context(), func(r meetings.Reader) error {
		retained = r
		stream, err := r.ChatStream("m")
		if err != nil {
			return err
		}

		page, err := r.ChatChanges("m", 0, stream.LatestSequence, 2)
		if err != nil {
			return err
		}

		if len(page.Changes) != 2 || !page.HasMore || page.Changes[1].Sequence != 2 {
			t.Fatal("bounded changes", page)
		}

		page.Changes[0].Kind = "mutated"
		done := make(chan error, 1)
		go func() {
			done <- store.Update(t.Context(), func(w meetings.Writer) error {
				stream, err := w.AppendChatChanges("m", "ignored-new-epoch", []meetings.ChatChange{change})
				if stream.Epoch != "epoch" {
					t.Error("epoch rotated")
				}

				return err
			})
		}()
		if err := <-done; err != nil {
			return err
		}

		page, err = r.ChatChanges("m", 2, 3, 2)
		if err != nil {
			return err
		}

		if len(page.Changes) != 1 || page.HasMore || page.Changes[0].Sequence != 3 {
			t.Fatal("through barrier moved", page)
		}

		snapshot, err := r.ChatStream("m")
		if err != nil {
			return err
		}

		if snapshot != stream {
			t.Fatal("stream escaped snapshot")
		}

		return nil
	}))
	if _, err := retained.ChatStream("m"); !errors.Is(err, meetings.ErrTransactionClosed) {
		t.Fatal("closed stream", err)
	}

	stream := store.data.streams["m"]
	stream.LatestSequence = math.MaxUint64 - 1
	stream.RetainedAfter = math.MaxUint64 - 1
	store.data.streams["m"] = stream
	mustChat(store.Update(t.Context(), func(w meetings.Writer) error {
		_, err := w.AppendChatChanges("m", "ignored", []meetings.ChatChange{change})
		return err
	}))
	err = store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: "m", Title: "rollback"}); err != nil {
			return err
		}

		_, err := w.AppendChatChanges("m", "ignored", []meetings.ChatChange{change})

		return err
	})
	if !errors.Is(err, meetings.ErrInvalidRecord) {
		t.Fatal("overflow", err)
	}

	mustChat(store.View(t.Context(), func(r meetings.Reader) error {
		meeting, err := r.Meeting("m")
		if err != nil {
			return err
		}

		if meeting.Title != "" {
			t.Fatal("overflow leaked another write")
		}

		page, err := r.ChatChanges("m", math.MaxUint64-1, math.MaxUint64, 1)
		if err != nil {
			return err
		}

		if len(page.Changes) != 1 || page.Changes[0].Sequence != math.MaxUint64 {
			t.Fatal("uint64 cursor", page)
		}

		if _, err := r.ChatChanges("m", 0, math.MaxUint64, 1); !errors.Is(err, meetings.ErrChangeCursorInvalid) {
			t.Fatal("retention cursor accepted", err)
		}

		return nil
	}))
	canceled, cancel := context.WithCancel(t.Context())
	err = store.View(canceled, func(r meetings.Reader) error { cancel(); _, err := r.PendingChatHints(now, 1); return err })
	if !errors.Is(err, context.Canceled) {
		t.Fatal("cancel", err)
	}
}

func TestChatTerminalHintsAndRecipientRemoval(t *testing.T) {
	store := New()
	now := time.Now().UTC()
	change := meetings.ChatChange{MeetingID: "m", Kind: "history_invalidated", CreatedAt: now}
	err := store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: "m"}); err != nil {
			return err
		}

		if _, err := w.AppendChatChanges("m", "epoch", []meetings.ChatChange{change}); err != nil {
			return err
		}

		for _, h := range []meetings.ChatHint{
			{ID: "meeting", Target: "meeting", TargetID: "m", MeetingID: "m", Epoch: "epoch", SchemaVersion: 1, CreatedAt: now, AvailableAt: now},
			{ID: "terminal", Target: "user", TargetID: "survivor", MeetingID: "m", Terminal: true, SchemaVersion: 1, CreatedAt: now, AvailableAt: now},
			{ID: "removed", Target: "user", TargetID: "deleted-user", MeetingID: "m", Epoch: "epoch", SchemaVersion: 1, CreatedAt: now, AvailableAt: now},
		} {
			if err := w.EnqueueChatHint(h); err != nil {
				return err
			}
		}

		if err := w.RemoveUser("deleted-user"); err != nil {
			return err
		}

		return w.DeleteMeeting("m")
	})
	if err != nil {
		t.Fatal(err)
	}

	err = store.View(t.Context(), func(r meetings.Reader) error {
		if _, err := r.ChatStream("m"); !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("deleted stream", err)
		}

		hints, err := r.PendingChatHints(now, 100)
		if err != nil {
			return err
		}

		if len(hints) != 1 || hints[0].ID != "terminal" {
			t.Fatal("terminal recipient lifecycle", hints)
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}
