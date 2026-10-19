package memory

import (
	"slices"
	"strings"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) Meeting(id string) (meetings.Meeting, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.Meeting{}, err
	}
	meeting, ok := tx.data.meetings[id]
	if !ok {
		return meetings.Meeting{}, meetings.ErrNotFound
	}
	return cloneMeeting(meeting), nil
}

func (tx *transaction) Meetings() ([]meetings.Meeting, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}
	result := make([]meetings.Meeting, 0, len(tx.data.meetings))
	for _, meeting := range tx.data.meetings {
		result = append(result, cloneMeeting(meeting))
	}
	slices.SortFunc(result, func(a, b meetings.Meeting) int { return strings.Compare(a.ID, b.ID) })
	return result, nil
}

func (tx *transaction) SaveMeeting(meeting meetings.Meeting) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}
	if meeting.ID == "" {
		return meetings.ErrInvalidRecord
	}
	tx.data.meetings[meeting.ID] = cloneMeeting(meeting)
	return nil
}

func (tx *transaction) InvitationByToken(token string) (meetings.Invitation, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.Invitation{}, err
	}
	invitation, ok := tx.data.invitations[token]
	if !ok {
		return meetings.Invitation{}, meetings.ErrNotFound
	}
	return invitation, nil
}

func (tx *transaction) InsertInvitation(invitation meetings.Invitation) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}
	if invitation.ID == "" || invitation.Token == "" {
		return meetings.ErrInvalidRecord
	}
	if _, ok := tx.data.meetings[invitation.MeetingID]; !ok {
		return meetings.ErrNotFound
	}
	if _, ok := tx.data.invitations[invitation.Token]; ok || tx.data.inviteIDs[invitation.ID] {
		return meetings.ErrAlreadyExists
	}
	for _, current := range tx.data.invitations {
		if current.MeetingID == invitation.MeetingID {
			return meetings.ErrAlreadyExists
		}
	}
	tx.data.invitations[invitation.Token] = invitation
	tx.data.inviteIDs[invitation.ID] = true
	return nil
}

func (tx *transaction) InvitationForMeeting(id string) (meetings.Invitation, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.Invitation{}, err
	}
	for _, invitation := range tx.data.invitations {
		if invitation.MeetingID == id {
			return invitation, nil
		}
	}
	return meetings.Invitation{}, meetings.ErrNotFound
}
