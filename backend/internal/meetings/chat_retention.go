package meetings

import (
	"context"
	"errors"
	"time"
)

const (
	chatRetention      = 7 * 24 * time.Hour
	chatMaximumChanges = 100000
)

// MaintainChat trims bounded batches and replaces stale notification intents
// atomically. It performs no external publication; pending terminal hints survive.
func (s *Service) MaintainChat(ctx context.Context) error {
	_, err := s.MaintainChatBatches(ctx)
	return err
}

// MaintainChatBatches yields between at most twenty short transactions. More
// requests another drain soon, avoiding a fixed 100 rows/minute retention ceiling.
func (s *Service) MaintainChatBatches(ctx context.Context) (bool, error) {
	for range 20 {
		if err := ctx.Err(); err != nil {
			return true, err
		}

		more, err := s.maintainChatBatch(ctx)
		if err != nil || !more {
			return more, err
		}
	}

	return true, nil
}

func (s *Service) maintainChatBatch(ctx context.Context) (bool, error) {
	now := s.now().UTC()
	cutoff := now.Add(-chatRetention)

	more := false
	err := s.store.Update(ctx, func(w Writer) error {
		ids, err := w.ChatMaintenanceIDs(cutoff, chatMaximumChanges, 10)
		if err != nil {
			return err
		}

		for _, id := range ids {
			if _, err := w.TrimChatStream(id, cutoff, chatMaximumChanges); err != nil {
				return err
			}
		}

		hints, err := w.ExpiredChatHints(cutoff, 100)
		if err != nil {
			return err
		}

		more = len(ids) == 10 || len(hints) == 100
		old := []string{}
		groups := map[string]ChatHint{}
		for _, hint := range hints {
			old = append(old, hint.ID)
			if hint.DispatchedAt != nil {
				continue
			}

			if hint.Target == "user" {
				removed, err := w.UserRemoved(hint.TargetID)
				if err != nil {
					return err
				}

				if removed {
					continue
				}
			}

			stream, err := w.ChatStream(hint.MeetingID)
			if errors.Is(err, ErrNotFound) {
				if hint.Target == "meeting" {
					continue
				}

				hint.Terminal = true
			} else if err != nil {
				return err
			} else {
				hint.Epoch, hint.LatestSequence = stream.Epoch, stream.LatestSequence
			}

			hint.ID, hint.CreatedAt, hint.AvailableAt, hint.Attempts, hint.Invalidation = randomUUID(), now, now, 0, true
			hint.LeaseID, hint.LeaseUntil = "", nil
			groups[hint.Target+":"+hint.TargetID+":"+hint.MeetingID] = hint
		}

		if err := w.DeleteChatHints(old); err != nil {
			return err
		}

		for _, hint := range groups {
			if err := w.EnqueueChatHint(hint); err != nil {
				return err
			}
		}

		return nil
	})

	return more, err
}
