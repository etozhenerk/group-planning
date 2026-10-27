package postgres

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"reflect"
	"strconv"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestFeedWindowIntegration(t *testing.T) {
	db := integrationDB(t)
	id := fmt.Sprintf("bounded-%x", randBytes(12))
	store := db.Meetings()
	t.Cleanup(func() {
		if err := store.Update(context.Background(), func(w meetings.Writer) error { return w.DeleteMeeting(id) }); err != nil {
			t.Error("fixture cleanup", err)
		}
	})
	positions := []uint64{1, 3, 9, math.MaxInt64 + 1, math.MaxUint64}
	err := store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: id}); err != nil {
			return err
		}

		// Insert sparse positions directly in this isolated test database. The API
		// cannot generate MaxUint64 entries merely to test its numeric boundary.
		for i, pos := range positions {
			value := meetings.FeedEntry{ID: fmt.Sprintf("%s-%d", id, i), MeetingID: id, Sequence: pos, ActorID: "actor", ClientRequestID: fmt.Sprint(i), Kind: "message", Payload: []byte(`{"text":"original"}`)}
			if err := w.(*transaction).save(value, `INSERT INTO feed_entries(id,meeting_id,sequence,actor_id,client_request_id,document) VALUES($1,$2,$3::text::numeric,$4,$5,$6)`, value.ID, id, strconv.FormatUint(pos, 10), value.ActorID, value.ClientRequestID); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	p := func(v uint64) *uint64 { return &v }
	cases := []struct {
		name  string
		query meetings.FeedQuery
		want  []uint64
		more  bool
	}{
		{"initial", meetings.FeedQuery{Limit: 2}, []uint64{math.MaxInt64 + 1, math.MaxUint64}, true},
		{"after-zero", meetings.FeedQuery{Limit: 2, After: p(0)}, []uint64{1, 3}, true},
		{"after-gap", meetings.FeedQuery{Limit: 2, After: p(4)}, []uint64{9, math.MaxInt64 + 1}, true},
		{"after-high", meetings.FeedQuery{Limit: 2, After: p(math.MaxInt64 + 1)}, []uint64{math.MaxUint64}, false},
		{"after-max", meetings.FeedQuery{Limit: 2, After: p(math.MaxUint64)}, []uint64{}, false},
		{"before-max", meetings.FeedQuery{Limit: 2, Before: p(math.MaxUint64)}, []uint64{9, math.MaxInt64 + 1}, true},
		{"before-gap", meetings.FeedQuery{Limit: 2, Before: p(8)}, []uint64{1, 3}, false},
		{"before-zero", meetings.FeedQuery{Limit: 2, Before: p(0)}, []uint64{}, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			err := store.View(t.Context(), func(r meetings.Reader) error {
				page, err := r.FeedWindow(id, c.query)
				if err != nil {
					return err
				}

				got := []uint64{}
				for _, item := range page.Entries {
					got = append(got, item.Sequence)
				}

				if !reflect.DeepEqual(got, c.want) || page.HasMore != c.more || page.LatestSequence != math.MaxUint64 {
					t.Fatalf("page=%+v positions=%v", page, got)
				}

				return nil
			})
			if err != nil {
				t.Fatal(err)
			}
		})
	}

	for _, anchor := range []struct {
		id           string
		want         []uint64
		older, newer bool
	}{
		{id + "-0", positions[:3], false, true},
		{id + "-2", positions[1:4], true, true},
		{id + "-4", positions[2:], true, false},
	} {
		err := store.View(t.Context(), func(r meetings.Reader) error {
			page, err := r.FeedAround(id, anchor.id, 3)
			if err != nil {
				return err
			}

			got := []uint64{}
			for _, entry := range page.Entries {
				got = append(got, entry.Sequence)
			}

			if !reflect.DeepEqual(got, anchor.want) || page.HasOlder != anchor.older || page.HasNewer != anchor.newer || page.LatestSequence != math.MaxUint64 {
				t.Fatal("around window", page)
			}

			return nil
		})
		if err != nil {
			t.Fatal(err)
		}
	}

	err = store.View(t.Context(), func(r meetings.Reader) error {
		first, err := r.FeedEntry(id, id+"-0")
		if err != nil {
			return err
		}

		var payload struct {
			Text string `json:"text"`
		}
		if err := json.Unmarshal(first.Payload, &payload); err != nil || payload.Text != "original" {
			t.Fatal("original lookup payload", err)
		}

		originalPayload := bytes.Clone(first.Payload)
		first.Payload[0] = '!'
		again, err := r.MessageByRequest(id, "actor", "0")
		if err != nil {
			return err
		}

		if first.ID != again.ID || !bytes.Equal(again.Payload, originalPayload) {
			t.Fatal("lookup copy")
		}

		again.Payload[0] = '?'
		final, err := r.FeedEntry(id, first.ID)
		if err != nil {
			return err
		}

		if !bytes.Equal(final.Payload, originalPayload) {
			t.Fatal("request lookup aliased the stored payload")
		}

		for _, lookup := range []func() error{
			func() error { _, err := r.FeedEntry(id+"-other", first.ID); return err },
			func() error { _, err := r.MessageByRequest(id, "other", "0"); return err },
			func() error { _, err := r.MessageByRequest(id, "actor", ""); return err },
		} {
			if err := lookup(); !errors.Is(err, meetings.ErrNotFound) {
				t.Fatal("lookup scope", err)
			}
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	err = store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: id, Title: "must roll back"}); err != nil {
			return err
		}

		_, err := w.AppendEntry(meetings.FeedEntry{ID: id + "overflow", MeetingID: id, ActorID: "actor", ClientRequestID: "overflow", Payload: []byte(`{}`)})

		return err
	})
	if !errors.Is(err, meetings.ErrInvalidRecord) {
		t.Fatal("sequence overflow", err)
	}

	err = store.View(t.Context(), func(r meetings.Reader) error {
		meeting, err := r.Meeting(id)
		if err != nil {
			return err
		}

		if meeting.Title != "" {
			t.Fatal("overflow committed an earlier write")
		}

		page, err := r.FeedWindow(id, meetings.FeedQuery{Limit: 100})
		if err != nil {
			return err
		}

		if len(page.Entries) != len(positions) || page.LatestSequence != math.MaxUint64 || page.HasMore {
			t.Fatal("overflow changed feed", page)
		}

		if _, err := r.FeedEntry(id, id+"overflow"); !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("overflow entry committed", err)
		}

		if _, err := r.MessageByRequest(id, "actor", "overflow"); !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("overflow intent committed", err)
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestFeedWindowSnapshotRollbackIntegration(t *testing.T) {
	db := integrationDB(t)
	id := fmt.Sprintf("bounded-snapshot-%x", randBytes(12))
	store := db.Meetings()
	t.Cleanup(func() {
		if err := store.Update(context.Background(), func(w meetings.Writer) error { return w.DeleteMeeting(id) }); err != nil {
			t.Error("fixture cleanup", err)
		}
	})
	if err := store.Update(t.Context(), func(w meetings.Writer) error { return w.SaveMeeting(meetings.Meeting{ID: id}) }); err != nil {
		t.Fatal(err)
	}

	value := meetings.FeedEntry{ID: id + "-entry", MeetingID: id, ActorID: "actor", ClientRequestID: "request", Payload: []byte(`{}`)}
	aborted := errors.New("abort")
	err := store.Update(t.Context(), func(w meetings.Writer) error {
		if _, err := w.AppendEntry(value); err != nil {
			return err
		}

		return aborted
	})
	if !errors.Is(err, aborted) {
		t.Fatal(err)
	}

	var retained meetings.Reader
	err = store.View(t.Context(), func(r meetings.Reader) error {
		retained = r
		empty, err := r.FeedWindow(id, meetings.FeedQuery{Limit: 1})
		if err != nil {
			return err
		}

		if empty.Entries == nil || len(empty.Entries) != 0 || empty.HasMore || empty.LatestSequence != 0 {
			t.Fatal("empty after rollback", empty)
		}

		if _, err := r.FeedEntry(id, value.ID); !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("rolled back ID", err)
		}

		if _, err := r.MessageByRequest(id, "actor", "request"); !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("rolled back intent", err)
		}

		done := make(chan error, 1)
		go func() {
			done <- store.Update(t.Context(), func(w meetings.Writer) error { _, err := w.AppendEntry(value); return err })
		}()
		if err := <-done; err != nil {
			return err
		}

		page, err := r.FeedWindow(id, meetings.FeedQuery{Limit: 1})
		if err != nil {
			return err
		}

		if len(page.Entries) != 0 || page.LatestSequence != 0 {
			t.Fatal("tail and page escaped snapshot", page)
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	if _, err := retained.FeedWindow(id, meetings.FeedQuery{Limit: 1}); !errors.Is(err, meetings.ErrTransactionClosed) {
		t.Fatal("retained window", err)
	}

	if _, err := retained.FeedEntry(id, value.ID); !errors.Is(err, meetings.ErrTransactionClosed) {
		t.Fatal("retained lookup", err)
	}

	ctx, cancel := context.WithCancel(t.Context())
	err = store.View(ctx, func(r meetings.Reader) error {
		cancel()
		for _, lookup := range []func() error{func() error { _, err := r.FeedWindow(id, meetings.FeedQuery{Limit: 1}); return err }, func() error { _, err := r.FeedEntry(id, value.ID); return err }, func() error { _, err := r.MessageByRequest(id, "actor", "request"); return err }} {
			if err := lookup(); !errors.Is(err, context.Canceled) {
				t.Fatal("cancelled lookup", err)
			}
		}

		return nil
	})
	if !errors.Is(err, context.Canceled) {
		t.Fatal("cancelled view", err)
	}
}

func TestFeedStorageCancellationErrors(t *testing.T) {
	for _, cause := range []error{context.Canceled, context.DeadlineExceeded} {
		wrapped := fmt.Errorf("query: %w", cause)
		if !errors.Is(storageError(wrapped), cause) {
			t.Fatal("lost cancellation cause")
		}
	}
}
