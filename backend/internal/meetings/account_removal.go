package meetings

import (
	"context"
	"slices"
	"strings"
)

// RemovedAccountName replaces profile names in retained shared history.
const RemovedAccountName = "Удалённый аккаунт"

// RemoveAccount processes all shared data inside the caller's atomic unit of work.
// The opaque ID remains only in history and a fence rejecting stale authenticated writes.
func (s *Service) RemoveAccount(ctx context.Context, userID string) error {
	if userID == "" {
		return ErrUnauthenticated
	}

	return s.update(ctx, func(writer Writer) error {
		removed, err := writer.UserRemoved(userID)
		if err != nil || removed {
			return err
		}

		if err := writer.RemoveUser(userID); err != nil {
			return err
		}

		all, err := writer.Meetings()
		if err != nil {
			return err
		}

		for _, meeting := range all {
			if err := s.removeMeetingAccount(writer, meeting, userID); err != nil {
				return err
			}
		}

		return nil
	})
}

func (s *Service) removeMeetingAccount(writer Writer, meeting Meeting, userID string) error {
	responses, err := writer.RSVPs(meeting.ID)
	if err != nil {
		return err
	}

	entries, err := writer.Feed(meeting.ID)
	if err != nil {
		return err
	}

	changed := false
	if meeting.OrganizerID == userID {
		next := successor(responses, entries, userID)
		if next == "" {
			return writer.DeleteMeeting(meeting.ID)
		}

		meeting.OrganizerID, changed = next, true
		meeting.CreationRequestID, meeting.CreationRequestHash = "", ""
	}

	for _, response := range responses {
		if response.UserID == userID {
			changed = true
		}
	}

	if err := writer.DeleteRSVP(meeting.ID, userID); err != nil {
		return err
	}

	if changed {
		meeting.Revision, err = increment(meeting.Revision)
		if err != nil {
			return err
		}

		if err := writer.SaveMeeting(meeting); err != nil {
			return err
		}
	}

	if err := writer.AnonymizeFeed(meeting.ID, userID, RemovedAccountName); err != nil {
		return err
	}

	if err := s.removeAccountTasks(writer, meeting, userID); err != nil {
		return err
	}

	if err := s.removeAccountPolls(writer, meeting, userID); err != nil {
		return err
	}

	if changed {
		return s.updateDatePollMembership(writer, meeting)
	}

	return nil
}

func successor(responses []RSVP, entries []FeedEntry, removed string) string {
	first := map[string]uint64{}
	for _, entry := range entries {
		if entry.Kind == "participant_joined" && first[entry.ActorID] == 0 {
			first[entry.ActorID] = entry.Sequence
		}
	}

	candidates := []RSVP{}
	for _, response := range responses {
		if response.UserID != removed && response.Answer == Going {
			candidates = append(candidates, response)
		}
	}

	slices.SortFunc(candidates, func(a, b RSVP) int {
		aOrder, bOrder := first[a.UserID], first[b.UserID]
		if aOrder != 0 && bOrder != 0 && aOrder != bOrder {
			if aOrder < bOrder {
				return -1
			}

			return 1
		}

		if aOrder != 0 && bOrder == 0 {
			return -1
		}

		if aOrder == 0 && bOrder != 0 {
			return 1
		}

		if value := a.UpdatedAt.Compare(b.UpdatedAt); value != 0 {
			return value
		}

		return strings.Compare(a.UserID, b.UserID)
	})
	if len(candidates) == 0 {
		return ""
	}

	return candidates[0].UserID
}

func removedActor(actor Actor, userID string) Actor {
	if actor.ID == userID {
		actor.Name = RemovedAccountName
	}

	return actor
}
