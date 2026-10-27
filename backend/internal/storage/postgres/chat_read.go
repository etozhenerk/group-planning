package postgres

import (
	"strconv"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

const (
	readMarkerProjection = `jsonb_build_object('MeetingID',meeting_id,'UserID',user_id,'Baseline',unread_baseline_sequence,'ReadThrough',read_through_sequence,'UpdatedAt',updated_at)`
	readParticipantsSQL  = `SELECT id AS meeting_id,organizer_id AS user_id FROM meetings WHERE organizer_id<>'' UNION SELECT meeting_id,user_id FROM rsvps WHERE document->>'Answer'='going'`
	activeReaderSQL      = `NOT EXISTS(SELECT 1 FROM removed_meeting_users removed WHERE removed.user_id=r.user_id) AND (m.organizer_id=r.user_id OR EXISTS(SELECT 1 FROM rsvps v WHERE v.meeting_id=r.meeting_id AND v.user_id=r.user_id AND v.document->>'Answer'='going'))`
	// The lateral LIMIT keeps each requested ID as a primary-key point lookup.
	// A flattenable join can otherwise scan a meeting's entire message index.
	chatReceiptCountsSQL = `SELECT jsonb_build_object('EntryID',f.id,'ReaderCount',(SELECT count(*) FROM meeting_read_markers r JOIN meetings m ON m.id=r.meeting_id WHERE r.meeting_id=$1 AND r.user_id<>$2 AND r.read_through_sequence>=f.sequence AND ` + activeReaderSQL + `))
FROM unnest($3::text[]) WITH ORDINALITY requested(id,position)
CROSS JOIN LATERAL (
    SELECT id,meeting_id,actor_id,sequence,document->>'Kind' AS kind
    FROM feed_entries WHERE id=requested.id LIMIT 1
) f
WHERE f.meeting_id=$1 AND f.actor_id=$2 AND f.kind='message'
ORDER BY requested.position`
	unreadMessagesSQL = `FROM feed_entries WHERE meeting_id=$1 AND sequence>$2::text::numeric AND actor_id<>$3 AND document->>'Kind'='message'`
)

func (tx *transaction) ChatReadMarker(id, userID string) (meetings.ReadMarker, error) {
	return one[meetings.ReadMarker](tx, `SELECT `+readMarkerProjection+` FROM meeting_read_markers WHERE meeting_id=$1 AND user_id=$2`, id, userID)
}

func (tx *transaction) EnsureChatReadMarker(id, userID string, now time.Time) (meetings.ReadMarker, error) {
	if userID == "" || now.IsZero() {
		return meetings.ReadMarker{}, meetings.ErrInvalidRecord
	}

	if _, err := tx.Meeting(id); err != nil {
		return meetings.ReadMarker{}, err
	}

	if removed, err := tx.UserRemoved(userID); err != nil {
		return meetings.ReadMarker{}, err
	} else if removed {
		return meetings.ReadMarker{}, meetings.ErrInvalidRecord
	}

	_, err := tx.exec(`INSERT INTO meeting_read_markers(meeting_id,user_id,unread_baseline_sequence,updated_at) SELECT $1,$2,coalesce((SELECT sequence FROM feed_entries WHERE meeting_id=$1 ORDER BY sequence DESC LIMIT 1),0),$3 WHERE NOT EXISTS(SELECT 1 FROM removed_meeting_users WHERE user_id=$2) ON CONFLICT DO NOTHING`, id, userID, now)
	if err != nil {
		return meetings.ReadMarker{}, err
	}

	return tx.ChatReadMarker(id, userID)
}

func (tx *transaction) InitializeChatReadMarkers(now time.Time) error {
	if now.IsZero() {
		return meetings.ErrInvalidRecord
	}

	_, err := tx.exec(`INSERT INTO meeting_read_markers(meeting_id,user_id,unread_baseline_sequence,updated_at) SELECT p.meeting_id,p.user_id,coalesce((SELECT sequence FROM feed_entries f WHERE f.meeting_id=p.meeting_id ORDER BY sequence DESC LIMIT 1),0),$1 FROM (`+readParticipantsSQL+`) p WHERE NOT EXISTS(SELECT 1 FROM removed_meeting_users d WHERE d.user_id=p.user_id) ON CONFLICT DO NOTHING`, now)

	return err
}

func (tx *transaction) AdvanceChatReadMarker(id, userID string, sequence uint64, now time.Time) (meetings.ReadMarker, bool, error) {
	if sequence == 0 || now.IsZero() {
		return meetings.ReadMarker{}, false, meetings.ErrInvalidRecord
	}

	n, err := tx.exec(`UPDATE meeting_read_markers SET read_through_sequence=$3::text::numeric,updated_at=$4 WHERE meeting_id=$1 AND user_id=$2 AND read_through_sequence<$3::text::numeric`, id, userID, strconv.FormatUint(sequence, 10), now)
	if err != nil {
		return meetings.ReadMarker{}, false, err
	}

	marker, err := tx.ChatReadMarker(id, userID)

	return marker, n == 1, err
}

func (tx *transaction) ChatReadState(id, userID string) (meetings.ReadState, error) {
	marker, err := tx.ChatReadMarker(id, userID)
	if err != nil {
		return meetings.ReadState{}, err
	}

	state, err := one[meetings.ReadState](tx, `SELECT jsonb_build_object('UnreadCount',(SELECT count(*) `+unreadMessagesSQL+`),'FirstUnread',coalesce((SELECT id `+unreadMessagesSQL+` ORDER BY sequence LIMIT 1),''))`, id, strconv.FormatUint(max(marker.Baseline, marker.ReadThrough), 10), userID)
	state.ReadMarker = marker

	return state, err
}

func (tx *transaction) ChatReceiptCounts(id, author string, entryIDs []string) ([]meetings.ReadReceipt, error) {
	if len(entryIDs) < 1 || len(entryIDs) > 100 {
		return nil, meetings.ErrInvalidRecord
	}

	return many[meetings.ReadReceipt](tx, chatReceiptCountsSQL, id, author, entryIDs)
}

func (tx *transaction) ChatReaderIDs(id, author string, sequence uint64, after string, limit int) ([]string, error) {
	if limit < 1 || limit > 100 {
		return nil, meetings.ErrInvalidRecord
	}

	return many[string](tx, `SELECT to_jsonb(r.user_id) FROM meeting_read_markers r JOIN meetings m ON m.id=r.meeting_id WHERE r.meeting_id=$1 AND r.user_id<>$2 AND r.read_through_sequence>=$3::text::numeric AND r.user_id>$4 AND `+activeReaderSQL+` ORDER BY r.user_id LIMIT $5`, id, author, strconv.FormatUint(sequence, 10), after, limit+1)
}
