package postgres

import "github.com/etozhenerk/group-planning/backend/internal/meetings"

func (tx *transaction) FeedAround(id, entryID string, limit int) (meetings.FeedRange, error) {
	if limit < 1 || limit > 100 {
		return meetings.FeedRange{}, meetings.ErrInvalidRecord
	}

	anchor, err := tx.FeedEntry(id, entryID)
	if err != nil {
		return meetings.FeedRange{}, err
	}

	before, err := tx.FeedWindow(id, meetings.FeedQuery{Before: &anchor.Sequence, Limit: limit})
	if err != nil {
		return meetings.FeedRange{}, err
	}

	after, err := tx.FeedWindow(id, meetings.FeedQuery{After: &anchor.Sequence, Limit: limit})
	if err != nil {
		return meetings.FeedRange{}, err
	}

	return meetings.AssembleFeedRange(before.Entries, anchor, after.Entries, after.LatestSequence, limit), nil
}
