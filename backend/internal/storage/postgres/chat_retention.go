package postgres

import (
	"strconv"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) ChatMaintenanceIDs(cutoff time.Time, maximum uint64, limit int) ([]string, error) {
	if maximum == 0 || limit < 1 || limit > 100 {
		return nil, meetings.ErrInvalidRecord
	}

	return many[string](tx, `SELECT to_jsonb(s.meeting_id) FROM meeting_streams s WHERE latest_change_sequence-retained_after>$2::text::numeric OR EXISTS(SELECT 1 FROM meeting_changes c WHERE c.meeting_id=s.meeting_id AND (c.created_at<$1 OR c.change_sequence<=s.retained_after)) ORDER BY s.meeting_id LIMIT $3`, cutoff, strconv.FormatUint(maximum, 10), limit)
}

func (tx *transaction) TrimChatStream(id string, cutoff time.Time, maximum uint64) (meetings.ChatStream, error) {
	tx.mu.Lock()
	err := tx.check(true)
	tx.mu.Unlock()
	if err != nil {
		return meetings.ChatStream{}, err
	}

	if maximum == 0 {
		return meetings.ChatStream{}, meetings.ErrInvalidRecord
	}

	stream, err := tx.ChatStream(id)
	if err != nil {
		return stream, err
	}

	boundary := stream.RetainedAfter
	if stream.LatestSequence > maximum {
		boundary = max(boundary, stream.LatestSequence-maximum)
	}

	if !cutoff.IsZero() {
		expired, err := one[uint64](tx, `SELECT to_jsonb(COALESCE(max(change_sequence),0)) FROM meeting_changes WHERE meeting_id=$1 AND created_at<$2`, id, cutoff)
		if err != nil {
			return stream, err
		}

		boundary = max(boundary, expired)
	}

	if boundary > stream.RetainedAfter {
		if _, err := tx.exec(`UPDATE meeting_streams SET retained_after=$2::text::numeric WHERE meeting_id=$1`, id, strconv.FormatUint(boundary, 10)); err != nil {
			return stream, err
		}

		stream.RetainedAfter = boundary
	}

	if boundary > 0 {
		if _, err := tx.exec(`DELETE FROM meeting_changes WHERE meeting_id=$1 AND change_sequence IN (SELECT change_sequence FROM meeting_changes WHERE meeting_id=$1 AND change_sequence<=$2::text::numeric ORDER BY change_sequence LIMIT 1000)`, id, strconv.FormatUint(boundary, 10)); err != nil {
			return stream, err
		}
	}

	return stream, nil
}

func (tx *transaction) ExpiredChatHints(cutoff time.Time, limit int) ([]meetings.ChatHint, error) {
	if limit < 1 || limit > 100 {
		return nil, meetings.ErrInvalidRecord
	}

	return many[meetings.ChatHint](tx, `SELECT `+chatHintProjection+` FROM realtime_outbox o WHERE (lease_until IS NULL OR lease_until<=$1::timestamptz+interval '7 days') AND (created_at<$1 OR (dispatched_at IS NULL AND EXISTS(SELECT 1 FROM meeting_streams s WHERE s.meeting_id=o.meeting_id AND (s.epoch<>o.epoch OR s.retained_after>o.latest_change_sequence))) OR (NOT terminal AND NOT EXISTS(SELECT 1 FROM meeting_streams s WHERE s.meeting_id=o.meeting_id))) ORDER BY created_at,id LIMIT $2`, cutoff, limit)
}

func (tx *transaction) DeleteChatHints(ids []string) error {
	if len(ids) > 100 {
		return meetings.ErrInvalidRecord
	}

	_, err := tx.exec(`DELETE FROM realtime_outbox WHERE id=ANY($1::text[])`, ids)

	return err
}
