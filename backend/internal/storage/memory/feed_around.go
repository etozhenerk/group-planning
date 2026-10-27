package memory

import "github.com/etozhenerk/group-planning/backend/internal/meetings"

func (tx *transaction) FeedAround(id, entryID string, limit int) (meetings.FeedRange, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.FeedRange{}, err
	}

	if limit < 1 || limit > 100 {
		return meetings.FeedRange{}, meetings.ErrInvalidRecord
	}

	location, ok := tx.data.entryIDs[entryID]
	if !ok || location.meetingID != id {
		return meetings.FeedRange{}, meetings.ErrNotFound
	}

	entries := tx.data.feed[id]
	at := location.offset
	result := meetings.AssembleFeedRange(entries[max(0, at-limit):at], entries[at], entries[at+1:min(len(entries), at+1+limit)], entries[len(entries)-1].Sequence, limit)
	result.Entries = cloneEntries(result.Entries)

	return result, nil
}
