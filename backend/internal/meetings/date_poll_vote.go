package meetings

import (
	"context"
	"slices"
)

// DateVoteInput replaces this caller's entire selection with revision protection.
type DateVoteInput struct {
	OptionIDs        []string
	ExpectedRevision uint64
}

// VoteDatePoll atomically saves a ballot and, when visible, applies its result.
func (s *Service) VoteDatePoll(ctx context.Context, actor Actor, meetingID, pollID string, input DateVoteInput, key string) (DatePollView, error) {
	input.OptionIDs = slices.Clone(input.OptionIDs)
	slices.Sort(input.OptionIDs)

	return s.mutateDatePoll(ctx, actor, meetingID, pollID, "vote", key, input, func(writer Writer, meeting Meeting, poll *DatePoll) error {
		if err := s.requireOpenPoll(*poll); err != nil {
			return err
		}

		previous := poll.Ballots[actor.ID]
		if previous.Revision != input.ExpectedRevision {
			return &Conflict{Code: "date_vote_revision_conflict"}
		}

		if len(input.OptionIDs) > 20 || len(input.OptionIDs) == 0 && previous.Revision == 0 || !poll.Settings.MultipleAnswers && len(input.OptionIDs) > 1 {
			return ValidationError{map[string]string{"option_ids": "invalid_count"}}
		}

		for i, id := range input.OptionIDs {
			if i > 0 && input.OptionIDs[i-1] == id || !slices.ContainsFunc(poll.Options, func(option DateOption) bool { return option.ID == id }) {
				return ValidationError{map[string]string{"option_ids": "invalid"}}
			}
		}

		if slices.Equal(previous.OptionIDs, input.OptionIDs) {
			return nil
		}

		if !poll.Settings.AllowRevoting && previous.Revision > 0 {
			return &Conflict{Code: "date_poll_revote_disabled"}
		}

		revision, err := increment(previous.Revision)
		if err != nil {
			return err
		}

		poll.Ballots[actor.ID] = DateBallot{Actor: actor, OptionIDs: input.OptionIDs, Revision: revision}

		return s.evaluateDatePoll(writer, meeting, poll, false)
	})
}

// AddDateOptionInput carries the option-list revision, independent of private votes.
type AddDateOptionInput struct {
	Date             string
	ExpectedRevision uint64
}

// AddDateOption appends one date without modifying the meaning of previous votes.
func (s *Service) AddDateOption(ctx context.Context, actor Actor, meetingID, pollID string, input AddDateOptionInput, key string) (DatePollView, error) {
	return s.mutateDatePoll(ctx, actor, meetingID, pollID, "option", key, input, func(writer Writer, meeting Meeting, poll *DatePoll) error {
		if err := s.requireOpenPoll(*poll); err != nil {
			return err
		}

		if !poll.Settings.AllowNewOptions {
			return ErrForbidden
		}

		if poll.Revision != input.ExpectedRevision {
			return &Conflict{Code: "date_poll_revision_conflict"}
		}

		if len(poll.Options) >= 20 {
			return ValidationError{map[string]string{"date": "too_many_options"}}
		}

		zone, err := loadZone(meeting.Timezone)
		if err != nil {
			return err
		}

		if _, err := dateStart(input.Date, zone); err != nil {
			return ValidationError{map[string]string{"date": "invalid"}}
		}

		if slices.ContainsFunc(poll.Options, func(option DateOption) bool { return option.Date == input.Date }) {
			return ValidationError{map[string]string{"date": "duplicate"}}
		}

		poll.Options = append(poll.Options, DateOption{ID: randomUUID(), Date: input.Date})
		sortDateOptions(poll)
		poll.Revision, err = increment(poll.Revision)

		return err
	})
}
