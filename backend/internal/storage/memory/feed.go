package memory

import (
	"encoding/json"
	"math"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) Feed(meetingID string) ([]meetings.FeedEntry, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	if _, ok := tx.data.meetings[meetingID]; !ok {
		return nil, meetings.ErrNotFound
	}

	return cloneEntries(tx.data.feed[meetingID]), nil
}

func (tx *transaction) AppendEntry(entry meetings.FeedEntry) (meetings.FeedEntry, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return meetings.FeedEntry{}, err
	}

	if entry.ID == "" || entry.Sequence != 0 || !json.Valid(entry.Payload) {
		return meetings.FeedEntry{}, meetings.ErrInvalidRecord
	}

	if _, ok := tx.data.meetings[entry.MeetingID]; !ok {
		return meetings.FeedEntry{}, meetings.ErrNotFound
	}

	key := messageKey{entry.MeetingID, entry.ActorID, entry.ClientRequestID}
	_, entryExists := tx.data.entryIDs[entry.ID]
	_, messageExists := tx.data.messageIDs[key]
	if entryExists || (entry.ClientRequestID != "" && messageExists) {
		return meetings.FeedEntry{}, meetings.ErrAlreadyExists
	}

	entries := tx.data.feed[entry.MeetingID]
	entry.Sequence = 1
	if len(entries) > 0 {
		last := entries[len(entries)-1].Sequence
		if last == math.MaxUint64 {
			return meetings.FeedEntry{}, meetings.ErrInvalidRecord
		}

		entry.Sequence = last + 1
	}

	tx.data.feed[entry.MeetingID] = append(tx.data.feed[entry.MeetingID], cloneEntry(entry))
	tx.data.entryIDs[entry.ID] = entryLocation{entry.MeetingID, len(entries)}
	if entry.ClientRequestID != "" {
		tx.data.messageIDs[key] = len(entries)
	}

	return cloneEntry(entry), nil
}
