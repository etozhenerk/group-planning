package meetings

import (
	"context"
	"encoding/base64"
	"time"
)

// PublicInvitation contains only details a holder of the invitation may see.
// Only the organizer's public identity may be resolved; contacts and chat stay private.
type PublicInvitation struct {
	OrganizerID        string
	MeetingID          string
	Title              string
	Description        string
	StartsOn           string
	StartsAt           *time.Time
	Timezone           string
	Place              string
	CoverVersion       string
	JoinClosesAt       *time.Time
	CanJoin            bool
	JoinDisabledReason string
}

func validInvitationToken(token string) bool {
	decoded, err := base64.RawURLEncoding.DecodeString(token)
	return err == nil && (len(decoded) == 16 || len(decoded) == 32) && base64.RawURLEncoding.EncodeToString(decoded) == token
}

// Preview reads public details from a consistent snapshot without changing RSVP.
func Preview(ctx context.Context, store Store, token string) (PublicInvitation, error) {
	if !validInvitationToken(token) {
		return PublicInvitation{}, ErrNotFound
	}

	var preview PublicInvitation
	err := store.View(ctx, func(reader Reader) error {
		invitation, err := reader.InvitationByToken(token)
		if err != nil {
			return err
		}

		meeting, err := reader.Meeting(invitation.MeetingID)
		if err != nil {
			return err
		}

		preview = publicInvitation(meeting)

		return nil
	})

	return preview, err
}

func publicInvitation(meeting Meeting) PublicInvitation {
	return PublicInvitation{
		OrganizerID:  meeting.OrganizerID,
		MeetingID:    meeting.ID,
		Title:        meeting.Title,
		Description:  meeting.Description,
		StartsOn:     meeting.StartsOn,
		StartsAt:     meeting.StartsAt,
		Timezone:     meeting.Timezone,
		Place:        meeting.Place,
		CoverVersion: meeting.CoverVersion,
		CanJoin:      true,
	}
}

func (s *Service) invitationAvailability(meeting Meeting, response RSVP, userID string) PublicInvitation {
	preview := publicInvitation(meeting)
	if meeting.StartsAt != nil {
		closes := meeting.StartsAt.Add(-time.Hour)
		preview.JoinClosesAt = &closes
	}

	if meeting.OrganizerID == userID || response.Answer == Going {
		return preview
	}

	preview.JoinDisabledReason = joinDisabledReason(meeting, s.now())
	preview.CanJoin = preview.JoinDisabledReason == ""

	return preview
}

func joinDisabledReason(meeting Meeting, now time.Time) string {
	if meeting.Status == Past {
		return "meeting_past"
	}

	if meeting.StartsAt != nil && !now.Before(meeting.StartsAt.Add(-time.Hour)) {
		return "join_closed"
	}

	return ""
}
