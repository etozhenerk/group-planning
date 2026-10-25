package meetings_test

import (
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestAccountRemovalChoosesFirstJoinAndRejectsStaleWrites(t *testing.T) {
	f := setup(t)
	id := f.created.Details.Meeting.ID
	respond(t, f, meetings.Going, 0, 2)
	f.clock.Add(1)
	_, err := f.app.Respond(ctx, outsider, "", f.created.InvitationToken, meetings.Going, 0, key(3))
	must(t, err)
	respond(t, f, meetings.NotGoing, 1, 4)
	f.clock.Add(1)
	respond(t, f, meetings.Going, 2, 5)
	must(t, f.app.RemoveAccount(ctx, owner.ID))
	details, err := f.app.Details(ctx, guest, id)
	must(t, err)
	if details.Meeting.OrganizerID != guest.ID || details.ParticipantCount != 2 {
		t.Fatal("wrong successor or count", details)
	}

	if _, err := f.app.Invitation(ctx, guest, id); err != nil {
		t.Fatal("successor has no organizer rights", err)
	}

	_, err = f.app.Details(ctx, owner, id)
	assertError(t, err, meetings.ErrForbidden)
	_, err = f.app.Respond(ctx, owner, "", f.created.InvitationToken, meetings.Going, 0, key(6))
	assertError(t, err, meetings.ErrUnauthenticated)
	_, err = f.app.Create(ctx, owner, validInput(), key(7))
	assertError(t, err, meetings.ErrUnauthenticated)
	page, err := f.app.Feed(ctx, guest, id, meetings.FeedQuery{Limit: 100})
	must(t, err)
	for _, entry := range page.Entries {
		if entry.ActorID == owner.ID && entry.ActorName != meetings.RemovedAccountName {
			t.Fatal("old author name leaked")
		}
	}

	before := details.Meeting.Revision
	must(t, f.app.RemoveAccount(ctx, owner.ID))
	details, err = f.app.Details(ctx, guest, id)
	must(t, err)
	if details.Meeting.Revision != before {
		t.Fatal("retry transferred twice")
	}
}

func TestAccountRemovalSkipsFormerParticipant(t *testing.T) {
	f := setup(t)
	respond(t, f, meetings.Going, 0, 2)
	f.clock.Add(1)
	_, err := f.app.Respond(ctx, outsider, "", f.created.InvitationToken, meetings.Going, 0, key(3))
	must(t, err)
	respond(t, f, meetings.Maybe, 1, 4)
	must(t, f.app.RemoveAccount(ctx, owner.ID))
	details, err := f.app.Details(ctx, outsider, f.created.Details.Meeting.ID)
	must(t, err)
	if details.Meeting.OrganizerID != outsider.ID || details.ParticipantCount != 1 {
		t.Fatal("former participant inherited organization")
	}
}

func TestAccountRemovalDeletesMeetingAndEveryChild(t *testing.T) {
	f := setup(t)
	id := f.created.Details.Meeting.ID
	respond(t, f, meetings.Maybe, 0, 2)
	must(t, f.store.Update(ctx, func(w meetings.Writer) error {
		if err := w.SaveCover(meetings.Cover{MeetingID: id, Version: key(10), Data: []byte("image")}); err != nil {
			return err
		}

		if err := w.SaveDatePoll(meetings.DatePoll{ID: key(11), MeetingID: id}); err != nil {
			return err
		}

		if err := w.SavePlacePoll(meetings.PlacePoll{ID: key(12), MeetingID: id}); err != nil {
			return err
		}

		return w.SavePreparationTask(meetings.PreparationTask{ID: key(13), MeetingID: id})
	}))
	must(t, f.app.RemoveAccount(ctx, owner.ID))
	_, _, err := f.app.PreviewForUser(ctx, f.created.InvitationToken, guest.ID)
	assertError(t, err, meetings.ErrNotFound)
	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		checks := []func() error{
			func() error { _, err := r.Meeting(id); return err },
			func() error { _, err := r.Cover(id); return err },
			func() error { _, err := r.DatePoll(key(11)); return err },
			func() error { _, err := r.PlacePoll(key(12)); return err },
			func() error { _, err := r.PreparationTask(key(13)); return err },
			func() error { _, err := r.TransitionJob(id, 1); return err },
			func() error {
				_, err := r.Receipt(meetings.RequestKey{UserID: owner.ID, Operation: "create", Key: key(1)})
				return err
			},
		}
		for _, check := range checks {
			if !errors.Is(check(), meetings.ErrNotFound) {
				return errors.New("child survived meeting deletion")
			}
		}

		return nil
	}))
}

func TestAccountRemovalPreservesFinalVotesAndCancelsResponsibility(t *testing.T) {
	f := setup(t)
	id := f.created.Details.Meeting.ID
	respond(t, f, meetings.Going, 0, 2)
	proposed := proposeTask(t, f, owner, guest.ID, 3)
	accepted := taskAction(t, f, guest, proposed.Task, meetings.TaskAccept, 4)
	other := proposeTask(t, f, guest, owner.ID, 5)
	must(t, f.store.Update(ctx, func(w meetings.Writer) error {
		for i, state := range []meetings.PollState{meetings.PollOpen, meetings.PollNoMajority} {
			poll := meetings.DatePoll{ID: key(10 + i), MeetingID: id, Author: guest, State: state, Revision: 1, ClosesAt: time.Unix(f.clock.Load(), 0).Add(time.Hour), Settings: meetings.PollSettings{HideResults: true}, Ballots: map[string]meetings.DateBallot{guest.ID: {Actor: guest, OptionIDs: []string{key(20)}, Revision: 1}}, FinalEligible: []string{owner.ID, guest.ID}}
			if err := w.SaveDatePoll(poll); err != nil {
				return err
			}
		}

		return nil
	}))
	must(t, f.app.RemoveAccount(ctx, guest.ID))
	view, err := f.app.ReadPreparationTask(ctx, owner, id, accepted.Task.ID)
	must(t, err)
	if view.Task.State != meetings.TaskCancelled || view.Task.Assignee.Name != meetings.RemovedAccountName {
		t.Fatal("responsibility was not cancelled/anonymized", view)
	}

	view, err = f.app.ReadPreparationTask(ctx, owner, id, other.Task.ID)
	must(t, err)
	if view.Task.State != meetings.TaskOffered || view.Task.Author.Name != meetings.RemovedAccountName {
		t.Fatal("unrelated task was changed")
	}

	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		open, err := r.DatePoll(key(10))
		if err != nil {
			return err
		}

		closed, err := r.DatePoll(key(11))
		if err != nil {
			return err
		}

		if len(open.Ballots) != 0 || len(closed.Ballots) != 1 || closed.Ballots[guest.ID].Actor.Name != meetings.RemovedAccountName {
			return errors.New("vote privacy or frozen results violated")
		}

		if _, err := r.RSVP(id, guest.ID); !errors.Is(err, meetings.ErrNotFound) {
			return errors.New("response retained")
		}

		return nil
	}))
}
