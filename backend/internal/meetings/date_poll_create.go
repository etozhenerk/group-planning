package meetings

import (
	"context"
	"slices"
	"strings"
	"time"
)

// CreateDatePollInput defines an immutable question and its configurable ballot.
type CreateDatePollInput struct {
	Dates    []string
	ClosesAt string
	Settings PollSettings
}

// CreateDatePoll publishes a question and its close job in the same transaction.
func (s *Service) CreateDatePoll(ctx context.Context, actor Actor, meetingID string, input CreateDatePollInput, key string) (DatePollView, error) {
	if err := checkActor(actor); err != nil {
		return DatePollView{}, err
	}

	requestKey, err := keyFor(actor, "date-poll:create:"+meetingID, key)
	if err != nil {
		return DatePollView{}, err
	}

	closesAt, err := parseInstant(input.ClosesAt)
	if err != nil {
		return DatePollView{}, ValidationError{map[string]string{"closes_at": "invalid"}}
	}

	if len(input.Dates) < 2 || len(input.Dates) > 20 {
		return DatePollView{}, ValidationError{map[string]string{"dates": "invalid_count"}}
	}

	input.Dates = slices.Clone(input.Dates)
	slices.Sort(input.Dates)
	input.ClosesAt = closesAt.UTC().Format(time.RFC3339Nano)
	hash := requestHash(input)
	var result DatePollView
	err = s.update(ctx, func(writer Writer) error {
		details, err := privateSnapshot(writer, meetingID, actor.ID)
		if err != nil {
			return err
		}

		polls, err := writer.DatePolls()
		if err != nil {
			return err
		}

		for _, poll := range polls {
			if poll.MeetingID == meetingID && poll.Author.ID == actor.ID && poll.CreationRequestID == requestKey.Key {
				if poll.CreationRequestHash != hash {
					return ErrIdempotencyConflict
				}

				result, err = s.pollView(writer, details.Meeting, poll, actor.ID)

				return err
			}
		}

		if !closesAt.After(s.now()) {
			return ValidationError{map[string]string{"closes_at": "must_be_future"}}
		}

		for _, poll := range polls {
			if poll.MeetingID == meetingID && poll.active() {
				return &Conflict{Code: "date_poll_active"}
			}
		}

		zone, err := loadZone(details.Meeting.Timezone)
		if err != nil {
			return err
		}

		options := make([]DateOption, 0, len(input.Dates))
		for i, day := range input.Dates {
			if _, err := dateStart(day, zone); err != nil {
				return ValidationError{map[string]string{"dates": "invalid"}}
			}

			if i > 0 && day == input.Dates[i-1] {
				return ValidationError{map[string]string{"dates": "duplicate"}}
			}

			options = append(options, DateOption{ID: randomUUID(), Date: day})
		}

		poll := DatePoll{
			ID:                  randomUUID(),
			MeetingID:           meetingID,
			Author:              actor,
			Settings:            input.Settings,
			Options:             options,
			Ballots:             map[string]DateBallot{},
			State:               PollOpen,
			Revision:            1,
			CreatedAt:           s.now().UTC(),
			ClosesAt:            closesAt.UTC(),
			CreationRequestID:   requestKey.Key,
			CreationRequestHash: hash,
			CloseJob:            PollCloseJob{State: TransitionPending, AvailableAt: closesAt.UTC()},
		}
		if err := writer.SaveDatePoll(poll); err != nil {
			return err
		}

		if _, err := s.entry(writer, meetingID, "date_poll_created", actor, map[string]string{"poll_id": poll.ID}, ""); err != nil {
			return err
		}

		result, err = s.pollView(writer, details.Meeting, poll, actor.ID)

		return err
	})

	return result, err
}

func sortDateOptions(poll *DatePoll) {
	slices.SortFunc(poll.Options, func(a, b DateOption) int { return strings.Compare(a.Date, b.Date) })
}
