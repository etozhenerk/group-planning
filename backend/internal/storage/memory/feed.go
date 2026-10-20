package memory

import (
	"encoding/json"

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
	if tx.data.entryIDs[entry.ID] || (entry.ClientRequestID != "" && tx.data.messageIDs[key]) {
		return meetings.FeedEntry{}, meetings.ErrAlreadyExists
	}

	entry.Sequence = uint64(len(tx.data.feed[entry.MeetingID])) + 1
	tx.data.feed[entry.MeetingID] = append(tx.data.feed[entry.MeetingID], cloneEntry(entry))
	tx.data.entryIDs[entry.ID] = true
	if entry.ClientRequestID != "" {
		tx.data.messageIDs[key] = true
	}

	return cloneEntry(entry), nil
}
