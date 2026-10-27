package memory

import (
	"errors"
	"fmt"
	"reflect"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestReadSnapshotDetachesNestedResultsDuringCommit(t *testing.T) {
	cases := []struct {
		name string
		read func(meetings.Reader) (any, error)
	}{
		{"meeting", func(r meetings.Reader) (any, error) { return snapshotResult(r.Meeting("m")) }},
		{"feed", func(r meetings.Reader) (any, error) { return snapshotResult(r.Feed("m")) }},
		{"date-poll", func(r meetings.Reader) (any, error) { return snapshotResult(r.DatePoll("date")) }},
		{"place-poll", func(r meetings.Reader) (any, error) { return snapshotResult(r.PlacePoll("place")) }},
		{"task", func(r meetings.Reader) (any, error) { return snapshotResult(r.PreparationTask("task")) }},
		{"cover", func(r meetings.Reader) (any, error) { return snapshotResult(r.Cover("m")) }},
		{"hints", func(r meetings.Reader) (any, error) {
			return snapshotResult(r.PendingChatHints(time.Unix(100, 0), 100))
		}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			store := nestedSnapshotFixture()
			reference := nestedSnapshotFixture()
			var want any
			if err := reference.View(t.Context(), func(r meetings.Reader) error {
				var err error
				want, err = c.read(r)

				return err
			}); err != nil {
				t.Fatal(err)
			}

			err := store.View(t.Context(), func(r meetings.Reader) error {
				if err := r.(meetings.Writer).SaveMeeting(meetings.Meeting{ID: "m", Title: "illegal"}); !errors.Is(err, meetings.ErrReadOnly) {
					return fmt.Errorf("writer assertion: %v", err)
				}

				returned, err := c.read(r)
				if err != nil {
					return err
				}

				committed := make(chan error, 1)
				go func() {
					committed <- store.Update(t.Context(), func(w meetings.Writer) error { return w.SaveMeeting(meetings.Meeting{ID: "m", Title: "committed"}) })
				}()
				// Mutate caller-owned nested maps/slices/pointers concurrently with a
				// writer cloning the old committed state. Any escaping alias is a race.
				disturbSnapshotResult(reflect.ValueOf(returned))
				if err := <-committed; err != nil {
					return err
				}

				after, err := c.read(r)
				if err != nil {
					return err
				}

				if !reflect.DeepEqual(after, want) {
					return fmt.Errorf("snapshot changed after caller mutation/commit: got %+v, want %+v", after, want)
				}

				return nil
			})
			if err != nil {
				t.Fatal(err)
			}

			if err := store.View(t.Context(), func(r meetings.Reader) error {
				m, err := r.Meeting("m")
				if err == nil && m.Title != "committed" {
					return fmt.Errorf("new snapshot did not observe commit: %+v", m)
				}

				return err
			}); err != nil {
				t.Fatal(err)
			}
		})
	}
}

func TestReadSnapshotAllocationsIgnoreHistoryAndOutbox(t *testing.T) {
	store := New()
	store.data.meetings["m"] = meetings.Meeting{ID: "m"}
	for i := range 10000 {
		id := fmt.Sprint(i)
		store.data.feed["m"] = append(store.data.feed["m"], meetings.FeedEntry{ID: id, Payload: []byte(`{"text":"history"}`)})
		store.data.hints[id] = meetings.ChatHint{ID: id}
	}

	var readErr error
	allocations := testing.AllocsPerRun(3, func() {
		readErr = store.View(t.Context(), func(r meetings.Reader) error { _, err := r.Meeting("m"); return err })
	})
	if readErr != nil {
		t.Fatal(readErr)
	}

	// A fixed-size access check must not allocate for 10k unrelated payloads.
	if allocations > 20 {
		t.Fatalf("access check allocated %.0f objects for unrelated history/outbox", allocations)
	}
}

func snapshotResult[T any](value T, err error) (any, error) { return value, err }

func nestedSnapshotFixture() *Store {
	s := New()
	stamp := time.Unix(1, 0).UTC()
	s.data.meetings["m"] = meetings.Meeting{ID: "m", Title: "original", StartsAt: &stamp, PastAt: &stamp}
	s.data.feed["m"] = []meetings.FeedEntry{{ID: "entry", Payload: []byte(`{"text":"original"}`), Attachments: []meetings.Media{{ID: "media", FileName: "original"}}}}
	s.data.polls["date"] = meetings.DatePoll{ID: "date", Options: []meetings.DateOption{{ID: "option"}}, Ballots: map[string]meetings.DateBallot{"u": {OptionIDs: []string{"option"}}}, FinalEligible: []string{"u"}, Leaders: []string{"option"}, ClosedAt: &stamp}
	s.data.placePolls["place"] = meetings.PlacePoll{ID: "place", Ballots: map[string]meetings.PlaceBallot{"u": {Answer: meetings.PlaceVoteFor}}, FinalEligible: []string{"u"}, ClosedAt: &stamp}
	s.data.preparationTasks["task"] = meetings.PreparationTask{ID: "task", Assignee: &meetings.Actor{ID: "u", Name: "original"}}
	s.data.covers["m"] = meetings.Cover{MeetingID: "m", Data: []byte{1, 2, 3}}
	s.data.hints["hint"] = meetings.ChatHint{ID: "hint", LeaseUntil: &stamp}

	return s
}

func disturbSnapshotResult(value reflect.Value) {
	switch value.Kind() {
	case reflect.Pointer:
		if !value.IsNil() {
			value.Elem().Set(reflect.Zero(value.Type().Elem()))
		}
	case reflect.Map:
		for _, key := range value.MapKeys() {
			disturbSnapshotResult(value.MapIndex(key))
		}

		value.Clear()
	case reflect.Slice:
		for i := 0; i < value.Len(); i++ {
			disturbSnapshotResult(value.Index(i))
			value.Index(i).Set(reflect.Zero(value.Type().Elem()))
		}
	case reflect.Struct:
		for i := 0; i < value.NumField(); i++ {
			if value.Type().Field(i).IsExported() {
				disturbSnapshotResult(value.Field(i))
			}
		}
	}
}
