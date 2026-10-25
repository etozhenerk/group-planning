package memory

import "github.com/etozhenerk/group-planning/backend/internal/meetings"

func (tx *transaction) Reactions(meetingID string) ([]meetings.Reaction, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	result := []meetings.Reaction{}
	for _, reaction := range tx.data.reactions {
		if reaction.MeetingID == meetingID {
			result = append(result, reaction)
		}
	}

	return result, nil
}

func (tx *transaction) SaveReaction(value meetings.Reaction, active bool) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	if value.MeetingID == "" || value.EntryID == "" || value.UserID == "" || value.Emoji == "" {
		return meetings.ErrInvalidRecord
	}

	if _, ok := tx.data.meetings[value.MeetingID]; !ok {
		return meetings.ErrNotFound
	}

	entryFound := false
	for _, entry := range tx.data.feed[value.MeetingID] {
		if entry.ID == value.EntryID {
			entryFound = true
			break
		}
	}

	if !entryFound {
		return meetings.ErrNotFound
	}

	if active {
		tx.data.reactions[value] = value
	} else {
		delete(tx.data.reactions, value)
	}

	return nil
}
