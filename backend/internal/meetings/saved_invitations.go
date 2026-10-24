package meetings

import (
	"context"
	"errors"
	"slices"
	"strings"
)

// SavedInvitation exposes the caller's current maybe response and public preview.
type SavedInvitation struct {
	Preview  PublicInvitation
	Response RSVP
	Token    string
}

// InvitationPage is an independent page, without permission to read private data.
type InvitationPage struct {
	Invitations []SavedInvitation
	NextCursor  string
}

// SavedInvitations lists only the caller's current maybe responses in stable ID order.
func (s *Service) SavedInvitations(ctx context.Context, actor Actor, limit int, cursor string) (InvitationPage, error) {
	if err := checkActor(actor); err != nil {
		return InvitationPage{}, err
	}

	if limit < 1 || limit > 100 {
		return InvitationPage{}, ValidationError{map[string]string{"limit": "invalid"}}
	}

	if cursor != "" {
		if id, err := ParseUUID(cursor); err != nil || id != cursor {
			return InvitationPage{}, ValidationError{map[string]string{"cursor": "invalid"}}
		}
	}

	result := InvitationPage{Invitations: []SavedInvitation{}}
	err := s.store.View(ctx, func(reader Reader) error {
		all, err := reader.Meetings()
		if err != nil {
			return err
		}

		slices.SortFunc(all, func(a, b Meeting) int { return strings.Compare(a.ID, b.ID) })
		for _, meeting := range all {
			if meeting.ID <= cursor || meeting.OrganizerID == actor.ID {
				continue
			}

			response, err := reader.RSVP(meeting.ID, actor.ID)
			if errors.Is(err, ErrNotFound) {
				continue
			}

			if err != nil {
				return err
			}

			if response.Answer != Maybe {
				continue
			}

			if len(result.Invitations) == limit {
				result.NextCursor = result.Invitations[limit-1].Preview.MeetingID
				break
			}

			invitation, err := reader.InvitationForMeeting(meeting.ID)
			if err != nil {
				return err
			}

			result.Invitations = append(result.Invitations, SavedInvitation{
				Preview: publicInvitation(meeting), Response: response, Token: invitation.Token,
			})
		}

		return nil
	})

	return result, err
}
