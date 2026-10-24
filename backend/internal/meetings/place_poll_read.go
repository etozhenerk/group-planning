package meetings

import (
	"context"
	"time"
)

// PlacePollView exposes the current counts and only the caller's own ballot.
type PlacePollView struct {
	ID, MeetingID            string
	Author                   Actor
	Place, PreviousPlace     string
	State                    PlacePollState
	Revision, MyVoteRevision uint64
	MyVote                   PlaceVote
	VotesFor, VotesAgainst   int
	CreatedAt, ClosesAt      time.Time
	ClosedAt                 *time.Time
	CanVote                  bool
}

// ReadPlacePoll requires current chat access, including for completed polls.
func (s *Service) ReadPlacePoll(ctx context.Context, actor Actor, meetingID, id string) (PlacePollView, error) {
	if err := checkActor(actor); err != nil {
		return PlacePollView{}, err
	}

	var result PlacePollView
	err := s.store.View(ctx, func(reader Reader) error {
		details, err := privateSnapshot(reader, meetingID, actor.ID)
		if err != nil {
			return err
		}

		poll, err := reader.PlacePoll(id)
		if err != nil {
			return err
		}

		if poll.MeetingID != meetingID {
			return ErrNotFound
		}

		result, err = s.placePollView(reader, details.Meeting, poll, actor.ID)

		return err
	})

	return result, err
}

func (s *Service) placePollView(reader Reader, meeting Meeting, poll PlacePoll, userID string) (PlacePollView, error) {
	eligible := poll.FinalEligible
	if poll.State == PlacePollOpen {
		var err error
		eligible, err = pollElectorate(reader, meeting)
		if err != nil {
			return PlacePollView{}, err
		}
	}

	yes, no := placePollCounts(poll, eligible)
	own := poll.Ballots[userID]

	return PlacePollView{
		ID: poll.ID, MeetingID: poll.MeetingID, Author: poll.Author,
		Place: poll.Place, PreviousPlace: poll.PreviousPlace, State: poll.State,
		Revision: poll.Revision, MyVoteRevision: own.Revision, MyVote: own.Answer,
		VotesFor: yes, VotesAgainst: no,
		CreatedAt: poll.CreatedAt, ClosesAt: poll.ClosesAt, ClosedAt: poll.ClosedAt,
		CanVote: poll.State == PlacePollOpen && s.now().Before(poll.ClosesAt),
	}, nil
}

func placePollCounts(poll PlacePoll, eligible []string) (int, int) {
	yes, no := 0, 0
	for _, id := range eligible {
		switch poll.Ballots[id].Answer {
		case PlaceVoteFor:
			yes++
		case PlaceVoteAgainst:
			no++
		}
	}

	return yes, no
}
