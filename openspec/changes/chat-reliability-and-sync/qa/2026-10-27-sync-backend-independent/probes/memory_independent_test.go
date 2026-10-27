package memory

import (
	"fmt"
	"math"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

// Exhaust all windows in a sparse uint64 sequence space. No product mutation.
func TestIndependentAroundSparseUint64Windows(t *testing.T) {
	s := New()
	err := s.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: "independent"}); err != nil {
			return err
		}
		for i := range 101 {
			_, err := w.AppendEntry(meetings.FeedEntry{ID: fmt.Sprint(i), MeetingID: "independent", Payload: []byte(`{"text":"qa"}`)})
			if err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	for i := range 101 {
		s.data.feed["independent"][i].Sequence = math.MaxUint64 - uint64(100-i)*17
	}
	checked := 0
	for anchor := range 101 {
		for limit := 1; limit <= 100; limit++ {
			err := s.View(t.Context(), func(r meetings.Reader) error {
				page, err := r.FeedAround("independent", fmt.Sprint(anchor), limit)
				if err != nil {
					return err
				}
				if len(page.Entries) != limit || page.LatestSequence != math.MaxUint64 {
					t.Fatalf("anchor=%d limit=%d count=%d latest=%d", anchor, limit, len(page.Entries), page.LatestSequence)
				}
				start := -1
				found := false
				for i, entry := range page.Entries {
					if i == 0 {
						for j, original := range s.data.feed["independent"] {
							if original.ID == entry.ID {
								start = j
								break
							}
						}
					}
					if start < 0 || entry.ID != fmt.Sprint(start+i) || entry.Sequence != math.MaxUint64-uint64(100-start-i)*17 {
						t.Fatalf("noncontiguous or inaccurate window at anchor=%d limit=%d", anchor, limit)
					}
					found = found || entry.ID == fmt.Sprint(anchor)
					entry.Payload[0] = '!'
				}
				if !found || page.HasOlder != (start > 0) || page.HasNewer != (start+limit < 101) {
					t.Fatalf("anchor/continuation mismatch at anchor=%d limit=%d", anchor, limit)
				}
				copy, err := r.FeedEntry("independent", fmt.Sprint(anchor))
				if err != nil {
					return err
				}
				if string(copy.Payload) != `{"text":"qa"}` {
					t.Fatal("returned bytes alias store")
				}
				checked++
				return nil
			})
			if err != nil {
				t.Fatal(err)
			}
		}
	}
	t.Logf("validated %d around windows over sparse sequences ending at uint64 max; bounds, order, anchor and clone semantics", checked)
}
