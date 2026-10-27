package memory

import (
	"errors"
	"fmt"
	"reflect"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestFeedAroundBoundsAndCopies(t *testing.T) {
	store := New()
	err := store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: "m"}); err != nil {
			return err
		}

		for i := range 7 {
			if _, err := w.AppendEntry(meetings.FeedEntry{ID: fmt.Sprint(i), MeetingID: "m", Payload: []byte(`{}`)}); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	for _, c := range []struct {
		anchor       string
		limit        int
		want         []uint64
		older, newer bool
	}{
		{"0", 3, []uint64{1, 2, 3}, false, true},
		{"3", 3, []uint64{3, 4, 5}, true, true},
		{"6", 3, []uint64{5, 6, 7}, true, false},
		{"3", 1, []uint64{4}, true, true},
		{"3", 100, []uint64{1, 2, 3, 4, 5, 6, 7}, false, false},
	} {
		err := store.View(t.Context(), func(r meetings.Reader) error {
			page, err := r.FeedAround("m", c.anchor, c.limit)
			if err != nil {
				return err
			}

			got := []uint64{}
			for _, entry := range page.Entries {
				got = append(got, entry.Sequence)
				entry.Payload[0] = '!'
			}

			if !reflect.DeepEqual(got, c.want) || page.HasOlder != c.older || page.HasNewer != c.newer || page.LatestSequence != 7 {
				t.Fatal("around", page)
			}

			entry, err := r.FeedEntry("m", c.anchor)
			if err != nil {
				return err
			}

			if string(entry.Payload) != `{}` {
				t.Fatal("around aliases stored bytes")
			}

			if _, err := r.FeedAround("other", c.anchor, 3); !errors.Is(err, meetings.ErrNotFound) {
				t.Fatal("cross meeting anchor", err)
			}

			return nil
		})
		if err != nil {
			t.Fatal(err)
		}
	}
}
