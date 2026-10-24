package meetings_test

import (
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func newPlacePoll(t *testing.T, f *fixture) meetings.PlacePollView {
	t.Helper()
	poll, err := f.app.CreatePlacePoll(ctx, owner, f.created.Details.Meeting.ID, meetings.CreatePlacePollInput{
		Place: "У Саши дома", ClosesAt: time.Unix(f.clock.Load(), 0).Add(time.Hour).Format(time.RFC3339),
	}, key(900))
	must(t, err)

	return poll
}

func placeVote(t *testing.T, f *fixture, actor meetings.Actor, poll meetings.PlacePollView, answer meetings.PlaceVote, revision uint64, n int) meetings.PlacePollView {
	t.Helper()
	result, err := f.app.VotePlacePoll(ctx, actor, poll.MeetingID, poll.ID, meetings.PlaceVoteInput{Answer: answer, ExpectedRevision: revision}, key(n))
	must(t, err)

	return result
}

func TestPlacePollResultsAreAppliedOnlyAfterDeadline(t *testing.T) {
	for _, counts := range [][2]int{{2, 1}, {1, 2}, {1, 0}, {1, 1}, {0, 0}} {
		f, actors := pollCompany(t)
		poll := newPlacePoll(t, f)
		for i := range counts[0] + counts[1] {
			answer := meetings.PlaceVoteFor
			if i >= counts[0] {
				answer = meetings.PlaceVoteAgainst
			}

			placeVote(t, f, actors[i], poll, answer, 0, 1000+i)
		}

		must(t, f.app.ClosePlacePoll(ctx, poll.ID))
		if currentMeeting(t, f).Place != "Кафе" {
			t.Fatal("place changed before deadline")
		}

		f.clock.Store(poll.ClosesAt.Unix())
		var group sync.WaitGroup
		for range 5 {
			group.Go(func() {
				if err := f.app.ClosePlacePoll(ctx, poll.ID); err != nil {
					t.Error(err)
				}
			})
		}

		group.Wait()
		view, err := f.app.ReadPlacePoll(ctx, owner, poll.MeetingID, poll.ID)
		must(t, err)
		wantState, wantPlace := meetings.PlacePollRejected, "Кафе"
		if counts[0] > counts[1] {
			wantState, wantPlace = meetings.PlacePollApplied, poll.Place
		}

		if view.State != wantState || currentMeeting(t, f).Place != wantPlace || view.CanVote || view.ClosedAt == nil || view.VotesFor != counts[0] || view.VotesAgainst != counts[1] {
			t.Fatalf("incorrect final projection: %+v", view)
		}

		results, changed := 0, 0
		for _, entry := range feed(t, f).Entries {
			if entry.Kind == "place_poll_result" {
				results++
			}

			if entry.Kind == "meeting_updated" {
				changed++
			}
		}

		expectedChanges := 0
		if wantState == meetings.PlacePollApplied {
			expectedChanges = 1
		}

		if results != 1 || changed != expectedChanges {
			t.Fatalf("duplicate/missing outcome: result=%d changes=%d", results, changed)
		}
	}
}

func TestPlacePollMembershipVotesRetriesAndPermissions(t *testing.T) {
	f, actors := pollCompany(t)
	poll := newPlacePoll(t, f)
	placeVote(t, f, actors[1], poll, meetings.PlaceVoteFor, 0, 1001)
	changed := placeVote(t, f, actors[1], poll, meetings.PlaceVoteAgainst, 1, 1002)
	if changed.VotesFor != 0 || changed.VotesAgainst != 1 {
		t.Fatal("revote added another ballot")
	}

	old := placeVote(t, f, actors[1], poll, meetings.PlaceVoteFor, 0, 1001)
	if old.MyVote != meetings.PlaceVoteAgainst || old.MyVoteRevision != 2 {
		t.Fatal("old retry rolled back newer vote")
	}

	_, err := f.app.VotePlacePoll(ctx, actors[1], poll.MeetingID, poll.ID, meetings.PlaceVoteInput{Answer: meetings.PlaceVoteFor, ExpectedRevision: 1}, key(1003))
	var conflict *meetings.Conflict
	if !errors.As(err, &conflict) || conflict.Code != "place_vote_revision_conflict" {
		t.Fatalf("stale vote: %v", err)
	}

	_, err = f.app.Respond(ctx, actors[1], poll.MeetingID, "", meetings.Maybe, 1, key(1010))
	must(t, err)
	_, err = f.app.ReadPlacePoll(ctx, actors[1], poll.MeetingID, poll.ID)
	assertError(t, err, meetings.ErrForbidden)
	_, err = f.app.VotePlacePoll(ctx, actors[1], poll.MeetingID, poll.ID, meetings.PlaceVoteInput{Answer: meetings.PlaceVoteAgainst, ExpectedRevision: 1}, key(1002))
	assertError(t, err, meetings.ErrForbidden)
	view, err := f.app.ReadPlacePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if view.VotesAgainst != 0 {
		t.Fatal("departed voter still counted")
	}

	_, err = f.app.Respond(ctx, actors[1], poll.MeetingID, "", meetings.Going, 2, key(1011))
	must(t, err)
	view, err = f.app.ReadPlacePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if view.VotesAgainst != 1 {
		t.Fatal("return did not restore vote")
	}

	f.clock.Store(poll.ClosesAt.Unix())
	must(t, f.app.ClosePlacePoll(ctx, poll.ID))
	_, err = f.app.Respond(ctx, actors[1], poll.MeetingID, "", meetings.Maybe, 3, key(1012))
	must(t, err)
	view, err = f.app.ReadPlacePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if view.VotesAgainst != 1 {
		t.Fatal("closed electorate changed")
	}
}

func TestPlacePollConcurrentCreationAndManualCancellation(t *testing.T) {
	f, _ := pollCompany(t)
	input := meetings.CreatePlacePollInput{Place: "У Саши дома", ClosesAt: time.Unix(f.clock.Load(), 0).Add(time.Hour).Format(time.RFC3339)}
	var success atomic.Int64
	var group sync.WaitGroup
	for i := range 8 {
		group.Go(func() {
			_, err := f.app.CreatePlacePoll(ctx, owner, f.created.Details.Meeting.ID, input, key(1200+i))
			if err == nil {
				success.Add(1)
				return
			}

			var conflict *meetings.Conflict
			if !errors.As(err, &conflict) || conflict.Code != "place_poll_active" {
				t.Error(err)
			}
		})
	}

	group.Wait()
	if success.Load() != 1 {
		t.Fatal("more than one open poll")
	}

	var poll meetings.PlacePoll
	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		list, err := r.PlacePolls()
		if err == nil {
			poll = list[0]
		}

		return err
	}))
	current := currentMeeting(t, f)
	_, err := f.app.Update(ctx, owner, poll.MeetingID, meetings.UpdateInput{Place: meetings.Field{Present: true, Value: current.Place}, ExpectedRevision: current.Revision}, key(1300))
	must(t, err)
	view, err := f.app.ReadPlacePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if view.State != meetings.PlacePollOpen {
		t.Fatal("unchanged place cancelled poll")
	}

	_, err = f.app.Update(ctx, owner, poll.MeetingID, meetings.UpdateInput{Place: meetings.Field{Present: true, Value: ""}, ExpectedRevision: current.Revision}, key(1301))
	must(t, err)
	f.clock.Store(poll.ClosesAt.Unix())
	must(t, f.app.ClosePlacePoll(ctx, poll.ID))
	view, err = f.app.ReadPlacePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if view.State != meetings.PlacePollCancelled || currentMeeting(t, f).Place != "" {
		t.Fatal("manual place overwritten")
	}
}
