package meetings_test

import (
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestDatePollConcurrentMajorityAndClosing(t *testing.T) {
	f, actors := pollCompany(t)
	poll := newPoll(t, f, false, false)
	target := poll.Options[0].Option.ID
	for i := range 3 {
		pollVote(t, f, actors[i], poll, []string{target}, 0, 500+i)
	}

	var winners atomic.Int32
	var group sync.WaitGroup
	for i := 3; i < 6; i++ {
		group.Go(func() {
			_, err := f.app.VoteDatePoll(ctx, actors[i], poll.MeetingID, poll.ID, meetings.DateVoteInput{OptionIDs: []string{target}}, key(500+i))
			if err == nil {
				winners.Add(1)
				return
			}

			var conflict *meetings.Conflict
			if !errors.As(err, &conflict) || conflict.Code != "date_poll_closed" {
				t.Error(err)
			}
		})
	}

	group.Wait()
	if winners.Load() != 1 {
		t.Fatal("more than one final vote committed")
	}

	count := 0
	for _, entry := range feed(t, f).Entries {
		if entry.Kind == "date_poll_applied" {
			count++
		}
	}

	if count != 1 {
		t.Fatal("duplicate application")
	}
}

func TestDatePollMembershipChangesMajorityAndFreezesResult(t *testing.T) {
	f, actors := pollCompany(t)
	poll := newPoll(t, f, false, false)
	target := poll.Options[0].Option.ID
	for i := range 3 {
		pollVote(t, f, actors[i], poll, []string{target}, 0, 500+i)
	}

	_, err := f.app.Respond(ctx, actors[5], poll.MeetingID, "", meetings.NotGoing, 1, key(510))
	must(t, err)
	result, err := f.app.ReadDatePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if result.State != meetings.PollApplied || *result.Options[0].Votes != 3 {
		t.Fatal("departure did not trigger current majority")
	}

	_, err = f.app.Respond(ctx, actors[1], poll.MeetingID, "", meetings.Maybe, 1, key(511))
	must(t, err)
	result, err = f.app.ReadDatePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if *result.Options[0].Votes != 3 {
		t.Fatal("closed result changed after departure")
	}
}

func TestDatePollOptionAndVoteRetriesAndRevisions(t *testing.T) {
	f, actors := pollCompany(t)
	poll := newPoll(t, f, true, false)
	add := meetings.AddDateOptionInput{Date: "2026-10-23", ExpectedRevision: poll.Revision}
	added, err := f.app.AddDateOption(ctx, actors[1], poll.MeetingID, poll.ID, add, key(520))
	must(t, err)
	replay, err := f.app.AddDateOption(ctx, actors[1], poll.MeetingID, poll.ID, add, key(520))
	must(t, err)
	if len(replay.Options) != 3 || replay.Options[0].Option.ID != added.Options[0].Option.ID {
		t.Fatal("option replay duplicated date")
	}

	target := added.Options[0].Option.ID
	first := pollVote(t, f, actors[1], poll, []string{target}, 0, 521)
	_, err = f.app.VoteDatePoll(ctx, actors[1], poll.MeetingID, poll.ID, meetings.DateVoteInput{OptionIDs: []string{poll.Options[0].Option.ID}}, key(522))
	if err == nil {
		t.Fatal("stale ballot replaced selection")
	}

	cleared := pollVote(t, f, actors[1], poll, []string{}, first.MyVoteRevision, 523)
	if len(cleared.MyOptionIDs) != 0 || cleared.MyVoteRevision != 2 {
		t.Fatal("cannot withdraw selection")
	}

	_, err = f.app.Respond(ctx, actors[1], poll.MeetingID, "", meetings.Maybe, 1, key(524))
	must(t, err)
	_, err = f.app.AddDateOption(ctx, actors[1], poll.MeetingID, poll.ID, add, key(520))
	assertError(t, err, meetings.ErrForbidden)
}

func TestDatePollLegacySettingsDoNotCancelAndCopiesAreIsolated(t *testing.T) {
	f, _ := pollCompany(t)
	poll := newPoll(t, f, true, false)
	must(t, f.store.Update(ctx, func(w meetings.Writer) error {
		meeting, err := w.Meeting(poll.MeetingID)
		if err != nil {
			return err
		}

		meeting.StartsOn = ""

		return w.SaveMeeting(meeting)
	}))
	current := currentMeeting(t, f)
	_, err := f.app.Update(ctx, owner, poll.MeetingID, meetings.UpdateInput{Title: meetings.Field{Present: true, Value: "Другое название"}, ExpectedRevision: current.Revision}, key(530))
	must(t, err)
	view, err := f.app.ReadDatePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if view.State != meetings.PollOpen {
		t.Fatal("legacy title edit cancelled date poll")
	}

	pollVote(t, f, owner, poll, []string{poll.Options[0].Option.ID}, 0, 531)
	rollback := errors.New("rollback")
	err = f.store.Update(ctx, func(w meetings.Writer) error {
		stored, err := w.DatePoll(poll.ID)
		if err != nil {
			return err
		}

		stored.Options[0].Date = "2000-01-01"
		stored.Ballots[owner.ID].OptionIDs[0] = "changed"
		stamp := time.Now()
		stored.ClosedAt = &stamp
		if err := w.SaveDatePoll(stored); err != nil {
			return err
		}

		stored.Options[0].Date = "1999-01-01"

		return rollback
	})
	assertError(t, err, rollback)
	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		stored, err := r.DatePoll(poll.ID)
		if err != nil {
			return err
		}

		if stored.Options[0].Date != "2026-10-25" || stored.Ballots[owner.ID].OptionIDs[0] != poll.Options[0].Option.ID || stored.ClosedAt != nil {
			t.Fatal("failed update escaped rollback")
		}

		stored.Options[0].Date = "2000-01-01"
		stored.Ballots[owner.ID].OptionIDs[0] = "changed"

		return nil
	}))
	view, err = f.app.ReadDatePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if view.Options[0].Option.Date != "2026-10-25" || view.MyOptionIDs[0] != poll.Options[0].Option.ID {
		t.Fatal("read mutated stored poll")
	}
}

func TestDatePollVoteRacesDeadlineWithoutDuplicateResult(t *testing.T) {
	f, actors := pollCompany(t)
	poll := newPoll(t, f, true, false)
	target := poll.Options[0].Option.ID
	for i := range 4 {
		pollVote(t, f, actors[i], poll, []string{target}, 0, 550+i)
	}

	f.clock.Store(poll.ClosesAt.Unix())
	var group sync.WaitGroup
	group.Go(func() {
		if err := f.app.CloseDatePoll(ctx, poll.ID); err != nil {
			t.Error(err)
		}
	})
	group.Go(func() {
		_, err := f.app.VoteDatePoll(ctx, actors[4], poll.MeetingID, poll.ID, meetings.DateVoteInput{OptionIDs: []string{target}}, key(554))
		var conflict *meetings.Conflict
		if !errors.As(err, &conflict) || conflict.Code != "date_poll_closed" {
			t.Errorf("deadline vote: %v", err)
		}
	})
	group.Wait()
	view, err := f.app.ReadDatePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if view.State != meetings.PollApplied || *view.Options[0].Votes != 4 {
		t.Fatal("late vote changed final result")
	}

	count := 0
	for _, entry := range feed(t, f).Entries {
		if entry.Kind == "date_poll_applied" {
			count++
		}
	}

	if count != 1 {
		t.Fatal("duplicate close result")
	}
}

func TestDatePollAmbiguousLocalTimeRequiresExplicitOffset(t *testing.T) {
	f := setup(t)
	_, err := f.app.Update(ctx, owner, f.created.Details.Meeting.ID, meetings.UpdateInput{
		StartsAt:         meetings.Field{Present: true, Value: "2026-10-31T01:30:00-04:00"},
		Timezone:         meetings.Field{Present: true, Value: "America/New_York"},
		ExpectedRevision: 1,
	}, key(560))
	must(t, err)
	poll, err := f.app.CreateDatePoll(ctx, owner, f.created.Details.Meeting.ID, meetings.CreateDatePollInput{
		Dates:    []string{"2026-11-01", "2026-11-02"},
		ClosesAt: "2026-10-21T00:00:00Z",
	}, key(561))
	must(t, err)
	view := pollVote(t, f, owner, poll, []string{poll.Options[0].Option.ID}, 0, 562)
	if view.State != meetings.PollAwaitingTime {
		t.Fatal("ambiguous local hour was silently chosen")
	}

	_, err = f.app.ResolveDatePoll(ctx, owner, poll.MeetingID, poll.ID, meetings.ResolveDatePollInput{
		OptionID:         poll.Options[0].Option.ID,
		ExpectedRevision: view.Revision,
		StartsAt:         meetings.Field{Present: true, Value: "2026-11-01T01:30:00-05:00"},
	}, key(563))
	must(t, err)
	if currentMeeting(t, f).StartsAt.Format(time.RFC3339) != "2026-11-01T06:30:00Z" {
		t.Fatal("explicit fold offset lost")
	}
}
