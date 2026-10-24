package meetings

import (
	"context"
	"strings"
	"time"
)

// CreatePlacePollInput carries an immutable proposed place and closing instant.
type CreatePlacePollInput struct {
	Place, ClosesAt string
}

// CreatePlacePoll publishes a single open proposal and its close job atomically.
func (s *Service) CreatePlacePoll(ctx context.Context, actor Actor, meetingID string, input CreatePlacePollInput, key string) (PlacePollView, error) {
	if err := checkActor(actor); err != nil {
		return PlacePollView{}, err
	}

	requestKey, err := keyFor(actor, "place-poll:create:"+meetingID, key)
	if err != nil {
		return PlacePollView{}, err
	}

	input.Place = strings.TrimSpace(input.Place)
	if err := validateText("place", input.Place, 500, true); err != nil {
		return PlacePollView{}, err
	}

	closesAt, err := parseInstant(input.ClosesAt)
	if err != nil {
		return PlacePollView{}, ValidationError{map[string]string{"closes_at": "invalid"}}
	}

	input.ClosesAt = closesAt.UTC().Format(time.RFC3339Nano)
	hash := requestHash(input)
	var result PlacePollView
	err = s.update(ctx, func(writer Writer) error {
		details, err := privateSnapshot(writer, meetingID, actor.ID)
		if err != nil {
			return err
		}

		polls, err := writer.PlacePolls()
		if err != nil {
			return err
		}

		for _, poll := range polls {
			if poll.MeetingID == meetingID && poll.Author.ID == actor.ID && poll.CreationRequestID == requestKey.Key {
				if poll.CreationRequestHash != hash {
					return ErrIdempotencyConflict
				}

				result, err = s.placePollView(writer, details.Meeting, poll, actor.ID)

				return err
			}
		}

		if !closesAt.After(s.now()) {
			return ValidationError{map[string]string{"closes_at": "must_be_future"}}
		}

		if input.Place == details.Meeting.Place {
			return ValidationError{map[string]string{"place": "unchanged"}}
		}

		for _, poll := range polls {
			if poll.MeetingID == meetingID && poll.State == PlacePollOpen {
				return &Conflict{Code: "place_poll_active"}
			}
		}

		poll := PlacePoll{
			ID: randomUUID(), MeetingID: meetingID, Author: actor,
			Place: input.Place, PreviousPlace: details.Meeting.Place,
			State: PlacePollOpen, Revision: 1, Ballots: map[string]PlaceBallot{},
			CreatedAt: s.now().UTC(), ClosesAt: closesAt.UTC(),
			CreationRequestID: requestKey.Key, CreationRequestHash: hash,
			CloseJob: PollCloseJob{State: TransitionPending, AvailableAt: closesAt.UTC()},
		}
		if err := writer.SavePlacePoll(poll); err != nil {
			return err
		}

		if _, err := s.entry(writer, meetingID, "place_poll_created", actor, map[string]string{"poll_id": poll.ID}, ""); err != nil {
			return err
		}

		result, err = s.placePollView(writer, details.Meeting, poll, actor.ID)

		return err
	})

	return result, err
}
