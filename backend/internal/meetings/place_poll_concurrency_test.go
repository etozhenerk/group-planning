package meetings_test

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestPlacePollCloseAndManualPlaceSerialize(t *testing.T) {
	for range 20 {
		f, _ := pollCompany(t)
		poll := newPlacePoll(t, f)
		placeVote(t, f, owner, poll, meetings.PlaceVoteFor, 0, 1001)
		revision := currentMeeting(t, f).Revision
		f.clock.Store(poll.ClosesAt.Unix())
		var manualError, closeError error
		var group sync.WaitGroup
		group.Go(func() { closeError = f.app.ClosePlacePoll(ctx, poll.ID) })
		group.Go(func() {
			_, manualError = f.app.Update(ctx, owner, poll.MeetingID, meetings.UpdateInput{Place: meetings.Field{Present: true, Value: "Ручное место"}, ExpectedRevision: revision}, key(1002))
		})
		group.Wait()
		must(t, closeError)
		view, err := f.app.ReadPlacePoll(ctx, owner, poll.MeetingID, poll.ID)
		must(t, err)
		current := currentMeeting(t, f)
		if manualError == nil {
			if view.State != meetings.PlacePollCancelled || current.Place != "Ручное место" {
				t.Fatal("worker overwrote manual change")
			}
		} else {
			var conflict *meetings.Conflict
			if !errors.As(manualError, &conflict) || conflict.Code != "meeting_revision_conflict" || view.State != meetings.PlacePollApplied || current.Place != poll.Place {
				t.Fatalf("non-serialized updates: %v", manualError)
			}
		}
	}
}

type failedPlaceSaveWriter struct{ meetings.Writer }

func (w failedPlaceSaveWriter) SavePlacePoll(p meetings.PlacePoll) error {
	if p.State != meetings.PlacePollOpen {
		return errors.New("save failed")
	}

	return w.Writer.SavePlacePoll(p)
}

type failedPlaceSaveStore struct{ meetings.Store }

func (s failedPlaceSaveStore) Update(ctx context.Context, fn func(meetings.Writer) error) error {
	return s.Store.Update(ctx, func(w meetings.Writer) error { return fn(failedPlaceSaveWriter{w}) })
}

func TestPlacePollFinalWriteFailureRollsBackMeetingAndEvents(t *testing.T) {
	f, _ := pollCompany(t)
	poll := newPlacePoll(t, f)
	placeVote(t, f, owner, poll, meetings.PlaceVoteFor, 0, 1001)
	f.clock.Store(poll.ClosesAt.Unix())
	broken := meetings.NewService(failedPlaceSaveStore{f.store}, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	if err := broken.ClosePlacePoll(ctx, poll.ID); err == nil {
		t.Fatal("last write failure ignored")
	}

	view, err := f.app.ReadPlacePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if view.State != meetings.PlacePollOpen || currentMeeting(t, f).Place != "Кафе" {
		t.Fatal("partial transaction")
	}

	for _, entry := range feed(t, f).Entries {
		if entry.Kind == "place_poll_result" || entry.Kind == "meeting_updated" {
			t.Fatal("rolled back events exposed")
		}
	}

	must(t, f.app.ClosePlacePoll(ctx, poll.ID))
}

func TestPlacePollCopiesAndCreateIdempotency(t *testing.T) {
	f, _ := pollCompany(t)
	poll := newPlacePoll(t, f)
	again, err := f.app.CreatePlacePoll(ctx, owner, poll.MeetingID, meetings.CreatePlacePollInput{Place: poll.Place, ClosesAt: poll.ClosesAt.Format(time.RFC3339)}, key(900))
	must(t, err)
	if again.ID != poll.ID {
		t.Fatal("create duplicated")
	}

	_, err = f.app.CreatePlacePoll(ctx, owner, poll.MeetingID, meetings.CreatePlacePollInput{Place: "Другое место", ClosesAt: poll.ClosesAt.Format(time.RFC3339)}, key(900))
	assertError(t, err, meetings.ErrIdempotencyConflict)
	placeVote(t, f, owner, poll, meetings.PlaceVoteFor, 0, 1001)
	f.clock.Store(poll.ClosesAt.Unix())
	must(t, f.app.ClosePlacePoll(ctx, poll.ID))
	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		value, err := r.PlacePoll(poll.ID)
		if err != nil {
			return err
		}

		value.Ballots[owner.ID] = meetings.PlaceBallot{Answer: meetings.PlaceVoteAgainst, Revision: 999}
		value.FinalEligible[0] = "outsider"
		*value.ClosedAt = time.Time{}

		return nil
	}))
	view, err := f.app.ReadPlacePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if view.VotesFor != 1 || view.MyVoteRevision != 1 || view.ClosedAt.IsZero() {
		t.Fatal("mutable reader alias")
	}
}
