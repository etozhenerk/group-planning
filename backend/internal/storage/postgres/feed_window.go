package postgres

import (
	"slices"
	"strconv"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

const (
	feedInitialSQL = `SELECT document FROM feed_entries WHERE meeting_id=$1 ORDER BY sequence DESC LIMIT $2`
	feedAfterSQL   = `SELECT document FROM feed_entries WHERE meeting_id=$1 AND sequence>$2::text::numeric ORDER BY sequence ASC LIMIT $3`
	feedBeforeSQL  = `SELECT document FROM feed_entries WHERE meeting_id=$1 AND sequence<$2::text::numeric ORDER BY sequence DESC LIMIT $3`
	feedTailSQL    = `SELECT coalesce((SELECT sequence FROM feed_entries WHERE meeting_id=$1 ORDER BY sequence DESC LIMIT 1),0)::text`
	feedEntrySQL   = `SELECT document FROM feed_entries WHERE meeting_id=$1 AND id=$2`
	feedRequestSQL = `SELECT document FROM feed_entries WHERE meeting_id=$1 AND actor_id=$2 AND client_request_id=$3 AND client_request_id<>''`
)

func (tx *transaction) FeedWindow(id string, query meetings.FeedQuery) (meetings.FeedWindow, error) {
	if query.Limit < 1 || query.Limit > 100 || (query.After != nil && query.Before != nil) || query.AroundEntryID != "" {
		return meetings.FeedWindow{}, meetings.ErrInvalidRecord
	}

	if _, err := tx.Meeting(id); err != nil {
		return meetings.FeedWindow{}, err
	}

	latest, err := tx.feedTail(id)
	if err != nil {
		return meetings.FeedWindow{}, err
	}

	sql := feedInitialSQL
	args := []any{id, query.Limit + 1}
	if query.After != nil {
		sql = feedAfterSQL
		args = []any{id, strconv.FormatUint(*query.After, 10), query.Limit + 1}
	} else if query.Before != nil {
		sql = feedBeforeSQL
		args = []any{id, strconv.FormatUint(*query.Before, 10), query.Limit + 1}
	}

	entries, err := many[meetings.FeedEntry](tx, sql, args...)
	if err != nil {
		return meetings.FeedWindow{}, err
	}

	more := len(entries) > query.Limit
	if more {
		entries = entries[:query.Limit]
	}

	if query.After == nil {
		slices.Reverse(entries)
	}

	return meetings.FeedWindow{Entries: entries, LatestSequence: latest, HasMore: more}, nil
}

func (tx *transaction) feedTail(id string) (uint64, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return 0, err
	}

	var raw string
	err := tx.tx.QueryRow(tx.ctx, feedTailSQL, id).Scan(&raw)
	if err != nil {
		tx.err = storageError(err)
		return 0, tx.err
	}

	sequence, err := strconv.ParseUint(raw, 10, 64)
	if err != nil {
		tx.err = ErrUnavailable
		return 0, tx.err
	}

	return sequence, nil
}

func (tx *transaction) FeedEntry(meetingID, entryID string) (meetings.FeedEntry, error) {
	return one[meetings.FeedEntry](tx, feedEntrySQL, meetingID, entryID)
}

func (tx *transaction) MessageByRequest(meetingID, actorID, requestID string) (meetings.FeedEntry, error) {
	return one[meetings.FeedEntry](tx, feedRequestSQL, meetingID, actorID, requestID)
}
