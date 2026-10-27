package memory

import (
	"context"
	"errors"
	"math"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestChatReadMarkersRollbackCopiesUint64AndCancellation(t *testing.T) {
	store := New()
	if err := store.Update(t.Context(), func(w meetings.Writer) error {
		return w.InitializeChatReadMarkers(time.Time{})
	}); !errors.Is(err, meetings.ErrInvalidRecord) {
		t.Fatal("empty initialization accepted invalid timestamp", err)
	}

	now := time.Now().UTC()
	run := func(fn func(meetings.Writer) error) {
		t.Helper()
		if err := store.Update(t.Context(), fn); err != nil {
			t.Fatal(err)
		}
	}
	run(func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: "m", OrganizerID: "owner"}); err != nil {
			return err
		}

		_, err := w.AppendEntry(meetings.FeedEntry{ID: "entry", MeetingID: "m", ActorID: "owner", Kind: "message", Payload: []byte(`{}`)})

		return err
	})
	store.data.feed["m"][0].Sequence = math.MaxUint64
	abort := errors.New("rollback")
	if err := store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.InitializeChatReadMarkers(now); err != nil {
			return err
		}

		return abort
	}); !errors.Is(err, abort) {
		t.Fatal(err)
	}

	run(func(w meetings.Writer) error {
		if _, err := w.ChatReadMarker("m", "owner"); !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("uncommitted baseline", err)
		}

		return w.InitializeChatReadMarkers(now)
	})
	run(func(w meetings.Writer) error {
		m, err := w.ChatReadMarker("m", "owner")
		if err != nil {
			return err
		}

		if m.Baseline != math.MaxUint64 || m.ReadThrough != 0 {
			t.Fatal("uint64 baseline", m)
		}

		m.Baseline = 0
		_, _, err = w.AdvanceChatReadMarker("m", "owner", math.MaxUint64, now)

		return err
	})
	if err := store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.RemoveUser("owner"); err != nil {
			return err
		}

		return abort
	}); !errors.Is(err, abort) {
		t.Fatal(err)
	}

	var retained meetings.Reader
	if err := store.View(t.Context(), func(r meetings.Reader) error {
		retained = r
		m, err := r.ChatReadMarker("m", "owner")
		if err != nil {
			return err
		}

		if m.Baseline != math.MaxUint64 || m.ReadThrough != math.MaxUint64 {
			t.Fatal("copy or rollback leaked", m)
		}

		_, _, err = r.(meetings.Writer).AdvanceChatReadMarker("m", "owner", 1, now)
		if !errors.Is(err, meetings.ErrReadOnly) {
			t.Fatal("readonly marker", err)
		}

		return nil
	}); err != nil {
		t.Fatal(err)
	}

	if _, err := retained.ChatReadMarker("m", "owner"); !errors.Is(err, meetings.ErrTransactionClosed) {
		t.Fatal("retained read", err)
	}

	canceled, cancel := context.WithCancel(t.Context())
	cancel()
	if err := store.Update(canceled, func(w meetings.Writer) error { return w.InitializeChatReadMarkers(now) }); !errors.Is(err, context.Canceled) {
		t.Fatal("cancel", err)
	}

	run(func(w meetings.Writer) error { return w.DeleteMeeting("m") })
	if err := store.View(t.Context(), func(r meetings.Reader) error {
		_, err := r.ChatReadMarker("m", "owner")
		if !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("marker survived meeting", err)
		}

		return nil
	}); err != nil {
		t.Fatal(err)
	}
}
