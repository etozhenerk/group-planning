package meetings_test

import (
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func pollCompany(t *testing.T) (*fixture, []meetings.Actor) {
	t.Helper()
	f := setup(t)
	actors := []meetings.Actor{owner}
	for i := 1; i < 6; i++ {
		actor := meetings.Actor{ID: key(200 + i), Name: "Друг"}
		_, err := f.app.Respond(ctx, actor, "", f.created.InvitationToken, meetings.Going, 0, key(300+i))
		must(t, err)
		actors = append(actors, actor)
	}

	return f, actors
}

func newPoll(t *testing.T, f *fixture, hidden, anonymous bool) meetings.DatePollView {
	t.Helper()
	result, err := f.app.CreateDatePoll(ctx, owner, f.created.Details.Meeting.ID, meetings.CreateDatePollInput{
		Dates:    []string{"2026-10-26", "2026-10-25"},
		ClosesAt: time.Unix(f.clock.Load(), 0).Add(time.Hour).Format(time.RFC3339),
		Settings: meetings.PollSettings{MultipleAnswers: true, AllowRevoting: true, AllowNewOptions: true, HideResults: hidden, Anonymous: anonymous},
	}, key(400))
	must(t, err)

	return result
}

func pollVote(t *testing.T, f *fixture, actor meetings.Actor, poll meetings.DatePollView, options []string, revision uint64, n int) meetings.DatePollView {
	t.Helper()
	result, err := f.app.VoteDatePoll(ctx, actor, poll.MeetingID, poll.ID, meetings.DateVoteInput{OptionIDs: options, ExpectedRevision: revision}, key(n))
	must(t, err)

	return result
}

func TestDatePollMajorityClosesAndPreservesTime(t *testing.T) {
	f, actors := pollCompany(t)
	poll := newPoll(t, f, false, false)
	target := poll.Options[0].Option.ID
	for i := range 3 {
		pollVote(t, f, actors[i], poll, []string{target}, 0, 500+i)
	}

	if currentMeeting(t, f).StartsOn != "2026-10-24" {
		t.Fatal("half was treated as majority")
	}

	applied := pollVote(t, f, actors[3], poll, []string{target}, 0, 503)
	if applied.State != meetings.PollApplied || applied.CanVote || applied.ClosedAt == nil || applied.AppliedOptionID != target {
		t.Fatalf("result: %+v", applied)
	}

	current := currentMeeting(t, f)
	if current.StartsOn != "2026-10-25" || current.StartsAt.Format(time.RFC3339) != "2026-10-25T16:00:00Z" {
		t.Fatalf("wrong date/time: %+v", current)
	}

	repeated := pollVote(t, f, actors[3], poll, []string{target}, 0, 503)
	if repeated.State != meetings.PollApplied {
		t.Fatal("lost-response retry failed")
	}

	_, err := f.app.VoteDatePoll(ctx, actors[4], poll.MeetingID, poll.ID, meetings.DateVoteInput{OptionIDs: []string{target}}, key(504))
	var conflict *meetings.Conflict
	if !errors.As(err, &conflict) || conflict.Code != "date_poll_closed" {
		t.Fatalf("late vote: %v", err)
	}

	f.clock.Store(poll.ClosesAt.Unix())
	var group sync.WaitGroup
	for range 8 {
		group.Go(func() {
			if err := f.app.CloseDatePoll(ctx, poll.ID); err != nil {
				t.Error(err)
			}
		})
	}

	group.Wait()
	count := 0
	for _, entry := range feed(t, f).Entries {
		if entry.Kind == "date_poll_applied" {
			count++
			if entry.ActorID != meetings.BotID {
				t.Fatal("not attributed to bot")
			}
		}
	}

	if count != 1 || currentMeeting(t, f).Revision != current.Revision {
		t.Fatal("duplicate transfer")
	}
}

func TestHiddenPollMaximumTieAndOrganizerResolution(t *testing.T) {
	for _, tie := range []bool{false, true} {
		f, actors := pollCompany(t)
		poll := newPoll(t, f, true, true)
		a, b := poll.Options[0].Option.ID, poll.Options[1].Option.ID
		for i := range 5 {
			options := []string{a}
			if i < 4 {
				options = append(options, b)
			}

			if tie && i == 4 {
				continue
			}

			view := pollVote(t, f, actors[i], poll, options, 0, 500+i)
			if view.Revision != 1 || view.Options[0].Votes != nil || view.Options[0].Voters != nil || len(view.Leaders) != 0 {
				t.Fatal("hidden results leaked")
			}
		}

		if currentMeeting(t, f).StartsOn != "2026-10-24" {
			t.Fatal("hidden poll applied early")
		}

		f.clock.Store(poll.ClosesAt.Unix())
		must(t, f.app.CloseDatePoll(ctx, poll.ID))
		view, err := f.app.ReadDatePoll(ctx, owner, poll.MeetingID, poll.ID)
		must(t, err)
		if view.Options[0].Voters != nil || view.Options[0].Votes == nil {
			t.Fatal("anonymous result is wrong")
		}

		if !tie {
			if view.State != meetings.PollApplied || view.AppliedOptionID != a {
				t.Fatal("maximum not applied")
			}

			continue
		}

		if view.State != meetings.PollAwaitingChoice || !view.CanResolve || len(view.Leaders) != 2 {
			t.Fatal("tie did not wait for organizer")
		}

		input := meetings.ResolveDatePollInput{OptionID: b, ExpectedRevision: view.Revision}
		_, err = f.app.ResolveDatePoll(ctx, actors[1], poll.MeetingID, poll.ID, input, key(600))
		assertError(t, err, meetings.ErrForbidden)
		view, err = f.app.ResolveDatePoll(ctx, owner, poll.MeetingID, poll.ID, input, key(601))
		must(t, err)
		if view.State != meetings.PollApplied || currentMeeting(t, f).StartsOn != "2026-10-26" {
			t.Fatal("organizer selection was not applied")
		}
	}
}

func TestDatePollMembershipReturnAndManualCancellation(t *testing.T) {
	f, actors := pollCompany(t)
	poll := newPoll(t, f, true, false)
	target := poll.Options[0].Option.ID
	pollVote(t, f, actors[1], poll, []string{target}, 0, 501)
	_, err := f.app.Respond(ctx, actors[1], poll.MeetingID, "", meetings.Maybe, 1, key(502))
	must(t, err)
	_, err = f.app.ReadDatePoll(ctx, actors[1], poll.MeetingID, poll.ID)
	assertError(t, err, meetings.ErrForbidden)
	_, err = f.app.Respond(ctx, actors[1], poll.MeetingID, "", meetings.Going, 2, key(503))
	must(t, err)
	view, err := f.app.ReadDatePoll(ctx, actors[1], poll.MeetingID, poll.ID)
	must(t, err)
	if view.MyVoteRevision != 1 || len(view.MyOptionIDs) != 1 {
		t.Fatal("return lost previous ballot")
	}

	m := currentMeeting(t, f)
	_, err = f.app.Update(ctx, owner, m.ID, meetings.UpdateInput{StartsAt: meetings.Field{Present: true, Value: "2026-10-28T19:00:00+03:00"}, ExpectedRevision: m.Revision}, key(504))
	must(t, err)
	view, err = f.app.ReadDatePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if view.State != meetings.PollCancelled || view.Options[0].Votes != nil {
		t.Fatal("cancelled hidden poll disclosed votes")
	}

	f.clock.Store(poll.ClosesAt.Unix())
	must(t, f.app.CloseDatePoll(ctx, poll.ID))
	if currentMeeting(t, f).StartsOn != "2026-10-28" {
		t.Fatal("old job overwrote manual date")
	}
}
