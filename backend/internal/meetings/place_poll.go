package meetings

import "time"

// PlacePollState describes the immutable result of a binary place proposal.
type PlacePollState string

const (
	PlacePollOpen      PlacePollState = "open"
	PlacePollApplied   PlacePollState = "applied"
	PlacePollRejected  PlacePollState = "rejected"
	PlacePollCancelled PlacePollState = "cancelled"
)

// PlaceVote is a participant's explicit answer to the proposed place.
type PlaceVote string

const (
	PlaceVoteFor     PlaceVote = "for"
	PlaceVoteAgainst PlaceVote = "against"
)

// PlaceBallot retains a user's answer when they temporarily leave the meeting.
type PlaceBallot struct {
	Answer   PlaceVote
	Revision uint64
}

// PlacePoll is private storage state; public replies use PlacePollView.
type PlacePoll struct {
	ID, MeetingID                          string
	Author                                 Actor
	Place, PreviousPlace, Explanation      string
	State                                  PlacePollState
	Revision                               uint64
	Ballots                                map[string]PlaceBallot
	FinalEligible                          []string
	CreatedAt, ClosesAt                    time.Time
	ClosedAt                               *time.Time
	CreationRequestID, CreationRequestHash string
	CloseJob                               PollCloseJob
}
