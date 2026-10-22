package meetings

import (
	"context"
	"slices"
)

func (s *Service) evaluateDatePoll(writer Writer, meeting Meeting, poll *DatePoll, closing bool) error {
	if poll.State != PollOpen || poll.Settings.HideResults && !closing {
		return nil
	}

	eligible, err := pollElectorate(writer, meeting)
	if err != nil {
		return err
	}

	maximum := len(eligible) / 2
	leaders := []string{}
	for _, option := range poll.Options {
		count := 0
		for _, id := range eligible {
			if slices.Contains(poll.Ballots[id].OptionIDs, option.ID) {
				count++
			}
		}

		if count > maximum {
			maximum = count
			leaders = []string{option.ID}
		} else if count == maximum && count > len(eligible)/2 {
			leaders = append(leaders, option.ID)
		}
	}

	if len(leaders) == 0 && !closing {
		return nil
	}

	closed := s.now().UTC()
	poll.ClosedAt, poll.FinalEligible, poll.Leaders = &closed, eligible, leaders
	poll.CloseJob.State = TransitionCompleted
	poll.Revision, err = increment(poll.Revision)
	if err != nil {
		return err
	}

	if len(leaders) == 0 {
		poll.State = PollNoMajority
		_, err := s.entry(writer, meeting.ID, "date_poll_no_majority", botActor(), map[string]any{"poll_id": poll.ID, "meeting": meetingEvent(meeting)}, "")

		return err
	}

	if len(leaders) > 1 {
		poll.State = PollAwaitingChoice
		_, err := s.entry(writer, meeting.ID, "date_poll_choice_required", botActor(), map[string]any{"poll_id": poll.ID, "option_ids": leaders}, "")

		return err
	}

	return s.applyDatePoll(writer, meeting, poll, leaders[0], Field{})
}

// ResolveDatePollInput selects an immutable leader. A time override is allowed
// only when preserving the existing wall clock was impossible or ambiguous.
type ResolveDatePollInput struct {
	OptionID         string
	ExpectedRevision uint64
	StartsAt         Field
}

// ResolveDatePoll lets only the organizer choose a tied leader or resolve DST.
func (s *Service) ResolveDatePoll(ctx context.Context, actor Actor, meetingID, pollID string, input ResolveDatePollInput, key string) (DatePollView, error) {
	return s.mutateDatePoll(ctx, actor, meetingID, pollID, "resolve", key, input, func(writer Writer, meeting Meeting, poll *DatePoll) error {
		if actor.ID != meeting.OrganizerID {
			return ErrForbidden
		}

		if poll.Revision != input.ExpectedRevision {
			return &Conflict{Code: "date_poll_revision_conflict"}
		}

		if poll.State != PollAwaitingChoice && poll.State != PollAwaitingTime {
			return &Conflict{Code: "date_poll_closed"}
		}

		if !slices.Contains(poll.Leaders, input.OptionID) {
			return ValidationError{map[string]string{"option_id": "not_a_leader"}}
		}

		if poll.State == PollAwaitingTime && !input.StartsAt.Present {
			return ValidationError{map[string]string{"starts_at": "required"}}
		}

		if poll.State != PollAwaitingTime && input.StartsAt.Present {
			return ValidationError{map[string]string{"starts_at": "unexpected"}}
		}

		var err error
		poll.Revision, err = increment(poll.Revision)
		if err != nil {
			return err
		}

		return s.applyDatePoll(writer, meeting, poll, input.OptionID, input.StartsAt)
	})
}

func (s *Service) applyDatePoll(writer Writer, meeting Meeting, poll *DatePoll, optionID string, override Field) error {
	option := poll.Options[slices.IndexFunc(poll.Options, func(option DateOption) bool { return option.ID == optionID })]
	instant, needsTime, err := pollDateInstant(meeting, option.Date, override)
	if err != nil {
		return err
	}

	if needsTime {
		poll.State, poll.Leaders = PollAwaitingTime, []string{optionID}
		_, err := s.entry(writer, meeting.ID, "date_poll_time_required", botActor(), map[string]string{"poll_id": poll.ID, "starts_on": option.Date, "timezone": meeting.Timezone}, "")

		return err
	}

	previous := meeting
	meeting.StartsOn, meeting.StartsAt = option.Date, instant
	if meeting.StartsOn != previous.StartsOn || !sameInstant(meeting.StartsAt, previous.StartsAt) {
		meeting.Revision, err = increment(meeting.Revision)
		if err != nil {
			return err
		}

		if err := s.schedule(writer, &meeting); err != nil {
			return err
		}

		if err := writer.SaveMeeting(meeting); err != nil {
			return err
		}
	}

	poll.State, poll.AppliedOptionID = PollApplied, optionID
	_, err = s.entry(writer, meeting.ID, "date_poll_applied", botActor(), map[string]any{
		"poll_id":   poll.ID,
		"option_id": optionID,
		"previous":  meetingEvent(previous),
		"current":   meetingEvent(meeting),
	}, "")

	return err
}
