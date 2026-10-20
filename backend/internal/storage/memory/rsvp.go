package memory

import (
	"slices"
	"strings"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) RSVP(meetingID, userID string) (meetings.RSVP, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.RSVP{}, err
	}

	response, ok := tx.data.responses[responseKey{meetingID, userID}]
	if !ok {
		return meetings.RSVP{}, meetings.ErrNotFound
	}

	return response, nil
}

func (tx *transaction) RSVPs(meetingID string) ([]meetings.RSVP, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	if _, ok := tx.data.meetings[meetingID]; !ok {
		return nil, meetings.ErrNotFound
	}

	result := make([]meetings.RSVP, 0)
	for key, response := range tx.data.responses {
		if key.meetingID == meetingID {
			result = append(result, response)
		}
	}

	slices.SortFunc(result, func(a, b meetings.RSVP) int { return strings.Compare(a.UserID, b.UserID) })

	return result, nil
}

func (tx *transaction) SaveRSVP(response meetings.RSVP) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	if response.UserID == "" || (response.Answer != meetings.Going && response.Answer != meetings.Maybe && response.Answer != meetings.NotGoing) {
		return meetings.ErrInvalidRecord
	}

	if _, ok := tx.data.meetings[response.MeetingID]; !ok {
		return meetings.ErrNotFound
	}

	tx.data.responses[responseKey{response.MeetingID, response.UserID}] = response

	return nil
}
