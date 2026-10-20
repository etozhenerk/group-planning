package meetings

import (
	"context"
	"errors"
)

// Respond resolves either a secret invitation or an existing own response. Both
// routes share one idempotency scope and serialize permission/state changes.
func (s *Service) Respond(ctx context.Context, actor Actor, id, token string, answer Answer, expected uint64, key string) (ResponseState, error) {
	if err := checkActor(actor); err != nil {
		return ResponseState{}, err
	}

	if answer != Going && answer != Maybe && answer != NotGoing {
		return ResponseState{}, ValidationError{map[string]string{"answer": "invalid"}}
	}

	var result ResponseState
	err := s.update(ctx, func(writer Writer) error {
		if token != "" {
			if !validInvitationToken(token) {
				return ErrNotFound
			}

			invitation, err := writer.InvitationByToken(token)
			if err != nil {
				return err
			}

			id = invitation.MeetingID
		}

		meeting, err := writer.Meeting(id)
		if err != nil {
			return err
		}

		if meeting.OrganizerID == actor.ID {
			return ErrForbidden
		}

		details, err := snapshot(writer, meeting, actor.ID)
		if err != nil {
			return err
		}

		if token == "" && details.MyResponse.Revision == 0 {
			return ErrForbidden
		}

		requestKey, err := keyFor(actor, "rsvp:"+id, key)
		if err != nil {
			return err
		}

		hash := requestHash(struct {
			Answer   Answer
			Expected uint64
		}{answer, expected})
		_, exists, err := s.receipt(writer, requestKey, hash)
		if err != nil {
			return err
		}

		if exists {
			result = responseState(details, actor.ID)
			return nil
		}

		if details.MyResponse.Revision != expected {
			current := responseState(details, actor.ID)
			current.CanAccessFeed = false

			return &Conflict{Code: "rsvp_revision_conflict", Response: &current}
		}

		if details.MyResponse.Answer != answer {
			revision, err := increment(details.MyResponse.Revision)
			if err != nil {
				return err
			}

			meeting.Revision, err = increment(meeting.Revision)
			if err != nil {
				return err
			}

			previous := details.MyResponse.Answer
			response := RSVP{MeetingID: id, UserID: actor.ID, Answer: answer, Revision: revision, UpdatedAt: s.now().UTC()}
			if err := writer.SaveRSVP(response); err != nil {
				return err
			}

			if err := writer.SaveMeeting(meeting); err != nil {
				return err
			}

			kind := "rsvp_changed"
			if answer == Going {
				kind = "participant_joined"
			} else if previous == Going {
				kind = "participant_left"
			}

			var old *Answer
			if previous != "" {
				old = &previous
			}

			if _, err := s.entry(writer, id, kind, actor, struct {
				Previous *Answer `json:"previous_answer"`
				Answer   Answer  `json:"answer"`
			}{old, answer}, ""); err != nil {
				return err
			}

			details, err = snapshot(writer, meeting, actor.ID)
			if err != nil {
				return err
			}
		}

		if err := s.remember(writer, requestKey, hash, id); err != nil {
			return err
		}

		result = responseState(details, actor.ID)

		return nil
	})

	return result, err
}

// PreviewForUser returns only public fields and, if authenticated, the caller's
// own saved response. It does not change membership or expose other profiles.
func (s *Service) PreviewForUser(ctx context.Context, token, userID string) (PublicInvitation, RSVP, error) {
	if !validInvitationToken(token) {
		return PublicInvitation{}, RSVP{}, ErrNotFound
	}

	var result PublicInvitation
	var response RSVP
	err := s.store.View(ctx, func(reader Reader) error {
		invitation, err := reader.InvitationByToken(token)
		if err != nil {
			return err
		}

		meeting, err := reader.Meeting(invitation.MeetingID)
		if err != nil {
			return err
		}

		result = PublicInvitation{
			MeetingID: meeting.ID,
			Title:     meeting.Title,
			StartsAt:  meeting.StartsAt,
			Timezone:  meeting.Timezone,
			Place:     meeting.Place,
		}
		if userID != "" {
			response, err = reader.RSVP(meeting.ID, userID)
			if errors.Is(err, ErrNotFound) {
				return nil
			}

			return err
		}

		return nil
	})

	return result, response, err
}
