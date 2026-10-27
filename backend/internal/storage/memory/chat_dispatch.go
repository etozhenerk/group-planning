package memory

import (
	"math"
	"slices"
	"strings"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) LeaseChatHints(now, until time.Time, lease string, limit int) ([]meetings.ChatHint, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return nil, err
	}

	if lease == "" || !until.After(now) || limit < 1 || limit > 100 {
		return nil, meetings.ErrInvalidRecord
	}

	batch := []meetings.ChatHint{}
	for _, h := range tx.data.hints {
		if h.DispatchedAt == nil && !h.AvailableAt.After(now) && (h.LeaseUntil == nil || !h.LeaseUntil.After(now)) {
			batch = append(batch, h)
		}
	}

	slices.SortFunc(batch, func(a, b meetings.ChatHint) int {
		if d := a.AvailableAt.Compare(b.AvailableAt); d != 0 {
			return d
		}

		if d := a.CreatedAt.Compare(b.CreatedAt); d != 0 {
			return d
		}

		return strings.Compare(a.ID, b.ID)
	})
	if len(batch) > limit {
		batch = batch[:limit]
	}

	for i := range batch {
		batch[i].AvailableAt = until
		batch[i].LeaseID = lease
		batch[i].LeaseUntil = &until
		if batch[i].Attempts < math.MaxInt32 {
			batch[i].Attempts++
		}

		tx.data.hints[batch[i].ID] = cloneChatHint(batch[i])
		batch[i] = cloneChatHint(batch[i])
	}

	return batch, nil
}

func (tx *transaction) FinishChatHint(id, lease string, now, retry time.Time) (bool, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return false, err
	}

	if lease == "" || (!retry.IsZero() && !retry.After(now)) {
		return false, meetings.ErrInvalidRecord
	}

	h, ok := tx.data.hints[id]
	if !ok || h.DispatchedAt != nil || h.LeaseID != lease || h.LeaseUntil == nil || !h.LeaseUntil.After(now) {
		return false, nil
	}

	h.LeaseID, h.LeaseUntil = "", nil
	if retry.IsZero() {
		h.DispatchedAt = &now
	} else {
		h.AvailableAt = retry
	}

	tx.data.hints[id] = cloneChatHint(h)

	return true, nil
}

func (tx *transaction) DeleteDispatchedChatHints(limit int) (int, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return 0, err
	}

	if limit < 1 || limit > 100 {
		return 0, meetings.ErrInvalidRecord
	}

	n := 0
	for id, h := range tx.data.hints {
		if h.DispatchedAt != nil {
			delete(tx.data.hints, id)
			n++
			if n == limit {
				break
			}
		}
	}

	return n, nil
}
