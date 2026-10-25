package httpapi

import (
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type pollSettingsResponse struct {
	MultipleAnswers bool `json:"multiple_answers"`
	AllowRevoting   bool `json:"allow_revoting"`
	AllowNewOptions bool `json:"allow_new_options"`
	Anonymous       bool `json:"anonymous"`
	HideResults     bool `json:"hide_results"`
}

type pollOptionResponse struct {
	ID     string         `json:"id"`
	Date   string         `json:"date"`
	Votes  *int           `json:"votes"`
	Voters []userResponse `json:"voters"`
}

type datePollResponse struct {
	ID              string               `json:"id"`
	MeetingID       string               `json:"meeting_id"`
	Author          userResponse         `json:"author"`
	Settings        pollSettingsResponse `json:"settings"`
	Options         []pollOptionResponse `json:"options"`
	State           meetings.PollState   `json:"state"`
	Revision        string               `json:"revision"`
	MyVoteRevision  string               `json:"my_vote_revision"`
	MyOptionIDs     []string             `json:"my_option_ids"`
	CreatedAt       time.Time            `json:"created_at"`
	ClosesAt        time.Time            `json:"closes_at"`
	ClosedAt        *time.Time           `json:"closed_at"`
	LeaderOptionIDs []string             `json:"leader_option_ids"`
	AppliedOptionID *string              `json:"applied_option_id"`
	CanVote         bool                 `json:"can_vote"`
	CanAddOptions   bool                 `json:"can_add_options"`
	CanResolve      bool                 `json:"can_resolve"`
}

func datePollDTO(view meetings.DatePollView) datePollResponse {
	settings := view.Settings
	result := datePollResponse{
		ID:              view.ID,
		MeetingID:       view.MeetingID,
		Author:          userResponse{ID: view.Author.ID, DisplayName: view.Author.Name},
		Settings:        pollSettingsResponse{settings.MultipleAnswers, settings.AllowRevoting, settings.AllowNewOptions, settings.Anonymous, settings.HideResults},
		Options:         []pollOptionResponse{},
		State:           view.State,
		Revision:        decimal(view.Revision),
		MyVoteRevision:  decimal(view.MyVoteRevision),
		MyOptionIDs:     view.MyOptionIDs,
		CreatedAt:       view.CreatedAt,
		ClosesAt:        view.ClosesAt,
		ClosedAt:        view.ClosedAt,
		LeaderOptionIDs: view.Leaders,
		AppliedOptionID: optionalString(view.AppliedOptionID),
		CanVote:         view.CanVote,
		CanAddOptions:   view.CanAddOptions,
		CanResolve:      view.CanResolve,
	}
	for _, option := range view.Options {
		item := pollOptionResponse{ID: option.Option.ID, Date: option.Option.Date, Votes: option.Votes}
		if option.Voters != nil {
			item.Voters = []userResponse{}
			for _, voter := range option.Voters {
				item.Voters = append(item.Voters, userResponse{ID: voter.ID, DisplayName: voter.Name})
			}
		}

		result.Options = append(result.Options, item)
	}

	return result
}
