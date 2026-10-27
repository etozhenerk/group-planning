package memory

import (
	"errors"
	"math"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestChatRetentionCountBoundAndBoundedDeletes(t *testing.T) {
	store := New()
	now := time.Now().UTC()
	err := store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: "m"}); err != nil {
			return err
		}

		changes := make([]meetings.ChatChange, 2005)
		for i := range changes {
			changes[i] = meetings.ChatChange{MeetingID: "m", Kind: "history_invalidated", CreatedAt: now}
		}

		if _, err := w.AppendChatChanges("m", "epoch", changes); err != nil {
			return err
		}

		stream, err := w.TrimChatStream("m", time.Time{}, 3)
		if err == nil && (stream.RetainedAfter != 2002 || stream.LatestSequence != 2005) {
			t.Fatal("count boundary", stream)
		}

		return err
	})
	if err != nil {
		t.Fatal(err)
	}

	if len(store.data.changes["m"]) != 1005 {
		t.Fatal("physical deletion was not bounded")
	}

	err = store.View(t.Context(), func(r meetings.Reader) error {
		if _, err := r.ChatChanges("m", 2001, 2005, 10); !errors.Is(err, meetings.ErrChangeCursorInvalid) {
			t.Fatal("retained boundary accepted")
		}

		page, err := r.ChatChanges("m", 2002, 2005, 10)
		if err == nil && (len(page.Changes) != 3 || page.HasMore) {
			t.Fatal("remaining changes", page)
		}

		return err
	})
	if err != nil {
		t.Fatal(err)
	}

	stream := store.data.streams["m"]
	stream.LatestSequence = math.MaxUint64
	store.data.streams["m"] = stream
	err = store.Update(t.Context(), func(w meetings.Writer) error {
		stream, err := w.TrimChatStream("m", time.Time{}, 100000)
		if err == nil && stream.RetainedAfter != math.MaxUint64-100000 {
			t.Fatal("uint64 count boundary", stream)
		}

		return err
	})
	if err != nil {
		t.Fatal(err)
	}
}
