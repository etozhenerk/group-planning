package meetings

import "context"

// PlaceVoteInput protects the caller's own ballot against stale writes.
type PlaceVoteInput struct {
	Answer           PlaceVote
	ExpectedRevision uint64
}

// VotePlacePoll replaces one ballot without applying the proposal before its deadline.
func (s *Service) VotePlacePoll(ctx context.Context, actor Actor, meetingID, pollID string, input PlaceVoteInput, key string) (PlacePollView, error) {
	if err := checkActor(actor); err != nil {
		return PlacePollView{}, err
	}

	requestKey, err := keyFor(actor, "place-poll:vote:"+pollID, key)
	if err != nil {
		return PlacePollView{}, err
	}

	hash := requestHash(input)
	var result PlacePollView
	err = s.update(ctx, func(writer Writer) error {
		details, err := privateSnapshot(writer, meetingID, actor.ID)
		if err != nil {
			return err
		}

		poll, err := writer.PlacePoll(pollID)
		if err != nil {
			return err
		}

		if poll.MeetingID != meetingID {
			return ErrNotFound
		}

		_, exists, err := s.receipt(writer, requestKey, hash)
		if err != nil {
			return err
		}

		if !exists {
			if poll.State != PlacePollOpen || !s.now().Before(poll.ClosesAt) {
				return &Conflict{Code: "place_poll_closed"}
			}

			if input.Answer != PlaceVoteFor && input.Answer != PlaceVoteAgainst {
				return ValidationError{map[string]string{"answer": "invalid"}}
			}

			previous := poll.Ballots[actor.ID]
			if previous.Revision != input.ExpectedRevision {
				return &Conflict{Code: "place_vote_revision_conflict"}
			}

			if previous.Answer != input.Answer {
				revision, err := increment(previous.Revision)
				if err != nil {
					return err
				}

				poll.Ballots[actor.ID] = PlaceBallot{Answer: input.Answer, Revision: revision}
				poll.Revision, err = increment(poll.Revision)
				if err != nil {
					return err
				}

				if err := writer.SavePlacePoll(poll); err != nil {
					return err
				}
			}

			if err := s.remember(writer, requestKey, hash, pollID); err != nil {
				return err
			}
		}

		result, err = s.placePollView(writer, details.Meeting, poll, actor.ID)

		return err
	})

	return result, err
}
