package postgres

import (
	"math"
	"strconv"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

const (
	chatStreamSQL        = `SELECT jsonb_build_object('MeetingID',meeting_id,'Epoch',epoch,'LatestSequence',latest_change_sequence,'RetainedAfter',retained_after) FROM meeting_streams WHERE meeting_id=$1`
	chatChangeProjection = `jsonb_build_object('MeetingID',meeting_id,'Sequence',change_sequence,'Kind',kind,'EntryID',entry_id,'ResourceKind',resource_kind,'ResourceID',resource_id,'CreatedAt',created_at)`
	chatChangesSQL       = `SELECT ` + chatChangeProjection + ` FROM meeting_changes WHERE meeting_id=$1 AND change_sequence>$2::text::numeric AND change_sequence<=$3::text::numeric ORDER BY change_sequence LIMIT $4`
	chatHintProjection   = `jsonb_build_object('ID',id,'Target',target,'TargetID',target_id,'MeetingID',meeting_id,'Epoch',epoch,'LatestSequence',latest_change_sequence,'SchemaVersion',schema_version,'Terminal',terminal,'Invalidation',invalidation,'CreatedAt',created_at,'AvailableAt',available_at,'Attempts',attempts,'DispatchedAt',dispatched_at,'LeaseID',lease_id,'LeaseUntil',lease_until)`
)

func (tx *transaction) ChatStream(id string) (meetings.ChatStream, error) {
	return one[meetings.ChatStream](tx, chatStreamSQL, id)
}

func (tx *transaction) AppendChatChanges(id, epoch string, changes []meetings.ChatChange) (meetings.ChatStream, error) {
	if epoch == "" || len(changes) == 0 {
		return meetings.ChatStream{}, meetings.ErrInvalidRecord
	}

	for _, change := range changes {
		if change.MeetingID != id || change.Sequence != 0 || !change.Valid() {
			return meetings.ChatStream{}, meetings.ErrInvalidRecord
		}
	}

	if _, err := tx.exec(`INSERT INTO meeting_streams(meeting_id,epoch) VALUES($1,$2) ON CONFLICT DO NOTHING`, id, epoch); err != nil {
		return meetings.ChatStream{}, err
	}

	stream, err := tx.ChatStream(id)
	if err != nil {
		return meetings.ChatStream{}, err
	}

	if uint64(len(changes)) > math.MaxUint64-stream.LatestSequence {
		return meetings.ChatStream{}, meetings.ErrInvalidRecord
	}

	for _, change := range changes {
		stream.LatestSequence++
		if _, err := tx.exec(`INSERT INTO meeting_changes(meeting_id,change_sequence,kind,entry_id,resource_kind,resource_id,created_at) VALUES($1,$2::text::numeric,$3,$4,$5,$6,$7)`, id, strconv.FormatUint(stream.LatestSequence, 10), change.Kind, change.EntryID, change.ResourceKind, change.ResourceID, change.CreatedAt); err != nil {
			return meetings.ChatStream{}, err
		}
	}

	if _, err := tx.exec(`UPDATE meeting_streams SET latest_change_sequence=$2::text::numeric WHERE meeting_id=$1`, id, strconv.FormatUint(stream.LatestSequence, 10)); err != nil {
		return meetings.ChatStream{}, err
	}

	return stream, nil
}

func (tx *transaction) ChatChanges(id string, after, through uint64, limit int) (meetings.ChatChangesPage, error) {
	stream, err := tx.ChatStream(id)
	if err != nil {
		return meetings.ChatChangesPage{}, err
	}

	if limit < 1 || limit > 100 || after > through || through > stream.LatestSequence || after < stream.RetainedAfter {
		return meetings.ChatChangesPage{}, meetings.ErrChangeCursorInvalid
	}

	changes, err := many[meetings.ChatChange](tx, chatChangesSQL, id, strconv.FormatUint(after, 10), strconv.FormatUint(through, 10), limit+1)
	if err != nil {
		return meetings.ChatChangesPage{}, err
	}

	more := len(changes) > limit
	if more {
		changes = changes[:limit]
	}

	return meetings.ChatChangesPage{Changes: changes, HasMore: more}, nil
}

func (tx *transaction) EnqueueChatHint(h meetings.ChatHint) error {
	if !h.Valid() {
		return meetings.ErrInvalidRecord
	}

	if h.Target == "meeting" {
		if _, err := tx.Meeting(h.MeetingID); err != nil {
			return err
		}
	}

	if h.Target == "user" {
		removed, err := tx.UserRemoved(h.TargetID)
		if err != nil {
			return err
		}

		if removed {
			return meetings.ErrNotFound
		}
	}

	_, err := tx.exec(`INSERT INTO realtime_outbox(id,target,target_id,meeting_id,epoch,latest_change_sequence,schema_version,terminal,created_at,available_at,attempts,dispatched_at,invalidation) VALUES($1,$2,$3,$4,$5,$6::text::numeric,$7,$8,$9,$10,$11,$12,$13)`, h.ID, h.Target, h.TargetID, h.MeetingID, h.Epoch, strconv.FormatUint(h.LatestSequence, 10), h.SchemaVersion, h.Terminal, h.CreatedAt, h.AvailableAt, h.Attempts, h.DispatchedAt, h.Invalidation)

	return err
}

func (tx *transaction) PendingChatHints(now time.Time, limit int) ([]meetings.ChatHint, error) {
	if limit < 1 || limit > 100 {
		return nil, meetings.ErrInvalidRecord
	}

	return many[meetings.ChatHint](tx, `SELECT `+chatHintProjection+` FROM realtime_outbox WHERE dispatched_at IS NULL AND available_at<=$1 AND (lease_until IS NULL OR lease_until<=$1) ORDER BY available_at,created_at,id LIMIT $2`, now, limit)
}

func (tx *transaction) ReactionActive(value meetings.Reaction) (bool, error) {
	return one[bool](tx, `SELECT to_jsonb(EXISTS(SELECT 1 FROM message_reactions WHERE meeting_id=$1 AND entry_id=$2 AND user_id=$3 AND emoji=$4))`, value.MeetingID, value.EntryID, value.UserID, value.Emoji)
}

func (tx *transaction) FeedNeedsAnonymization(id, userID, name string) (bool, error) {
	return one[bool](tx, `SELECT to_jsonb(EXISTS(SELECT 1 FROM feed_entries WHERE meeting_id=$1 AND actor_id=$2 AND document->>'ActorName'<>$3))`, id, userID, name)
}

func (tx *transaction) ReactionsForEntries(id string, ids []string) ([]meetings.Reaction, error) {
	if len(ids) > 100 {
		return nil, meetings.ErrInvalidRecord
	}

	return many[meetings.Reaction](tx, `SELECT jsonb_build_object('MeetingID',meeting_id,'EntryID',entry_id,'UserID',user_id,'Emoji',emoji) FROM message_reactions WHERE meeting_id=$1 AND entry_id=ANY($2::text[]) ORDER BY entry_id,emoji,user_id`, id, ids)
}

func (tx *transaction) EnsureChatStream(id, epoch string) (meetings.ChatStream, error) {
	if epoch == "" {
		return meetings.ChatStream{}, meetings.ErrInvalidRecord
	}

	if _, err := tx.exec(`INSERT INTO meeting_streams(meeting_id,epoch) VALUES($1,$2) ON CONFLICT DO NOTHING`, id, epoch); err != nil {
		return meetings.ChatStream{}, err
	}

	return tx.ChatStream(id)
}
