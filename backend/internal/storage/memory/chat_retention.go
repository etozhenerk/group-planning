package memory

import (
	"slices"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) ChatMaintenanceIDs(cutoff time.Time, maximum uint64, limit int) ([]string, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	if maximum == 0 || limit < 1 || limit > 100 {
		return nil, meetings.ErrInvalidRecord
	}

	result := []string{}
	for id, stream := range tx.data.streams {
		needed := stream.LatestSequence-stream.RetainedAfter > maximum
		for _, c := range tx.data.changes[id] {
			if c.Sequence <= stream.RetainedAfter || c.CreatedAt.Before(cutoff) {
				needed = true
				break
			}
		}

		if needed {
			result = append(result, id)
		}
	}

	slices.Sort(result)
	if len(result) > limit {
		result = result[:limit]
	}

	return result, nil
}

func (tx *transaction) TrimChatStream(id string, cutoff time.Time, maximum uint64) (meetings.ChatStream, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return meetings.ChatStream{}, err
	}

	if maximum == 0 {
		return meetings.ChatStream{}, meetings.ErrInvalidRecord
	}

	stream, ok := tx.data.streams[id]
	if !ok {
		return stream, meetings.ErrNotFound
	}

	boundary := stream.RetainedAfter
	if stream.LatestSequence > maximum {
		boundary = max(boundary, stream.LatestSequence-maximum)
	}

	for _, c := range tx.data.changes[id] {
		if !cutoff.IsZero() && c.CreatedAt.Before(cutoff) {
			boundary = max(boundary, c.Sequence)
		}
	}

	stream.RetainedAfter = boundary
	tx.data.streams[id] = stream
	entries := tx.data.changes[id]
	remove := 0
	for remove < len(entries) && remove < 1000 && entries[remove].Sequence <= boundary {
		remove++
	}

	tx.data.changes[id] = append([]meetings.ChatChange{}, entries[remove:]...)

	return stream, nil
}

func (tx *transaction) ExpiredChatHints(cutoff time.Time, limit int) ([]meetings.ChatHint, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	if limit < 1 || limit > 100 {
		return nil, meetings.ErrInvalidRecord
	}

	result := []meetings.ChatHint{}
	for _, h := range tx.data.hints {
		if h.LeaseUntil != nil && h.LeaseUntil.After(cutoff.Add(7*24*time.Hour)) {
			continue
		}

		stream, exists := tx.data.streams[h.MeetingID]
		stale := h.CreatedAt.Before(cutoff)
		if h.DispatchedAt == nil && exists {
			stale = stale || h.Epoch != stream.Epoch || h.LatestSequence < stream.RetainedAfter
		}

		if !exists && !h.Terminal {
			stale = true
		}

		if stale {
			result = append(result, cloneChatHint(h))
		}
	}

	slices.SortFunc(result, func(a, b meetings.ChatHint) int { return a.CreatedAt.Compare(b.CreatedAt) })
	if len(result) > limit {
		result = result[:limit]
	}

	return result, nil
}

func (tx *transaction) DeleteChatHints(ids []string) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	if len(ids) > 100 {
		return meetings.ErrInvalidRecord
	}

	for _, id := range ids {
		delete(tx.data.hints, id)
	}

	return nil
}
