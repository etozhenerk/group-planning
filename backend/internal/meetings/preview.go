package meetings

import (
	"context"
	"encoding/base64"
	"time"
)

// PublicInvitation contains only details a holder of the invitation may see.
// Profiles, responses and messages must never be added implicitly.
type PublicInvitation struct {
	MeetingID   string
	Title       string
	Description string
	StartsAt    *time.Time
	Timezone    string
	Place       string
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
		MeetingID:   meeting.ID,
		Title:       meeting.Title,
		Description: meeting.Description,
		StartsAt:    meeting.StartsAt,
		Timezone:    meeting.Timezone,
		Place:       meeting.Place,
	}
}
