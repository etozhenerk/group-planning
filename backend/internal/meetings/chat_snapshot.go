package meetings

import "errors"

// chatSnapshot reads access and lightweight metadata without enumerating album
// contents. Payload/history lookups must follow this check in the same View.
func chatSnapshot(r Reader, id, userID string) (Details, error) {
	m, err := r.Meeting(id)
	if err != nil {
		return Details{}, err
	}

	response, err := r.RSVP(id, userID)
	if err != nil && !errors.Is(err, ErrNotFound) {
		return Details{}, err
	}

	details := Details{Meeting: m, MyResponse: response, ParticipantCount: 1}
	if !allowed(details, userID) {
		return Details{}, ErrForbidden
	}

	responses, err := r.RSVPs(id)
	if err != nil {
		return Details{}, err
	}

	for _, item := range responses {
		if item.UserID != m.OrganizerID && item.Answer == Going {
			details.ParticipantCount++
		}
	}

	return details, nil
}
