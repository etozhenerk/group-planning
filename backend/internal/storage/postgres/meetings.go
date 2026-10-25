package postgres

import (
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) Meeting(id string) (meetings.Meeting, error) {
	return one[meetings.Meeting](tx, "SELECT document FROM meetings WHERE id=$1", id)
}

func (tx *transaction) Meetings() ([]meetings.Meeting, error) {
	return many[meetings.Meeting](tx, "SELECT document FROM meetings ORDER BY id")
}

func (tx *transaction) SaveMeeting(value meetings.Meeting) error {
	if value.ID == "" {
		return meetings.ErrInvalidRecord
	}

	return tx.save(value, `INSERT INTO meetings(id,organizer_id,status,past_at,document) VALUES($1,$2,$3,$4,$5)
		ON CONFLICT(id) DO UPDATE SET organizer_id=EXCLUDED.organizer_id,status=EXCLUDED.status,past_at=EXCLUDED.past_at,document=EXCLUDED.document`, value.ID, value.OrganizerID, value.Status, value.PastAt)
}

func (tx *transaction) InvitationByToken(token string) (meetings.Invitation, error) {
	return one[meetings.Invitation](tx, "SELECT document FROM invitations WHERE token=$1", token)
}

func (tx *transaction) InvitationForMeeting(id string) (meetings.Invitation, error) {
	return one[meetings.Invitation](tx, "SELECT document FROM invitations WHERE meeting_id=$1", id)
}

func (tx *transaction) InsertInvitation(value meetings.Invitation) error {
	if value.ID == "" || value.Token == "" {
		return meetings.ErrInvalidRecord
	}

	if _, err := tx.Meeting(value.MeetingID); err != nil {
		return err
	}

	return tx.save(value, "INSERT INTO invitations(id,token,meeting_id,document) VALUES($1,$2,$3,$4)", value.ID, value.Token, value.MeetingID)
}

func (tx *transaction) RSVP(meetingID, userID string) (meetings.RSVP, error) {
	return one[meetings.RSVP](tx, "SELECT document FROM rsvps WHERE meeting_id=$1 AND user_id=$2", meetingID, userID)
}

func (tx *transaction) RSVPs(id string) ([]meetings.RSVP, error) {
	if _, err := tx.Meeting(id); err != nil {
		return nil, err
	}

	return many[meetings.RSVP](tx, "SELECT document FROM rsvps WHERE meeting_id=$1 ORDER BY user_id", id)
}

func (tx *transaction) SaveRSVP(value meetings.RSVP) error {
	if value.UserID == "" || (value.Answer != meetings.Going && value.Answer != meetings.Maybe && value.Answer != meetings.NotGoing) {
		return meetings.ErrInvalidRecord
	}

	if _, err := tx.Meeting(value.MeetingID); err != nil {
		return err
	}

	return tx.save(value, `INSERT INTO rsvps(meeting_id,user_id,document) VALUES($1,$2,$3)
		ON CONFLICT(meeting_id,user_id) DO UPDATE SET document=EXCLUDED.document`, value.MeetingID, value.UserID)
}

func (tx *transaction) Receipt(key meetings.RequestKey) (meetings.Receipt, error) {
	return one[meetings.Receipt](tx, "SELECT document FROM request_receipts WHERE user_id=$1 AND operation=$2 AND request_key=$3", key.UserID, key.Operation, key.Key)
}

func (tx *transaction) InsertReceipt(value meetings.Receipt) error {
	key := value.Key
	if key.UserID == "" || key.Operation == "" || key.Key == "" || value.RequestHash == "" {
		return meetings.ErrInvalidRecord
	}

	return tx.save(value, "INSERT INTO request_receipts(user_id,operation,request_key,expires_at,document) VALUES($1,$2,$3,$4,$5)", key.UserID, key.Operation, key.Key, value.ExpiresAt)
}

func (tx *transaction) PruneReceipts(now time.Time) error {
	_, err := tx.exec("DELETE FROM request_receipts WHERE expires_at <= $1", now)
	return err
}
