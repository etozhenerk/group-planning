package meetings

import (
	"context"
	"slices"
	"strings"
)

// Reaction stores one participant's explicit reaction to a message.
type Reaction struct{ MeetingID, EntryID, UserID, Emoji string }

// ReactionGroup contains only users with current access to the conversation.
type ReactionGroup struct {
	Emoji   string
	UserIDs []string
	Mine    bool
}

// MessageReactions is a confirmed projection for one message.
type MessageReactions struct {
	EntryID   string
	Reactions []ReactionGroup
}

// SetReaction is a retry-safe setter; it never toggles an unknown remote state.
func (s *Service) SetReaction(ctx context.Context, actor Actor, meetingID, entryID, emoji string, active bool, key string) (MessageReactions, error) {
	if err := checkActor(actor); err != nil {
		return MessageReactions{}, err
	}

	if !validReactionEmoji(emoji) {
		return MessageReactions{}, ValidationError{map[string]string{"emoji": "invalid"}}
	}

	emoji = reactionEmoji[emoji]

	var result MessageReactions
	err := s.updateAs(ctx, actor, func(w Writer) error {
		if _, err := privateSnapshot(w, meetingID, actor.ID); err != nil {
			return err
		}

		if err := reactionMessages(w, meetingID, []string{entryID}); err != nil {
			return err
		}

		requestKey, err := keyFor(actor, "reaction:"+meetingID, key)
		if err != nil {
			return err
		}

		hash := requestHash(struct {
			EntryID, Emoji string
			Active         bool
		}{entryID, emoji, active})
		_, exists, err := s.receipt(w, requestKey, hash)
		if err != nil {
			return err
		}

		if !exists {
			if err := w.SaveReaction(Reaction{meetingID, entryID, actor.ID, emoji}, active); err != nil {
				return err
			}

			if err := s.remember(w, requestKey, hash, entryID); err != nil {
				return err
			}
		}

		groups, err := reactionViews(w, meetingID, []string{entryID}, actor.ID)
		if err != nil {
			return err
		}

		result = groups[0]

		return nil
	})

	return result, err
}

// Reactions fetches at most fifty messages in one authorized snapshot.
func (s *Service) Reactions(ctx context.Context, actor Actor, meetingID string, ids []string) ([]MessageReactions, error) {
	if err := checkActor(actor); err != nil {
		return nil, err
	}

	if len(ids) == 0 || len(ids) > 50 {
		return nil, ValidationError{map[string]string{"entry_id": "invalid"}}
	}

	seen := map[string]bool{}
	for _, id := range ids {
		if parsed, err := ParseUUID(id); err != nil || parsed != id || seen[id] {
			return nil, ValidationError{map[string]string{"entry_id": "invalid"}}
		}

		seen[id] = true
	}

	var result []MessageReactions
	err := s.store.View(ctx, func(r Reader) error {
		if _, err := privateSnapshot(r, meetingID, actor.ID); err != nil {
			return err
		}

		if err := reactionMessages(r, meetingID, ids); err != nil {
			return err
		}

		var err error
		result, err = reactionViews(r, meetingID, ids, actor.ID)

		return err
	})

	return result, err
}

func reactionMessages(r Reader, meetingID string, ids []string) error {
	entries, err := r.Feed(meetingID)
	if err != nil {
		return err
	}

	messages := map[string]bool{}
	for _, entry := range entries {
		if entry.Kind == "message" {
			messages[entry.ID] = true
		}
	}

	for _, id := range ids {
		if !messages[id] {
			return ErrNotFound
		}
	}

	return nil
}

func reactionViews(r Reader, meetingID string, ids []string, userID string) ([]MessageReactions, error) {
	meeting, err := r.Meeting(meetingID)
	if err != nil {
		return nil, err
	}

	responses, err := r.RSVPs(meetingID)
	if err != nil {
		return nil, err
	}

	eligible := map[string]bool{meeting.OrganizerID: true}
	for _, response := range responses {
		if response.Answer == Going {
			eligible[response.UserID] = true
		}
	}

	records, err := r.Reactions(meetingID)
	if err != nil {
		return nil, err
	}

	byEntry := map[string]map[string][]string{}
	for _, id := range ids {
		byEntry[id] = map[string][]string{}
	}

	for _, record := range records {
		groups, ok := byEntry[record.EntryID]
		if ok && eligible[record.UserID] {
			groups[record.Emoji] = append(groups[record.Emoji], record.UserID)
		}
	}

	result := make([]MessageReactions, 0, len(ids))
	for _, id := range ids {
		view := MessageReactions{EntryID: id, Reactions: []ReactionGroup{}}
		for emoji, users := range byEntry[id] {
			slices.Sort(users)
			view.Reactions = append(view.Reactions, ReactionGroup{Emoji: emoji, UserIDs: users, Mine: slices.Contains(users, userID)})
		}

		slices.SortFunc(view.Reactions, func(a, b ReactionGroup) int { return strings.Compare(a.Emoji, b.Emoji) })
		result = append(result, view)
	}

	return result, nil
}
