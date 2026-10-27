package postgres

import (
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) LeaseChatHints(now, until time.Time, lease string, limit int) ([]meetings.ChatHint, error) {
	if lease == "" || !until.After(now) || limit < 1 || limit > 100 {
		return nil, meetings.ErrInvalidRecord
	}

	tx.mu.Lock()
	err := tx.check(true)
	tx.mu.Unlock()
	if err != nil {
		return nil, err
	}

	// Store.Update owns the write lock. Expired claims are reusable after a restart.
	return many[meetings.ChatHint](tx, `WITH claimed AS (UPDATE realtime_outbox SET available_at=$2,lease_id=$3,lease_until=$2,attempts=LEAST(attempts::bigint+1,2147483647)::integer WHERE id IN (SELECT id FROM realtime_outbox WHERE dispatched_at IS NULL AND available_at<=$1 AND (lease_until IS NULL OR lease_until<=$1) ORDER BY available_at,created_at,id LIMIT $4) RETURNING *) SELECT `+chatHintProjection+` FROM claimed ORDER BY available_at,created_at,id`, now, until, lease, limit)
}

func (tx *transaction) FinishChatHint(id, lease string, now, retry time.Time) (bool, error) {
	if lease == "" || (!retry.IsZero() && !retry.After(now)) {
		return false, meetings.ErrInvalidRecord
	}

	var dispatched *time.Time
	if retry.IsZero() {
		dispatched = &now
		retry = now
	}

	tag, err := tx.exec(`UPDATE realtime_outbox SET lease_id='',lease_until=NULL,dispatched_at=$4,available_at=$5 WHERE id=$1 AND lease_id=$2 AND lease_until>$3 AND dispatched_at IS NULL`, id, lease, now, dispatched, retry)

	return tag == 1, err
}

func (tx *transaction) DeleteDispatchedChatHints(limit int) (int, error) {
	if limit < 1 || limit > 100 {
		return 0, meetings.ErrInvalidRecord
	}

	tag, err := tx.exec(`DELETE FROM realtime_outbox WHERE id IN (SELECT id FROM realtime_outbox WHERE dispatched_at IS NOT NULL ORDER BY dispatched_at,id LIMIT $1)`, limit)

	return int(tag), err
}
