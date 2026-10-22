package memory

import (
	"slices"
	"strings"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) DatePoll(id string) (meetings.DatePoll, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.DatePoll{}, err
	}

	poll, ok := tx.data.polls[id]
	if !ok {
		return meetings.DatePoll{}, meetings.ErrNotFound
	}

	return cloneDatePoll(poll), nil
}

func (tx *transaction) DatePolls() ([]meetings.DatePoll, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	polls := make([]meetings.DatePoll, 0, len(tx.data.polls))
	for _, poll := range tx.data.polls {
		polls = append(polls, cloneDatePoll(poll))
	}

	slices.SortFunc(polls, func(a, b meetings.DatePoll) int { return strings.Compare(a.ID, b.ID) })

	return polls, nil
}

func (tx *transaction) SaveDatePoll(poll meetings.DatePoll) error {
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

	tx.data.polls[poll.ID] = cloneDatePoll(poll)

	return nil
}

func cloneDatePoll(poll meetings.DatePoll) meetings.DatePoll {
	poll.Options = slices.Clone(poll.Options)
	poll.FinalEligible = slices.Clone(poll.FinalEligible)
	poll.Leaders = slices.Clone(poll.Leaders)
	ballots := make(map[string]meetings.DateBallot, len(poll.Ballots))
	for id, ballot := range poll.Ballots {
		ballot.OptionIDs = slices.Clone(ballot.OptionIDs)
		ballots[id] = ballot
	}

	poll.Ballots = ballots
	if poll.ClosedAt != nil {
		closed := *poll.ClosedAt
		poll.ClosedAt = &closed
	}

	return poll
}
