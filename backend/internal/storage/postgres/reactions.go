package postgres

import "github.com/etozhenerk/group-planning/backend/internal/meetings"

func (tx *transaction) Reactions(meetingID string) ([]meetings.Reaction, error) {
	return many[meetings.Reaction](tx, "SELECT document FROM message_reactions WHERE meeting_id=$1 ORDER BY entry_id,user_id,emoji", meetingID)
}

func (tx *transaction) SaveReaction(value meetings.Reaction, active bool) error {
	if value.MeetingID == "" || value.EntryID == "" || value.UserID == "" || value.Emoji == "" {
		return meetings.ErrInvalidRecord
	}

	if !active {
		_, err := tx.exec("DELETE FROM message_reactions WHERE meeting_id=$1 AND entry_id=$2 AND user_id=$3 AND emoji=$4", value.MeetingID, value.EntryID, value.UserID, value.Emoji)
		return err
	}

	return tx.save(value, `INSERT INTO message_reactions(meeting_id,entry_id,user_id,emoji,document) VALUES($1,$2,$3,$4,$5) ON CONFLICT(entry_id,user_id,emoji) DO NOTHING`, value.MeetingID, value.EntryID, value.UserID, value.Emoji)
}
