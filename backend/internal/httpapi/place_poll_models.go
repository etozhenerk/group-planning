package httpapi

import (
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type placePollResponse struct {
	ID             string                  `json:"id"`
	MeetingID      string                  `json:"meeting_id"`
	Author         userResponse            `json:"author"`
	Place          string                  `json:"place"`
	PreviousPlace  *string                 `json:"previous_place"`
	State          meetings.PlacePollState `json:"state"`
	Revision       string                  `json:"revision"`
	MyVoteRevision string                  `json:"my_vote_revision"`
	MyVote         *string                 `json:"my_vote"`
	VotesFor       int                     `json:"votes_for"`
	VotesAgainst   int                     `json:"votes_against"`
	CreatedAt      time.Time               `json:"created_at"`
	ClosesAt       time.Time               `json:"closes_at"`
	ClosedAt       *time.Time              `json:"closed_at"`
	CanVote        bool                    `json:"can_vote"`
}

func placePollDTO(view meetings.PlacePollView) placePollResponse {
	return placePollResponse{
		ID: view.ID, MeetingID: view.MeetingID,
		Author: userResponse{ID: view.Author.ID, DisplayName: view.Author.Name},
		Place:  view.Place, PreviousPlace: optionalString(view.PreviousPlace), State: view.State,
		Revision: decimal(view.Revision), MyVoteRevision: decimal(view.MyVoteRevision),
		MyVote: optionalString(string(view.MyVote)), VotesFor: view.VotesFor, VotesAgainst: view.VotesAgainst,
		CreatedAt: view.CreatedAt, ClosesAt: view.ClosesAt, ClosedAt: view.ClosedAt, CanVote: view.CanVote,
	}
}
