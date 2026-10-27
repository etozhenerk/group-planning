package memory

import (
	"math"
	"slices"
	"sort"
	"strings"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) ChatStream(id string) (meetings.ChatStream, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.ChatStream{}, err
	}

	value, ok := tx.data.streams[id]
	if !ok {
		return meetings.ChatStream{}, meetings.ErrNotFound
	}

	return value, nil
}

func (tx *transaction) AppendChatChanges(id, epoch string, changes []meetings.ChatChange) (meetings.ChatStream, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return meetings.ChatStream{}, err
	}

	if _, ok := tx.data.meetings[id]; !ok {
		return meetings.ChatStream{}, meetings.ErrNotFound
	}

	stream, ok := tx.data.streams[id]
	if !ok {
		stream = meetings.ChatStream{MeetingID: id, Epoch: epoch}
	}

	if epoch == "" || stream.Epoch == "" || len(changes) == 0 || uint64(len(changes)) > math.MaxUint64-stream.LatestSequence {
		return meetings.ChatStream{}, meetings.ErrInvalidRecord
	}

	for _, change := range changes {
		if change.MeetingID != id || change.Sequence != 0 || !change.Valid() {
			return meetings.ChatStream{}, meetings.ErrInvalidRecord
		}
	}

	for _, change := range changes {
		stream.LatestSequence++
		change.Sequence = stream.LatestSequence
		tx.data.changes[id] = append(tx.data.changes[id], change)
	}

	tx.data.streams[id] = stream

	return stream, nil
}

func (tx *transaction) ChatChanges(id string, after, through uint64, limit int) (meetings.ChatChangesPage, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.ChatChangesPage{}, err
	}

	stream, ok := tx.data.streams[id]
	if !ok {
		return meetings.ChatChangesPage{}, meetings.ErrNotFound
	}

	if limit < 1 || limit > 100 || after > through || through > stream.LatestSequence || after < stream.RetainedAfter {
		return meetings.ChatChangesPage{}, meetings.ErrChangeCursorInvalid
	}

	entries := tx.data.changes[id]
	start := sort.Search(len(entries), func(i int) bool { return entries[i].Sequence > after })
	end := sort.Search(len(entries), func(i int) bool { return entries[i].Sequence > through })
	more := end-start > limit
	if more {
		end = start + limit
	}

	result := append([]meetings.ChatChange{}, entries[start:end]...)

	return meetings.ChatChangesPage{Changes: result, HasMore: more}, nil
}

func (tx *transaction) EnqueueChatHint(hint meetings.ChatHint) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	if !hint.Valid() {
		return meetings.ErrInvalidRecord
	}

	if _, exists := tx.data.hints[hint.ID]; exists {
		return meetings.ErrAlreadyExists
	}

	if hint.Target == "meeting" {
		if _, ok := tx.data.meetings[hint.MeetingID]; !ok {
			return meetings.ErrNotFound
		}
	}

	if hint.Target == "user" && tx.data.removedUsers[hint.TargetID] {
		return meetings.ErrNotFound
	}

	tx.data.hints[hint.ID] = cloneChatHint(hint)

	return nil
}

func (tx *transaction) PendingChatHints(now time.Time, limit int) ([]meetings.ChatHint, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	if limit < 1 || limit > 100 {
		return nil, meetings.ErrInvalidRecord
	}

	result := []meetings.ChatHint{}
	for _, hint := range tx.data.hints {
		if hint.DispatchedAt == nil && !hint.AvailableAt.After(now) && (hint.LeaseUntil == nil || !hint.LeaseUntil.After(now)) {
			result = append(result, cloneChatHint(hint))
		}
	}

	slices.SortFunc(result, func(a, b meetings.ChatHint) int {
		if order := a.AvailableAt.Compare(b.AvailableAt); order != 0 {
			return order
		}

		if order := a.CreatedAt.Compare(b.CreatedAt); order != 0 {
			return order
		}

		return strings.Compare(a.ID, b.ID)
	})
	if len(result) > limit {
		result = result[:limit]
	}

	return result, nil
}

func cloneChatHint(hint meetings.ChatHint) meetings.ChatHint {
	if hint.LeaseUntil != nil {
		stamp := *hint.LeaseUntil
		hint.LeaseUntil = &stamp
	}

	if hint.DispatchedAt != nil {
		stamp := *hint.DispatchedAt
		hint.DispatchedAt = &stamp
	}

	return hint
}

func (tx *transaction) ReactionActive(value meetings.Reaction) (bool, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return false, err
	}

	_, ok := tx.data.reactions[value]

	return ok, nil
}

func (tx *transaction) FeedNeedsAnonymization(id, userID, name string) (bool, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return false, err
	}

	for _, entry := range tx.data.feed[id] {
		if entry.ActorID == userID && entry.ActorName != name {
			return true, nil
		}
	}

	return false, nil
}

func (tx *transaction) ReactionsForEntries(id string, ids []string) ([]meetings.Reaction, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	if len(ids) > 100 {
		return nil, meetings.ErrInvalidRecord
	}

	wanted := map[string]bool{}
	for _, id := range ids {
		wanted[id] = true
	}

	result := []meetings.Reaction{}
	for _, reaction := range tx.data.reactions {
		if reaction.MeetingID == id && wanted[reaction.EntryID] {
			result = append(result, reaction)
		}
	}

	return result, nil
}

func (tx *transaction) EnsureChatStream(id, epoch string) (meetings.ChatStream, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return meetings.ChatStream{}, err
	}

	if epoch == "" {
		return meetings.ChatStream{}, meetings.ErrInvalidRecord
	}

	if _, ok := tx.data.meetings[id]; !ok {
		return meetings.ChatStream{}, meetings.ErrNotFound
	}

	if stream, ok := tx.data.streams[id]; ok {
		return stream, nil
	}

	stream := meetings.ChatStream{MeetingID: id, Epoch: epoch}
	tx.data.streams[id] = stream

	return stream, nil
}
