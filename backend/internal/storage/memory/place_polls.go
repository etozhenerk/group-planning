package memory

import (
	"slices"
	"strings"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) PlacePoll(id string) (meetings.PlacePoll, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.PlacePoll{}, err
	}

	poll, ok := tx.data.placePolls[id]
	if !ok {
		return meetings.PlacePoll{}, meetings.ErrNotFound
	}

	return clonePlacePoll(poll), nil
}

func (tx *transaction) PlacePolls() ([]meetings.PlacePoll, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	polls := make([]meetings.PlacePoll, 0, len(tx.data.placePolls))
	for _, poll := range tx.data.placePolls {
		polls = append(polls, clonePlacePoll(poll))
	}

	slices.SortFunc(polls, func(a, b meetings.PlacePoll) int { return strings.Compare(a.ID, b.ID) })

	return polls, nil
}

func (tx *transaction) SavePlacePoll(poll meetings.PlacePoll) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	if poll.ID == "" {
		return meetings.ErrInvalidRecord
	}

	if _, ok := tx.data.meetings[poll.MeetingID]; !ok {
		return meetings.ErrNotFound
	}

	tx.data.placePolls[poll.ID] = clonePlacePoll(poll)

	return nil
}

func clonePlacePoll(poll meetings.PlacePoll) meetings.PlacePoll {
	poll.FinalEligible = slices.Clone(poll.FinalEligible)
	ballots := make(map[string]meetings.PlaceBallot, len(poll.Ballots))
	for id, ballot := range poll.Ballots {
		ballots[id] = ballot
	}

	poll.Ballots = ballots
	if poll.ClosedAt != nil {
		closed := *poll.ClosedAt
		poll.ClosedAt = &closed
	}

	return poll
}
