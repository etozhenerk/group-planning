package meetings_test

import (
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestPlacePollRollbackBoundedRetriesAndWorkerRestart(t *testing.T) {
	f, actors := pollCompany(t)
	poll := newPlacePoll(t, f)
	placeVote(t, f, actors[1], poll, meetings.PlaceVoteFor, 0, 1001)
	broken := meetings.NewService(failedPollEventStore{f.store}, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	options := meetings.DefaultTransitionOptions()
	options.MaxAttempts = 2
	options.RetryBase = time.Second
	observations := []meetings.PollObservation{}
	worker, err := meetings.NewPlacePollWorker(broken, options, func(o meetings.PollObservation) { observations = append(observations, o) })
	must(t, err)
	f.clock.Store(poll.ClosesAt.Unix())
	worker.Tick(ctx)
	worker.Tick(ctx)
	var stored meetings.PlacePoll
	read := func() {
		must(t, f.store.View(ctx, func(r meetings.Reader) error { var err error; stored, err = r.PlacePoll(poll.ID); return err }))
	}
	read()
	if stored.State != meetings.PlacePollOpen || stored.CloseJob.Attempts != 1 || currentMeeting(t, f).Place != "Кафе" {
		t.Fatal("partial commit or hot retry")
	}

	f.clock.Add(1)
	worker.Tick(ctx)
	read()
	if stored.CloseJob.State != meetings.TransitionFailed {
		t.Fatal("retry limit ignored")
	}

	f.clock.Add(600)
	worker.Tick(ctx)
	read()
	if stored.CloseJob.Attempts != 2 || len(observations) == 0 {
		t.Fatal("failed job reset or missing signal")
	}

	must(t, f.app.RetryPlacePollClose(ctx, poll.ID))
	restarted, err := meetings.NewPlacePollWorker(f.app, options, nil)
	must(t, err)
	restarted.Tick(ctx)
	restarted.Tick(ctx)
	read()
	if stored.State != meetings.PlacePollApplied || stored.CloseJob.ManualRetries != 1 || stored.CloseJob.TotalAttempts != 3 || currentMeeting(t, f).Place != poll.Place {
		t.Fatal("restart did not recover exactly one result")
	}
}

func TestPlacePollRecoversMissingJobAndRejectsExpiredVote(t *testing.T) {
	f, _ := pollCompany(t)
	poll := newPlacePoll(t, f)
	must(t, f.store.Update(ctx, func(w meetings.Writer) error {
		value, err := w.PlacePoll(poll.ID)
		if err != nil {
			return err
		}

		value.CloseJob = meetings.PollCloseJob{}

		return w.SavePlacePoll(value)
	}))
	f.clock.Store(poll.ClosesAt.Unix())
	view, err := f.app.ReadPlacePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if view.CanVote || view.State != meetings.PlacePollOpen {
		t.Fatal("GET changed expired poll")
	}

	_, err = f.app.VotePlacePoll(ctx, owner, poll.MeetingID, poll.ID, meetings.PlaceVoteInput{Answer: meetings.PlaceVoteFor}, key(1002))
	if err == nil {
		t.Fatal("late vote accepted")
	}

	worker, err := meetings.NewPlacePollWorker(f.app, meetings.DefaultTransitionOptions(), nil)
	must(t, err)
	worker.Tick(ctx)
	view, err = f.app.ReadPlacePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if view.State != meetings.PlacePollRejected || currentMeeting(t, f).Place != "Кафе" {
		t.Fatal("missing job was not recovered")
	}
}
