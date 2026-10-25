package postgres

import (
	"encoding/json"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) Feed(id string) ([]meetings.FeedEntry, error) {
	if _, err := tx.Meeting(id); err != nil {
		return nil, err
	}

	return many[meetings.FeedEntry](tx, "SELECT document FROM feed_entries WHERE meeting_id=$1 ORDER BY sequence", id)
}

func (tx *transaction) AppendEntry(value meetings.FeedEntry) (meetings.FeedEntry, error) {
	if value.ID == "" || value.Sequence != 0 || !json.Valid(value.Payload) {
		return meetings.FeedEntry{}, meetings.ErrInvalidRecord
	}

	if _, err := tx.Meeting(value.MeetingID); err != nil {
		return meetings.FeedEntry{}, err
	}

	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return meetings.FeedEntry{}, err
	}

	data, err := json.Marshal(value)
	if err != nil {
		return meetings.FeedEntry{}, meetings.ErrInvalidRecord
	}

	var result []byte
	err = tx.tx.QueryRow(tx.ctx, `WITH next AS (SELECT coalesce(max(sequence),0)+1 AS sequence FROM feed_entries WHERE meeting_id=$2)
		INSERT INTO feed_entries(id,meeting_id,sequence,actor_id,client_request_id,document)
		SELECT $1,$2,sequence,$3,$4,jsonb_set($5::jsonb,'{Sequence}',to_jsonb(sequence)) FROM next RETURNING document`,
		value.ID, value.MeetingID, value.ActorID, value.ClientRequestID, data).Scan(&result)
	if err != nil {
		tx.err = storageError(err)
		return meetings.FeedEntry{}, tx.err
	}

	if json.Unmarshal(result, &value) != nil {
		tx.err = ErrUnavailable
		return meetings.FeedEntry{}, tx.err
	}

	return value, nil
}
