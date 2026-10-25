package memory

import (
	"strings"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) UserRemoved(id string) (bool, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return false, err
	}

	return tx.data.removedUsers[id], nil
}

func (tx *transaction) RemoveUser(id string) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	if id == "" {
		return meetings.ErrInvalidRecord
	}

	tx.data.removedUsers[id] = true
	for key, value := range tx.data.reactions {
		if value.UserID == id {
			delete(tx.data.reactions, key)
		}
	}

	for key := range tx.data.receipts {
		if key.UserID == id {
			delete(tx.data.receipts, key)
		}
	}

	return nil
}

func (tx *transaction) DeleteRSVP(meetingID, userID string) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	delete(tx.data.responses, responseKey{meetingID, userID})

	return nil
}

func (tx *transaction) AnonymizeFeed(meetingID, userID, name string) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	for i, entry := range tx.data.feed[meetingID] {
		if entry.ActorID == userID {
			tx.data.feed[meetingID][i].ActorName = name
		}
	}

	return nil
}

func (tx *transaction) DeleteMeeting(id string) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	resources := map[string]bool{id: true}
	for key, value := range tx.data.media {
		if value.MeetingID == id {
			resources[key] = true
			delete(tx.data.media, key)
		}
	}

	for key, value := range tx.data.reactions {
		if value.MeetingID == id {
			delete(tx.data.reactions, key)
		}
	}

	for key, task := range tx.data.preparationTasks {
		if task.MeetingID == id {
			resources[key] = true
			delete(tx.data.preparationTasks, key)
		}
	}

	for key, poll := range tx.data.polls {
		if poll.MeetingID == id {
			resources[key] = true
			delete(tx.data.polls, key)
		}
	}

	for key, poll := range tx.data.placePolls {
		if poll.MeetingID == id {
			resources[key] = true
			delete(tx.data.placePolls, key)
		}
	}

	for key, invite := range tx.data.invitations {
		if invite.MeetingID == id {
			delete(tx.data.inviteIDs, invite.ID)
			delete(tx.data.invitations, key)
		}
	}

	for key := range tx.data.responses {
		if key.meetingID == id {
			delete(tx.data.responses, key)
		}
	}

	for key, job := range tx.data.jobs {
		if job.MeetingID == id {
			delete(tx.data.jobs, key)
		}
	}

	for _, entry := range tx.data.feed[id] {
		resources[entry.ID] = true
		delete(tx.data.entryIDs, entry.ID)
		delete(tx.data.messageIDs, messageKey{id, entry.ActorID, entry.ClientRequestID})
	}

	for key, receipt := range tx.data.receipts {
		if resources[receipt.ResourceID] || strings.HasSuffix(key.Operation, ":"+id) {
			delete(tx.data.receipts, key)
		}
	}

	delete(tx.data.feed, id)
	delete(tx.data.covers, id)
	delete(tx.data.meetings, id)

	return nil
}
