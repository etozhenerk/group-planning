package postgres

func (tx *transaction) UserRemoved(id string) (bool, error) {
	return one[bool](tx, "SELECT to_jsonb(EXISTS(SELECT 1 FROM removed_meeting_users WHERE user_id=$1))", id)
}

func (tx *transaction) RemoveUser(id string) error {
	if _, err := tx.exec("DELETE FROM meeting_read_markers WHERE user_id=$1", id); err != nil {
		return err
	}

	if _, err := tx.exec("DELETE FROM realtime_outbox WHERE target='user' AND target_id=$1", id); err != nil {
		return err
	}

	if _, err := tx.exec("INSERT INTO removed_meeting_users(user_id) VALUES($1) ON CONFLICT DO NOTHING", id); err != nil {
		return err
	}

	if _, err := tx.exec("DELETE FROM message_reactions WHERE user_id=$1", id); err != nil {
		return err
	}

	_, err := tx.exec("DELETE FROM request_receipts WHERE user_id=$1", id)

	return err
}

func (tx *transaction) DeleteRSVP(meetingID, userID string) error {
	_, err := tx.exec("DELETE FROM rsvps WHERE meeting_id=$1 AND user_id=$2", meetingID, userID)
	return err
}

func (tx *transaction) AnonymizeFeed(meetingID, userID, name string) error {
	_, err := tx.exec("UPDATE feed_entries SET document=jsonb_set(document,'{ActorName}',to_jsonb($3::text)) WHERE meeting_id=$1 AND actor_id=$2", meetingID, userID, name)
	return err
}

func (tx *transaction) DeleteMeeting(id string) error {
	queries := []string{
		"DELETE FROM realtime_outbox WHERE target='meeting' AND meeting_id=$1",
		`DELETE FROM request_receipts WHERE document->>'ResourceID' IN (
		 SELECT $1 UNION SELECT id FROM date_polls WHERE meeting_id=$1
		 UNION SELECT id FROM place_polls WHERE meeting_id=$1
		 UNION SELECT id FROM preparation_tasks WHERE meeting_id=$1
		 UNION SELECT id FROM feed_entries WHERE meeting_id=$1) OR right(operation,37)=':'||$1`,
		"DELETE FROM meeting_covers WHERE meeting_id=$1",
		"DELETE FROM preparation_tasks WHERE meeting_id=$1",
		"DELETE FROM place_polls WHERE meeting_id=$1",
		"DELETE FROM date_polls WHERE meeting_id=$1",
		"DELETE FROM transition_jobs WHERE meeting_id=$1",
		"DELETE FROM rsvps WHERE meeting_id=$1",
		"DELETE FROM invitations WHERE meeting_id=$1",
	}
	for _, query := range queries {
		if _, err := tx.exec(query, id); err != nil {
			return err
		}
	}

	if err := tx.deleteMeetingFeed(id); err != nil {
		return err
	}

	_, err := tx.exec("DELETE FROM meetings WHERE id=$1", id)

	return err
}
