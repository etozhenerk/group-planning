package memory

import (
	"slices"
	"sort"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) ChatReadMarker(id, userID string) (meetings.ReadMarker, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.ReadMarker{}, err
	}

	m, ok := tx.data.readMarkers[responseKey{id, userID}]
	if !ok {
		return m, meetings.ErrNotFound
	}

	return m, nil
}

func (tx *transaction) ensureReadMarker(id, userID string, now time.Time) (meetings.ReadMarker, error) {
	if userID == "" || now.IsZero() || tx.data.removedUsers[userID] {
		return meetings.ReadMarker{}, meetings.ErrInvalidRecord
	}

	if _, ok := tx.data.meetings[id]; !ok {
		return meetings.ReadMarker{}, meetings.ErrNotFound
	}

	key := responseKey{id, userID}
	if marker, ok := tx.data.readMarkers[key]; ok {
		return marker, nil
	}

	marker := meetings.ReadMarker{MeetingID: id, UserID: userID, UpdatedAt: now}
	entries := tx.data.feed[id]
	if len(entries) > 0 {
		marker.Baseline = entries[len(entries)-1].Sequence
	}

	tx.data.readMarkers[key] = marker

	return marker, nil
}

func (tx *transaction) EnsureChatReadMarker(id, userID string, now time.Time) (meetings.ReadMarker, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return meetings.ReadMarker{}, err
	}

	return tx.ensureReadMarker(id, userID, now)
}

func (tx *transaction) InitializeChatReadMarkers(now time.Time) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	if now.IsZero() {
		return meetings.ErrInvalidRecord
	}

	for _, m := range tx.data.meetings {
		if err := tx.ctx.Err(); err != nil {
			return err
		}

		if m.OrganizerID != "" && !tx.data.removedUsers[m.OrganizerID] {
			if _, err := tx.ensureReadMarker(m.ID, m.OrganizerID, now); err != nil {
				return err
			}
		}
	}

	for _, r := range tx.data.responses {
		if r.Answer == meetings.Going && !tx.data.removedUsers[r.UserID] {
			if _, err := tx.ensureReadMarker(r.MeetingID, r.UserID, now); err != nil {
				return err
			}
		}
	}

	return nil
}

func (tx *transaction) AdvanceChatReadMarker(id, userID string, sequence uint64, now time.Time) (meetings.ReadMarker, bool, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return meetings.ReadMarker{}, false, err
	}

	if sequence == 0 || now.IsZero() {
		return meetings.ReadMarker{}, false, meetings.ErrInvalidRecord
	}

	key := responseKey{id, userID}
	marker, ok := tx.data.readMarkers[key]
	if !ok {
		return marker, false, meetings.ErrNotFound
	}

	if sequence <= marker.ReadThrough {
		return marker, false, nil
	}

	marker.ReadThrough, marker.UpdatedAt = sequence, now
	tx.data.readMarkers[key] = marker

	return marker, true, nil
}

func (tx *transaction) ChatReadState(id, userID string) (meetings.ReadState, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.ReadState{}, err
	}

	marker, ok := tx.data.readMarkers[responseKey{id, userID}]
	if !ok {
		return meetings.ReadState{}, meetings.ErrNotFound
	}

	state := meetings.ReadState{ReadMarker: marker}
	after := max(marker.Baseline, marker.ReadThrough)
	entries := tx.data.feed[id]
	start := sort.Search(len(entries), func(i int) bool { return entries[i].Sequence > after })
	for _, e := range entries[start:] {
		if err := tx.ctx.Err(); err != nil {
			return state, err
		}

		if e.Kind == "message" && e.ActorID != userID {
			state.UnreadCount++
			if state.FirstUnread == "" {
				state.FirstUnread = e.ID
			}
		}
	}

	return state, nil
}

func (tx *transaction) currentReader(id, userID, author string) bool {
	return userID != author && !tx.data.removedUsers[userID] && (tx.data.meetings[id].OrganizerID == userID || tx.data.responses[responseKey{id, userID}].Answer == meetings.Going)
}

func (tx *transaction) ChatReceiptCounts(id, author string, entryIDs []string) ([]meetings.ReadReceipt, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	if len(entryIDs) < 1 || len(entryIDs) > 100 {
		return nil, meetings.ErrInvalidRecord
	}

	positions := []uint64{}
	for k, m := range tx.data.readMarkers {
		if err := tx.ctx.Err(); err != nil {
			return nil, err
		}

		if k.meetingID == id && tx.currentReader(id, k.userID, author) {
			positions = append(positions, m.ReadThrough)
		}
	}

	slices.Sort(positions)
	result := make([]meetings.ReadReceipt, 0, len(entryIDs))
	for _, entryID := range entryIDs {
		if err := tx.ctx.Err(); err != nil {
			return nil, err
		}

		loc, ok := tx.data.entryIDs[entryID]
		if !ok || loc.meetingID != id {
			return nil, meetings.ErrNotFound
		}

		e := tx.data.feed[id][loc.offset]
		if e.Kind != "message" || e.ActorID != author {
			return nil, meetings.ErrInvalidRecord
		}

		start := sort.Search(len(positions), func(i int) bool { return positions[i] >= e.Sequence })
		result = append(result, meetings.ReadReceipt{EntryID: entryID, ReaderCount: uint64(len(positions) - start)})
	}

	return result, nil
}

func (tx *transaction) ChatReaderIDs(id, author string, sequence uint64, after string, limit int) ([]string, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	if limit < 1 || limit > 100 {
		return nil, meetings.ErrInvalidRecord
	}

	ids := []string{}
	for k, m := range tx.data.readMarkers {
		if err := tx.ctx.Err(); err != nil {
			return nil, err
		}

		if k.meetingID == id && k.userID > after && m.ReadThrough >= sequence && tx.currentReader(id, k.userID, author) {
			ids = append(ids, k.userID)
		}
	}

	slices.Sort(ids)
	if len(ids) > limit+1 {
		ids = ids[:limit+1]
	}

	return ids, nil
}
