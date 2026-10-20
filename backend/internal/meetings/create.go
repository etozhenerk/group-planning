package meetings

import (
	"context"
	"strings"
)

// CreateInput requires an explicit instant and IANA zone for the first slice.
type CreateInput struct{ Title, Description, StartsAt, Timezone, Place string }

// Create commits the meeting, invitation, event and request receipt together.
func (s *Service) Create(ctx context.Context, actor Actor, input CreateInput, key string) (Created, error) {
	if err := checkActor(actor); err != nil {
		return Created{}, err
	}

	requestKey, err := keyFor(actor, "create", key)
	if err != nil {
		return Created{}, err
	}

	input.Title = strings.TrimSpace(input.Title)
	input.Place = strings.TrimSpace(input.Place)
	for _, field := range []struct {
		name, value string
		max         int
		required    bool
	}{{"title", input.Title, 120, true}, {"description", input.Description, 4000, false}, {"place", input.Place, 500, false}} {
		if err := validateText(field.name, field.value, field.max, field.required); err != nil {
			return Created{}, err
		}
	}

	zone, err := loadZone(input.Timezone)
	if err != nil {
		return Created{}, err
	}

	instant, err := parseInstant(input.StartsAt)
	if err != nil {
		return Created{}, err
	}

	if err := validateOffset(instant, zone); err != nil {
		return Created{}, err
	}

	instant = instant.UTC()
	input.StartsAt = instant.Format("2006-01-02T15:04:05.999999999Z07:00")
	hash := requestHash(input)
	var result Created
	err = s.update(ctx, func(writer Writer) error {
		receipt, exists, err := s.receipt(writer, requestKey, hash)
		if err != nil {
			return err
		}

		all, err := writer.Meetings()
		if err != nil {
			return err
		}

		id := ""
		if exists {
			id = receipt.ResourceID
		} else {
			for _, meeting := range all {
				if meeting.OrganizerID == actor.ID && meeting.CreationRequestID == requestKey.Key {
					if meeting.CreationRequestHash != hash {
						return ErrIdempotencyConflict
					}

					id = meeting.ID
					break
				}
			}
		}

		if id == "" {
			meeting := Meeting{
				ID:                  randomUUID(),
				OrganizerID:         actor.ID,
				Title:               input.Title,
				Description:         input.Description,
				StartsAt:            &instant,
				Timezone:            input.Timezone,
				Place:               input.Place,
				Revision:            1,
				CreatedAt:           s.now().UTC(),
				CreationRequestID:   requestKey.Key,
				CreationRequestHash: hash,
			}
			invitation := Invitation{
				ID:        randomUUID(),
				MeetingID: meeting.ID,
				Token:     randomToken(),
				CreatedAt: meeting.CreatedAt,
			}
			if err := writer.SaveMeeting(meeting); err != nil {
				return err
			}

			if err := writer.InsertInvitation(invitation); err != nil {
				return err
			}

			if _, err := s.entry(writer, meeting.ID, "meeting_created", actor, meetingEvent(meeting), ""); err != nil {
				return err
			}

			if err := s.remember(writer, requestKey, hash, meeting.ID); err != nil {
				return err
			}

			id = meeting.ID
		}

		details, err := privateSnapshot(writer, id, actor.ID)
		if err != nil {
			return err
		}

		if details.Meeting.OrganizerID != actor.ID {
			return ErrForbidden
		}

		invitation, err := writer.InvitationForMeeting(id)
		if err != nil {
			return err
		}

		result = Created{details, invitation.Token}

		return nil
	})

	return result, err
}

func meetingEvent(meeting Meeting) any {
	return struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		StartsAt    any    `json:"starts_at"`
		Timezone    string `json:"timezone"`
		Place       string `json:"place"`
	}{meeting.Title, meeting.Description, meeting.StartsAt, meeting.Timezone, meeting.Place}
}
