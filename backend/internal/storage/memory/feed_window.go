package memory

import (
	"sort"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) FeedWindow(id string, query meetings.FeedQuery) (meetings.FeedWindow, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.FeedWindow{}, err
	}

	if query.Limit < 1 || query.Limit > 100 || (query.After != nil && query.Before != nil) || query.AroundEntryID != "" {
		return meetings.FeedWindow{}, meetings.ErrInvalidRecord
	}

	if _, ok := tx.data.meetings[id]; !ok {
		return meetings.FeedWindow{}, meetings.ErrNotFound
	}

	entries := tx.data.feed[id]
	result := meetings.FeedWindow{Entries: []meetings.FeedEntry{}}
	if len(entries) > 0 {
		result.LatestSequence = entries[len(entries)-1].Sequence
	}

	start, end := 0, len(entries)
	if query.After != nil {
		start = sort.Search(len(entries), func(i int) bool { return entries[i].Sequence > *query.After })
	}

	if query.Before != nil {
		end = sort.Search(len(entries), func(i int) bool { return entries[i].Sequence >= *query.Before })
	}

	if end-start > query.Limit {
		result.HasMore = true
		if query.After != nil {
			end = start + query.Limit
		} else {
			start = end - query.Limit
		}
	}

	result.Entries = cloneEntries(entries[start:end])

	return result, nil
}

func (tx *transaction) FeedEntry(meetingID, entryID string) (meetings.FeedEntry, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.FeedEntry{}, err
	}

	location, ok := tx.data.entryIDs[entryID]
	if !ok || location.meetingID != meetingID {
		return meetings.FeedEntry{}, meetings.ErrNotFound
	}

	return cloneEntry(tx.data.feed[meetingID][location.offset]), nil
}

func (tx *transaction) MessageByRequest(meetingID, actorID, requestID string) (meetings.FeedEntry, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.FeedEntry{}, err
	}

	offset, ok := tx.data.messageIDs[messageKey{meetingID, actorID, requestID}]
	if !ok || requestID == "" {
		return meetings.FeedEntry{}, meetings.ErrNotFound
	}

	return cloneEntry(tx.data.feed[meetingID][offset]), nil
}
