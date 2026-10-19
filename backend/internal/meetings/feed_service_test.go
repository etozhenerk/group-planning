package meetings_test

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestFeedPagesConcurrentCommitsAndMessages(t *testing.T) {
	f := setup(t)
	id := f.created.Details.Meeting.ID
	respond(t, f, meetings.Going, 0, 2)
	const count = 25
	var wg sync.WaitGroup
	for n := range count {
		wg.Go(func() {
			_, err := f.app.SendMessage(ctx, guest, id, fmt.Sprintf("Сообщение %d", n), key(100+n), key(100+n))
			if err != nil {
				t.Error(err)
			}
		})
	}
	after := uint64(0)
	seen := map[string]bool{}
	// Read while writers commit; never jump to latest_sequence when a page is short.
	for n := range 10 {
		p, err := f.app.Feed(ctx, owner, id, meetings.FeedQuery{Limit: 3, After: &after})
		must(t, err)
		for _, entry := range p.Entries {
			if entry.Sequence != after+1 || seen[entry.ID] {
				t.Fatal("gap or duplicate")
			}
			after = entry.Sequence
			seen[entry.ID] = true
		}
		if n == 9 {
			wg.Wait()
		}
	}
	for {
		p, err := f.app.Feed(ctx, owner, id, meetings.FeedQuery{Limit: 3, After: &after})
		must(t, err)
		for _, entry := range p.Entries {
			if entry.Sequence != after+1 || seen[entry.ID] {
				t.Fatal("gap or duplicate")
			}
			after = entry.Sequence
			seen[entry.ID] = true
		}
		if !p.HasMore {
			break
		}
	}
	if after != count+2 || len(seen) != count+2 {
		t.Fatal("lost committed entries")
	}
	initial, err := f.app.Feed(ctx, owner, id, meetings.FeedQuery{Limit: 3})
	must(t, err)
	if len(initial.Entries) != 3 || !initial.HasMore || initial.Entries[0].Sequence != count {
		t.Fatal("initial latest page")
	}
	before := initial.Entries[0].Sequence
	older, err := f.app.Feed(ctx, owner, id, meetings.FeedQuery{Limit: 3, Before: &before})
	must(t, err)
	if older.Entries[2].Sequence != before-1 || older.Entries[0].Sequence != before-3 {
		t.Fatal("nearest older page")
	}
	if initial.Details.Meeting.Revision != 2 {
		t.Fatal("message changed meeting revision")
	}
	first, err := f.app.SendMessage(ctx, guest, id, "<b>Обычный текст</b>\n ", key(200), key(200))
	must(t, err)
	f.clock.Add(int64((31 * 24 * time.Hour) / time.Second))
	again, err := f.app.SendMessage(ctx, guest, id, "<b>Обычный текст</b>\n ", key(200), key(200))
	must(t, err)
	if first.ID != again.ID || first.Sequence != again.Sequence {
		t.Fatal("late duplicate")
	}
	_, err = f.app.SendMessage(ctx, guest, id, "Изменено", key(200), key(200))
	assertError(t, err, meetings.ErrIdempotencyConflict)
	respond(t, f, meetings.NotGoing, 1, 201)
	_, err = f.app.Feed(ctx, guest, id, meetings.FeedQuery{Limit: 50})
	assertError(t, err, meetings.ErrForbidden)
	_, err = f.app.SendMessage(ctx, guest, id, "<b>Обычный текст</b>\n ", key(200), key(200))
	assertError(t, err, meetings.ErrForbidden)
}
func TestMessageRaceWithLeaving(t *testing.T) {
	for range 15 {
		f := setup(t)
		id := f.created.Details.Meeting.ID
		respond(t, f, meetings.Going, 0, 2)
		var wg sync.WaitGroup
		var sendError error
		wg.Go(func() { _, sendError = f.app.SendMessage(ctx, guest, id, "Уже иду", key(3), key(3)) })
		wg.Go(func() {
			_, err := f.app.Respond(ctx, guest, id, "", meetings.Maybe, 1, key(4))
			if err != nil {
				t.Error(err)
			}
		})
		wg.Wait()
		if sendError != nil && !errors.Is(sendError, meetings.ErrForbidden) {
			t.Fatal(sendError)
		}
		entries := feed(t, f).Entries
		left := uint64(0)
		for _, entry := range entries {
			if entry.Kind == "participant_left" {
				left = entry.Sequence
			}
			if entry.Kind == "message" && left != 0 {
				t.Fatal("message committed after leave")
			}
		}
		_, err := f.app.SendMessage(ctx, guest, id, "Уже иду", key(3), key(3))
		assertError(t, err, meetings.ErrForbidden)
	}
}

type failedReadStore struct {
	meetings.Store
	failure error
}

func (s failedReadStore) View(context.Context, func(meetings.Reader) error) error { return s.failure }
