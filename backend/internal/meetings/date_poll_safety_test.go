package meetings_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type failedPollEventWriter struct{ meetings.Writer }

func (w failedPollEventWriter) AppendEntry(entry meetings.FeedEntry) (meetings.FeedEntry, error) {
	if entry.ActorID == meetings.BotID {
		return meetings.FeedEntry{}, errors.New("private failure details")
	}

	return w.Writer.AppendEntry(entry)
}

type failedPollEventStore struct{ meetings.Store }

func (s failedPollEventStore) Update(ctx context.Context, fn func(meetings.Writer) error) error {
	return s.Store.Update(ctx, func(w meetings.Writer) error { return fn(failedPollEventWriter{w}) })
}

func TestDatePollRollbackAndBoundedCloseRecovery(t *testing.T) {
	f, actors := pollCompany(t)
	poll := newPoll(t, f, true, false)
	for i := range 4 {
		pollVote(t, f, actors[i], poll, []string{poll.Options[0].Option.ID}, 0, 500+i)
	}

	broken := meetings.NewService(failedPollEventStore{f.store}, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	options := meetings.DefaultTransitionOptions()
	options.MaxAttempts = 2
	options.RetryBase = time.Second
	observations := []meetings.PollObservation{}
	worker, err := meetings.NewDatePollWorker(broken, options, func(o meetings.PollObservation) { observations = append(observations, o) })
	must(t, err)
	f.clock.Store(poll.ClosesAt.Unix())
	worker.Tick(ctx)
	worker.Tick(ctx)
	var stored meetings.DatePoll
	read := func() {
		must(t, f.store.View(ctx, func(r meetings.Reader) error { var err error; stored, err = r.DatePoll(poll.ID); return err }))
	}
	read()
	if stored.State != meetings.PollOpen || stored.CloseJob.Attempts != 1 || currentMeeting(t, f).StartsOn != "2026-10-24" {
		t.Fatal("failure did not roll back or retry was hot")
	}

	f.clock.Add(1)
	worker.Tick(ctx)
	read()
	if stored.CloseJob.State != meetings.TransitionFailed || stored.CloseJob.Attempts != 2 {
		t.Fatal("retry limit not enforced")
	}

	f.clock.Add(600)
	worker.Tick(ctx)
	read()
	if stored.CloseJob.Attempts != 2 || len(observations) == 0 {
		t.Fatal("reconciliation reset failed job")
	}

	must(t, f.app.RetryDatePollClose(ctx, poll.ID))
	working, err := meetings.NewDatePollWorker(f.app, options, nil)
	must(t, err)
	working.Tick(ctx)
	read()
	if stored.State != meetings.PollApplied || stored.CloseJob.ManualRetries != 1 || stored.CloseJob.TotalAttempts != 3 {
		t.Fatalf("recovery: %+v", stored.CloseJob)
	}
}

func TestDatePollMissingJobNoMajorityAndReadOnlyDeadline(t *testing.T) {
	f, _ := pollCompany(t)
	poll := newPoll(t, f, true, false)
	must(t, f.store.Update(ctx, func(w meetings.Writer) error {
		p, err := w.DatePoll(poll.ID)
		if err != nil {
			return err
		}

		p.CloseJob = meetings.PollCloseJob{}

		return w.SaveDatePoll(p)
	}))
	f.clock.Store(poll.ClosesAt.Unix())
	view, err := f.app.ReadDatePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if view.State != meetings.PollOpen || view.CanVote {
		t.Fatal("read mutated expired poll or accepted voting")
	}

	worker, err := meetings.NewDatePollWorker(f.app, meetings.DefaultTransitionOptions(), nil)
	must(t, err)
	worker.Tick(ctx)
	view, err = f.app.ReadDatePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if view.State != meetings.PollNoMajority || currentMeeting(t, f).StartsOn != "2026-10-24" {
		t.Fatal("overdue poll not recovered")
	}
}

func TestDatePollSettingsAndAtomicMajorityFailure(t *testing.T) {
	f, actors := pollCompany(t)
	input := meetings.CreateDatePollInput{Dates: []string{"2026-10-25", "2026-10-26"}, ClosesAt: "2026-10-21T00:00:00Z"}
	poll, err := f.app.CreateDatePoll(ctx, actors[1], f.created.Details.Meeting.ID, input, key(450))
	must(t, err)
	_, err = f.app.CreateDatePoll(ctx, owner, poll.MeetingID, input, key(451))
	if err == nil {
		t.Fatal("second active poll accepted")
	}

	_, err = f.app.VoteDatePoll(ctx, actors[1], poll.MeetingID, poll.ID, meetings.DateVoteInput{OptionIDs: []string{poll.Options[0].Option.ID, poll.Options[1].Option.ID}}, key(452))
	if err == nil {
		t.Fatal("multiple answers accepted")
	}

	for i := range 3 {
		pollVote(t, f, actors[i], poll, []string{poll.Options[0].Option.ID}, 0, 500+i)
	}

	_, err = f.app.VoteDatePoll(ctx, actors[1], poll.MeetingID, poll.ID, meetings.DateVoteInput{OptionIDs: []string{poll.Options[1].Option.ID}, ExpectedRevision: 1}, key(453))
	if err == nil {
		t.Fatal("revote accepted")
	}

	_, err = f.app.AddDateOption(ctx, owner, poll.MeetingID, poll.ID, meetings.AddDateOptionInput{Date: "2026-10-27", ExpectedRevision: 1}, key(454))
	assertError(t, err, meetings.ErrForbidden)
	broken := meetings.NewService(failedPollEventStore{f.store}, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	_, err = broken.VoteDatePoll(ctx, actors[3], poll.MeetingID, poll.ID, meetings.DateVoteInput{OptionIDs: []string{poll.Options[0].Option.ID}}, key(455))
	if err == nil {
		t.Fatal("event failure was ignored")
	}

	view, err := f.app.ReadDatePoll(ctx, actors[3], poll.MeetingID, poll.ID)
	must(t, err)
	if view.State != meetings.PollOpen || view.MyVoteRevision != 0 || *view.Options[0].Votes != 3 || currentMeeting(t, f).StartsOn != "2026-10-24" {
		t.Fatal("partial majority commit")
	}

	pollVote(t, f, actors[3], poll, []string{poll.Options[0].Option.ID}, 0, 455)
}

func TestDatePollPreservesUnknownTimeAndRejectsImplicitDSTShift(t *testing.T) {
	for _, unknown := range []bool{true, false} {
		f := setup(t)
		f.clock.Store(time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC).Unix())
		instant := "2026-03-07T02:30:00-05:00"
		if unknown {
			instant = ""
		}

		_, err := f.app.Update(ctx, owner, f.created.Details.Meeting.ID, meetings.UpdateInput{
			StartsOn:         meetings.Field{Present: true, Value: "2026-03-07"},
			StartsAt:         meetings.Field{Present: true, Value: instant},
			Timezone:         meetings.Field{Present: true, Value: "America/New_York"},
			ExpectedRevision: 1,
		}, key(2))
		must(t, err)
		poll, err := f.app.CreateDatePoll(ctx, owner, f.created.Details.Meeting.ID, meetings.CreateDatePollInput{Dates: []string{"2026-03-08", "2026-03-09"}, ClosesAt: "2026-03-02T00:00:00Z"}, key(3))
		must(t, err)
		view := pollVote(t, f, owner, poll, []string{poll.Options[0].Option.ID}, 0, 4)
		if unknown {
			if view.State != meetings.PollApplied || currentMeeting(t, f).StartsAt != nil {
				t.Fatal("invented a time")
			}

			continue
		}

		if view.State != meetings.PollAwaitingTime || currentMeeting(t, f).StartsOn != "2026-03-07" {
			t.Fatal("silently shifted nonexistent local time")
		}

		view, err = f.app.ResolveDatePoll(ctx, owner, poll.MeetingID, poll.ID, meetings.ResolveDatePollInput{OptionID: poll.Options[0].Option.ID, ExpectedRevision: view.Revision, StartsAt: meetings.Field{Present: true, Value: "2026-03-08T03:30:00-04:00"}}, key(5))
		must(t, err)
		if view.State != meetings.PollApplied || currentMeeting(t, f).StartsAt.Format(time.RFC3339) != "2026-03-08T07:30:00Z" {
			t.Fatal("explicit time not applied")
		}
	}
}
