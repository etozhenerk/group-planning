package meetings

import "context"

// Details returns private state only to the organizer or a current going guest.
func (s *Service) Details(ctx context.Context, actor Actor, id string) (Details, error) {
	if err := checkActor(actor); err != nil {
		return Details{}, err
	}
	var result Details
	err := s.store.View(ctx, func(reader Reader) error {
		var err error
		result, err = privateSnapshot(reader, id, actor.ID)
		return err
	})
	return result, err
}

// Invitation returns the same link to its organizer, without rotating the token.
func (s *Service) Invitation(ctx context.Context, actor Actor, id string) (string, error) {
	if err := checkActor(actor); err != nil {
		return "", err
	}
	var token string
	err := s.store.View(ctx, func(reader Reader) error {
		meeting, err := reader.Meeting(id)
		if err != nil {
			return err
		}
		if meeting.OrganizerID != actor.ID {
			return ErrForbidden
		}
		invitation, err := reader.InvitationForMeeting(id)
		token = invitation.Token
		return err
	})
	return token, err
}

// Participants returns the organizer and actual respondents, not invented guests.
func (s *Service) Participants(ctx context.Context, actor Actor, id string) ([]Participant, error) {
	if err := checkActor(actor); err != nil {
		return nil, err
	}
	var result []Participant
	err := s.store.View(ctx, func(reader Reader) error {
		details, err := privateSnapshot(reader, id, actor.ID)
		if err != nil {
			return err
		}
		result = []Participant{{UserID: details.Meeting.OrganizerID, Role: "organizer"}}
		responses, err := reader.RSVPs(id)
		if err != nil {
			return err
		}
		for _, response := range responses {
			if response.UserID != details.Meeting.OrganizerID {
				result = append(result, Participant{UserID: response.UserID, Role: "guest", Answer: response.Answer, Revision: response.Revision})
			}
		}
		return nil
	})
	return result, err
}
