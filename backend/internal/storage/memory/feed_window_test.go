package memory

import (
	"context"
	"errors"
	"fmt"
	"math"
	"reflect"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestFeedWindowBoundsLookupsAndCopies(t *testing.T) {
	store := New()
	err := store.Update(t.Context(), func(w meetings.Writer) error {
		for _, id := range []string{"m", "other", "empty"} {
			if err := w.SaveMeeting(meetings.Meeting{ID: id}); err != nil {
				return err
			}
		}

		for i := range 5 {
			_, err := w.AppendEntry(meetings.FeedEntry{ID: fmt.Sprint(i), MeetingID: "m", ActorID: "a", ClientRequestID: fmt.Sprint(i), Kind: "message", Payload: []byte(`{"text":"original"}`), Attachments: []meetings.Media{{ID: "attachment"}}})
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	// Storage cursors are positions, not slice offsets. Exercise gaps and both sides
	// of MaxInt64 without allocating an impossible history.
	positions := []uint64{1, 3, 9, math.MaxInt64 + 1, math.MaxUint64}
	for i, pos := range positions {
		store.data.feed["m"][i].Sequence = pos
	}

	p := func(n uint64) *uint64 { return &n }
	cases := []struct {
		name  string
		query meetings.FeedQuery
		want  []uint64
		more  bool
	}{
		{"initial", meetings.FeedQuery{Limit: 2}, []uint64{math.MaxInt64 + 1, math.MaxUint64}, true},
		{"after-zero", meetings.FeedQuery{Limit: 2, After: p(0)}, []uint64{1, 3}, true},
		{"after-gap", meetings.FeedQuery{Limit: 2, After: p(4)}, []uint64{9, math.MaxInt64 + 1}, true},
		{"exact-remainder", meetings.FeedQuery{Limit: 2, After: p(9)}, []uint64{math.MaxInt64 + 1, math.MaxUint64}, false},
		{"after-max", meetings.FeedQuery{Limit: 2, After: p(math.MaxUint64)}, []uint64{}, false},
		{"before-high", meetings.FeedQuery{Limit: 2, Before: p(math.MaxUint64)}, []uint64{9, math.MaxInt64 + 1}, true},
		{"before-gap", meetings.FeedQuery{Limit: 2, Before: p(8)}, []uint64{1, 3}, false},
		{"before-zero", meetings.FeedQuery{Limit: 2, Before: p(0)}, []uint64{}, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			err := store.View(t.Context(), func(r meetings.Reader) error {
				page, err := r.FeedWindow("m", c.query)
				if err != nil {
					return err
				}

				got := []uint64{}
				for _, entry := range page.Entries {
					got = append(got, entry.Sequence)
				}

				if !reflect.DeepEqual(got, c.want) || page.HasMore != c.more || page.LatestSequence != math.MaxUint64 {
					t.Fatalf("page=%+v positions=%v", page, got)
				}

				for _, entry := range page.Entries {
					entry.Payload[0] = '!'
					entry.Attachments[0].ID = "mutated"
				}

				return nil
			})
			if err != nil {
				t.Fatal(err)
			}
		})
	}

	err = store.View(t.Context(), func(r meetings.Reader) error {
		empty, err := r.FeedWindow("empty", meetings.FeedQuery{Limit: 1})
		if err != nil {
			return err
		}

		if empty.Entries == nil || len(empty.Entries) != 0 || empty.LatestSequence != 0 || empty.HasMore {
			t.Fatal("empty page", empty)
		}

		for range 2 {
			for _, lookup := range []func() (meetings.FeedEntry, error){func() (meetings.FeedEntry, error) { return r.FeedEntry("m", "0") }, func() (meetings.FeedEntry, error) { return r.MessageByRequest("m", "a", "0") }} {
				item, err := lookup()
				if err != nil {
					return err
				}

				if string(item.Payload) != `{"text":"original"}` || item.Attachments[0].ID != "attachment" {
					t.Fatal("alias escaped")
				}

				item.Payload[0] = '!'
				item.Attachments[0].ID = "changed"
			}
		}

		for _, lookup := range []func() error{
			func() error { _, err := r.FeedEntry("other", "0"); return err },
			func() error { _, err := r.MessageByRequest("m", "wrong", "0"); return err },
			func() error { _, err := r.MessageByRequest("m", "a", ""); return err },
			func() error { _, err := r.FeedWindow("missing", meetings.FeedQuery{Limit: 1}); return err },
		} {
			if err := lookup(); !errors.Is(err, meetings.ErrNotFound) {
				t.Fatal("scope", err)
			}
		}

		for _, query := range []meetings.FeedQuery{{Limit: 0}, {Limit: 101}, {Limit: 1, After: p(1), Before: p(2)}} {
			if _, err := r.FeedWindow("m", query); !errors.Is(err, meetings.ErrInvalidRecord) {
				t.Fatal("invalid query", err)
			}
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	// Sequence exhaustion must fail atomically, without wrapping to zero.
	err = store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: "m", Title: "must roll back"}); err != nil {
			return err
		}

		_, err := w.AppendEntry(meetings.FeedEntry{ID: "overflow", MeetingID: "m", ActorID: "a", ClientRequestID: "overflow", Payload: []byte(`{}`)})

		return err
	})
	if !errors.Is(err, meetings.ErrInvalidRecord) {
		t.Fatal("overflow", err)
	}

	err = store.View(t.Context(), func(r meetings.Reader) error {
		meeting, err := r.Meeting("m")
		if err != nil {
			return err
		}

		if meeting.Title != "" {
			t.Fatal("overflow committed an earlier write")
		}

		page, err := r.FeedWindow("m", meetings.FeedQuery{Limit: 100})
		if err != nil {
			return err
		}

		if len(page.Entries) != len(positions) || page.LatestSequence != math.MaxUint64 || page.HasMore {
			t.Fatal("overflow changed feed", page)
		}

		if _, err := r.FeedEntry("m", "overflow"); !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("overflow entry committed", err)
		}

		if _, err := r.MessageByRequest("m", "a", "overflow"); !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("overflow intent committed", err)
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestFeedWindowSnapshotRollbackAndCancellation(t *testing.T) {
	store := New()
	if err := store.Update(t.Context(), func(w meetings.Writer) error { return w.SaveMeeting(meetings.Meeting{ID: "m"}) }); err != nil {
		t.Fatal(err)
	}

	entry := meetings.FeedEntry{ID: "id", MeetingID: "m", ActorID: "a", ClientRequestID: "req", Payload: []byte(`{}`)}
	abort := errors.New("abort")
	err := store.Update(t.Context(), func(w meetings.Writer) error {
		if _, err := w.AppendEntry(entry); err != nil {
			return err
		}

		return abort
	})
	if !errors.Is(err, abort) {
		t.Fatal(err)
	}

	var retained meetings.Reader
	err = store.View(t.Context(), func(r meetings.Reader) error {
		retained = r
		if _, err := r.FeedEntry("m", "id"); !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("rolled back ID", err)
		}

		if _, err := r.MessageByRequest("m", "a", "req"); !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("rolled back intent", err)
		}

		done := make(chan error, 1)
		go func() {
			done <- store.Update(t.Context(), func(w meetings.Writer) error { _, err := w.AppendEntry(entry); return err })
		}()
		if err := <-done; err != nil {
			return err
		}

		page, err := r.FeedWindow("m", meetings.FeedQuery{Limit: 1})
		if err != nil {
			return err
		}

		if len(page.Entries) != 0 || page.LatestSequence != 0 {
			t.Fatal("snapshot changed", page)
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	if _, err := retained.FeedWindow("m", meetings.FeedQuery{Limit: 1}); !errors.Is(err, meetings.ErrTransactionClosed) {
		t.Fatal("retained page", err)
	}

	if _, err := retained.FeedEntry("m", "id"); !errors.Is(err, meetings.ErrTransactionClosed) {
		t.Fatal("retained entry", err)
	}

	if _, err := retained.MessageByRequest("m", "a", "req"); !errors.Is(err, meetings.ErrTransactionClosed) {
		t.Fatal("retained intent", err)
	}

	ctx, cancel := context.WithCancel(t.Context())
	err = store.View(ctx, func(r meetings.Reader) error {
		cancel()
		for _, lookup := range []func() error{func() error { _, err := r.FeedWindow("m", meetings.FeedQuery{Limit: 1}); return err }, func() error { _, err := r.FeedEntry("m", "id"); return err }, func() error { _, err := r.MessageByRequest("m", "a", "req"); return err }} {
			if err := lookup(); !errors.Is(err, context.Canceled) {
				t.Fatal("cancelled reader", err)
			}
		}

		return nil
	})
	if !errors.Is(err, context.Canceled) {
		t.Fatal(err)
	}
}
