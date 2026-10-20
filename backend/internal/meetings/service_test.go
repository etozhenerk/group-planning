package meetings_test

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

var (
	ctx      = context.Background()
	owner    = meetings.Actor{ID: "6a63b1d2-2ff0-446b-8c90-a51a75762daa", Name: "Лена"}
	guest    = meetings.Actor{ID: "b739a4ef-bd4a-47a7-8b6c-ea373074eacf", Name: "Миша"}
	outsider = meetings.Actor{ID: "f797282a-5dda-4823-92a2-6ad682f6103f", Name: "Катя"}
)

func key(n int) string {
	return fmt.Sprintf("d3c50000-0000-4000-8000-%012d", n)
}

func validInput() meetings.CreateInput {
	return meetings.CreateInput{
		Title:       "Настолки",
		Description: "Принести игры",
		StartsAt:    "2026-10-24T19:00:00+03:00",
		Timezone:    "Europe/Moscow",
		Place:       "Кафе",
	}
}

type fixture struct {
	store   *memory.Store
	app     *meetings.Service
	clock   atomic.Int64
	created meetings.Created
}

func setup(t *testing.T) *fixture {
	t.Helper()
	f := &fixture{store: memory.New()}
	f.clock.Store(time.Date(2026, 10, 20, 0, 0, 0, 0, time.UTC).Unix())
	f.app = meetings.NewService(f.store, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	var err error
	f.created, err = f.app.Create(ctx, owner, validInput(), key(1))
	if err != nil {
		t.Fatal(err)
	}

	return f
}

func must(t *testing.T, err error) {
	t.Helper()
	if err != nil {
		t.Fatal(err)
	}
}

func assertError(t *testing.T, err, want error) {
	t.Helper()
	if !errors.Is(err, want) {
		t.Fatalf("error %v, want %v", err, want)
	}
}

func feed(t *testing.T, f *fixture) meetings.FeedPage {
	t.Helper()
	p, err := f.app.Feed(ctx, owner, f.created.Details.Meeting.ID, meetings.FeedQuery{Limit: 100})
	must(t, err)

	return p
}

func respond(t *testing.T, f *fixture, answer meetings.Answer, revision uint64, n int) meetings.ResponseState {
	t.Helper()
	r, err := f.app.Respond(ctx, guest, "", f.created.InvitationToken, answer, revision, key(n))
	must(t, err)

	return r
}

func TestCreateRetryValidationAndPermanentIdentity(t *testing.T) {
	f := setup(t)
	input := validInput()
	input.Title = "  Настолки  "
	input.Place = "  Кафе  "
	var wg sync.WaitGroup
	for range 12 {
		wg.Go(func() {
			result, err := f.app.Create(ctx, owner, input, key(1))
			if err != nil || result.Details.Meeting.ID != f.created.Details.Meeting.ID {
				t.Errorf("concurrent retry: %v", err)
			}
		})
	}

	wg.Wait()
	if len(feed(t, f).Entries) != 1 {
		t.Fatal("creation duplicated")
	}

	_, err := f.app.Update(ctx, owner, f.created.Details.Meeting.ID, meetings.UpdateInput{
		Title:            meetings.Field{Present: true, Value: "Новое название"},
		ExpectedRevision: 1,
	}, key(2))
	must(t, err)
	f.clock.Add(int64((31 * 24 * time.Hour) / time.Second))
	retried, err := f.app.Create(ctx, owner, input, key(1))
	must(t, err)
	if retried.Details.Meeting.ID != f.created.Details.Meeting.ID || retried.Details.Meeting.Title != "Новое название" {
		t.Fatal("retry used mutable title as creation identity")
	}

	input.Title = "Другое"
	_, err = f.app.Create(ctx, owner, input, key(1))
	assertError(t, err, meetings.ErrIdempotencyConflict)
	cases := []struct {
		name, field string
		edit        func(*meetings.CreateInput)
	}{
		{"blank", "title", func(i *meetings.CreateInput) { i.Title = " \n " }},
		{"length", "title", func(i *meetings.CreateInput) { i.Title = strings.Repeat("я", 121) }},
		{"bad_utf8", "description", func(i *meetings.CreateInput) { i.Description = string([]byte{255}) }},
		{"zone", "timezone", func(i *meetings.CreateInput) { i.Timezone = "Moon/City" }},
		{"local", "timezone", func(i *meetings.CreateInput) { i.Timezone = "Local" }},
		{"offset", "starts_at", func(i *meetings.CreateInput) { i.StartsAt = "2026-10-24T19:00:00Z" }},
		{"missing_offset", "starts_at", func(i *meetings.CreateInput) { i.StartsAt = "2026-10-24T19:00:00" }},
		{"nonexistent_dst", "starts_at", func(i *meetings.CreateInput) {
			i.Timezone = "America/New_York"
			i.StartsAt = "2026-03-08T02:30:00-05:00"
		}},
	}
	for n, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			input := validInput()
			test.edit(&input)
			_, err := f.app.Create(ctx, owner, input, key(100+n))
			var invalid meetings.ValidationError
			if !errors.As(err, &invalid) || invalid.Fields[test.field] == "" {
				t.Fatalf("missing field error: %v", err)
			}
		})
	}

	for n, stamp := range []string{"2026-11-01T01:30:00-04:00", "2026-11-01T01:30:00-05:00", "2026-11-01T01:30:00.123-05:00"} {
		input := validInput()
		input.Timezone = "America/New_York"
		input.StartsAt = stamp
		_, err := f.app.Create(ctx, owner, input, key(200+n))
		must(t, err)
	}
}

func TestResponseTransitionsAndCurrentAccess(t *testing.T) {
	for _, initial := range []meetings.Answer{"", meetings.Going, meetings.Maybe, meetings.NotGoing} {
		for _, next := range []meetings.Answer{meetings.Going, meetings.Maybe, meetings.NotGoing} {
			t.Run(string(initial)+"_to_"+string(next), func(t *testing.T) {
				f := setup(t)
				revision := uint64(0)
				if initial != "" {
					revision = respond(t, f, initial, 0, 2).Revision
				}

				before := feed(t, f)
				state := respond(t, f, next, revision, 3)
				changed := initial != next
				if state.CanAccessFeed != (next == meetings.Going) || state.Answer != next {
					t.Fatal("wrong current access")
				}

				expectedRevision := revision
				if changed {
					expectedRevision++
				}

				if state.Revision != expectedRevision {
					t.Fatal("wrong RSVP revision")
				}

				page := feed(t, f)
				expectedEntries := len(before.Entries)
				if changed {
					expectedEntries++
				}

				if len(page.Entries) != expectedEntries {
					t.Fatal("duplicate or missing event")
				}

				count := 1
				if next == meetings.Going {
					count++
				}

				if page.Details.ParticipantCount != count {
					t.Fatal("organizer counted incorrectly")
				}

				if changed {
					kind := "rsvp_changed"
					if next == meetings.Going {
						kind = "participant_joined"
					} else if initial == meetings.Going {
						kind = "participant_left"
					}

					if page.Entries[len(page.Entries)-1].Kind != kind {
						t.Fatal("wrong event")
					}
				}

				_, err := f.app.Details(ctx, guest, f.created.Details.Meeting.ID)
				if next == meetings.Going {
					must(t, err)
				} else {
					assertError(t, err, meetings.ErrForbidden)
				}

				list, err := f.app.List(ctx, guest, 50, "")
				must(t, err)
				want := 0
				if next == meetings.Going {
					want = 1
				}

				if len(list.Meetings) != want {
					t.Fatal("non-going included in own list")
				}
			})
		}
	}

	f := setup(t)
	going := respond(t, f, meetings.Going, 0, 2)
	respond(t, f, meetings.Maybe, going.Revision, 3)
	late, err := f.app.Respond(ctx, guest, "", f.created.InvitationToken, meetings.Going, 0, key(2))
	must(t, err)
	if late.Answer != meetings.Maybe || late.CanAccessFeed {
		t.Fatal("old success granted stale access")
	}

	_, err = f.app.Respond(ctx, guest, f.created.Details.Meeting.ID, "", meetings.Going, 0, key(4))
	var conflict *meetings.Conflict
	if !errors.As(err, &conflict) || conflict.Response.CanAccessFeed {
		t.Fatal("conflict grants access")
	}

	_, err = f.app.Respond(ctx, owner, "", f.created.InvitationToken, meetings.Going, 0, key(5))
	assertError(t, err, meetings.ErrForbidden)
	_, err = f.app.Respond(ctx, outsider, f.created.Details.Meeting.ID, "", meetings.Going, 0, key(6))
	assertError(t, err, meetings.ErrForbidden)
	_, err = f.app.Respond(ctx, outsider, "", f.created.InvitationToken, meetings.Going, 1, key(7))
	if !errors.As(err, &conflict) || conflict.Response.Answer != "" || conflict.Response.Revision != 0 {
		t.Fatal("first conflict missing null answer")
	}
}

func TestConcurrentRSVPAndIdempotencyScope(t *testing.T) {
	f := setup(t)
	var wg sync.WaitGroup
	for range 20 {
		wg.Go(func() {
			_, err := f.app.Respond(ctx, guest, "", f.created.InvitationToken, meetings.Going, 0, key(2))
			if err != nil {
				t.Error(err)
			}
		})
	}

	wg.Wait()
	p := feed(t, f)
	if len(p.Entries) != 2 || p.Details.ParticipantCount != 2 {
		t.Fatal("concurrent RSVP duplicated join")
	}

	_, err := f.app.Respond(ctx, guest, f.created.Details.Meeting.ID, "", meetings.Going, 0, key(2))
	must(t, err)
	_, err = f.app.Respond(ctx, guest, "", f.created.InvitationToken, meetings.Maybe, 0, key(2))
	assertError(t, err, meetings.ErrIdempotencyConflict)
	f.clock.Add(int64((31 * 24 * time.Hour) / time.Second))
	_, err = f.app.Respond(ctx, guest, "", f.created.InvitationToken, meetings.Going, 0, key(2))
	var conflict *meetings.Conflict
	if !errors.As(err, &conflict) {
		t.Fatal("expired key bypassed expected revision")
	}
}
