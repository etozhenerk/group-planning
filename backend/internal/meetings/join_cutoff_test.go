package meetings_test

import (
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestJoinCutoffBoundaryRetryReturnAndPreview(t *testing.T) {
	f := setup(t)
	cutoff := f.created.Details.Meeting.StartsAt.Add(-time.Hour)
	f.clock.Store(cutoff.Add(-time.Second).Unix())
	respond(t, f, meetings.Going, 0, 2)
	f.clock.Store(cutoff.Unix())
	preview, _, err := f.app.PreviewForUser(ctx, f.created.InvitationToken, "")
	must(t, err)
	if preview.CanJoin || preview.JoinDisabledReason != "join_closed" || !preview.JoinClosesAt.Equal(cutoff) {
		t.Fatalf("open at boundary: %+v", preview)
	}

	retry, err := f.app.Respond(ctx, guest, "", f.created.InvitationToken, meetings.Going, 0, key(2))
	must(t, err)
	if !retry.CanAccessFeed {
		t.Fatal("retry lost confirmed membership")
	}

	preview, _, err = f.app.PreviewForUser(ctx, f.created.InvitationToken, guest.ID)
	must(t, err)
	if !preview.CanJoin {
		t.Fatal("current participant blocked")
	}

	preview, _, err = f.app.PreviewForUser(ctx, f.created.InvitationToken, owner.ID)
	must(t, err)
	if !preview.CanJoin {
		t.Fatal("organizer blocked")
	}

	respond(t, f, meetings.NotGoing, 1, 3)
	for _, actor := range []meetings.Actor{guest, outsider} {
		revision := uint64(0)
		if actor.ID == guest.ID {
			revision = 2
		}

		_, err = f.app.Respond(ctx, actor, "", f.created.InvitationToken, meetings.Going, revision, key(4))
		var conflict *meetings.Conflict
		if !errors.As(err, &conflict) || conflict.Code != "join_closed" {
			t.Fatalf("accepted late join: %v", err)
		}
	}

	current, err := f.app.Details(ctx, owner, f.created.Details.Meeting.ID)
	must(t, err)
	_, err = f.app.Update(ctx, owner, current.Meeting.ID, meetings.UpdateInput{StartsAt: meetings.Field{Present: true, Value: "2026-10-24T22:00:00+03:00"}, ExpectedRevision: current.Meeting.Revision}, key(5))
	must(t, err)
	respond(t, f, meetings.Going, 2, 6)
}

func TestConcurrentJoinRequestsAtCutoffAreAtomic(t *testing.T) {
	for _, offset := range []time.Duration{-time.Second, 0, time.Second} {
		f := setup(t)
		f.clock.Store(f.created.Details.Meeting.StartsAt.Add(-time.Hour + offset).Unix())
		var wg sync.WaitGroup
		for range 8 {
			wg.Go(func() {
				_, err := f.app.Respond(ctx, guest, "", f.created.InvitationToken, meetings.Going, 0, key(100))
				if offset < 0 {
					if err != nil {
						t.Error(err)
					}
				} else {
					var conflict *meetings.Conflict
					if !errors.As(err, &conflict) || conflict.Code != "join_closed" {
						t.Errorf("late concurrent join: %v", err)
					}
				}
			})
		}

		wg.Wait()
		expected := 1
		if offset < 0 {
			expected = 2
		}

		if feed(t, f).Details.ParticipantCount != expected {
			t.Fatal("partial concurrent RSVP")
		}
	}
}

func TestParticipantPreviewContainsOnlyCurrentMembers(t *testing.T) {
	f := setup(t)
	id := f.created.Details.Meeting.ID
	respond(t, f, meetings.Going, 0, 120)
	current, err := f.app.Details(ctx, owner, id)
	must(t, err)
	if len(current.ParticipantIDs) != 2 || current.ParticipantIDs[0] != owner.ID || current.ParticipantIDs[1] != guest.ID {
		t.Fatal("missing current participants")
	}

	respond(t, f, meetings.Maybe, 1, 121)
	current, err = f.app.Details(ctx, owner, id)
	must(t, err)
	if len(current.ParticipantIDs) != 1 || current.ParticipantCount != 1 {
		t.Fatal("former participant leaked")
	}

	_, err = f.app.Details(ctx, guest, id)
	assertError(t, err, meetings.ErrForbidden)
}

func TestDateWithoutTimeHasNoHourlyCutoff(t *testing.T) {
	f := setup(t)
	input := validInput()
	input.StartsAt = ""
	input.StartsOn = "2026-10-24"
	created, err := f.app.Create(ctx, owner, input, key(30))
	must(t, err)
	f.clock.Store(time.Date(2026, 10, 24, 20, 0, 0, 0, time.UTC).Unix())
	preview, _, err := f.app.PreviewForUser(ctx, created.InvitationToken, "")
	must(t, err)
	if !preview.CanJoin || preview.JoinClosesAt != nil {
		t.Fatal("invented time for date-only meeting")
	}

	_, err = f.app.Respond(ctx, guest, "", created.InvitationToken, meetings.Going, 0, key(31))
	must(t, err)
}
