package meetings

import (
	"context"
	"errors"
	"math/rand/v2"
	"time"
)

// ChatPublisher publishes a committed reference hint; success does not imply receipt.
type ChatPublisher interface {
	PublishChat(context.Context, ChatHint) error
}

// ChatDispatchStats describes one bounded drain, not end-user delivery.
type ChatDispatchStats struct {
	Claimed, Published, Retried, Acknowledged, Deleted, Batches, Discarded int
	More                                                                   bool
}

// DispatchChat drains at most ten batches, with no broker call inside Store.Update.
// A process crash before acknowledgement replays the same durable event after its lease.
func (s *Service) DispatchChat(ctx context.Context, publisher ChatPublisher) (ChatDispatchStats, error) {
	var result ChatDispatchStats
	for range 10 {
		if err := ctx.Err(); err != nil {
			return result, err
		}

		now := s.now().UTC()
		lease := randomUUID()
		var hints []ChatHint
		var send []bool
		err := s.store.Update(ctx, func(w Writer) error {
			var err error
			hints, err = w.LeaseChatHints(now, now.Add(30*time.Second), lease, 100)
			if err != nil {
				return err
			}

			send = make([]bool, len(hints))
			for i := range hints {
				send[i], err = prepareChatHint(w, &hints[i], now)
				if err != nil {
					return err
				}
			}

			return nil
		})
		if err != nil {
			return result, err
		}

		result.Batches++
		result.Claimed += len(hints)
		result.More = len(hints) == 100
		retries := make([]time.Duration, len(hints))
		for i, h := range hints {
			if !send[i] {
				result.Discarded++
				continue
			}

			if err := ctx.Err(); err != nil {
				return result, err
			}

			if err := publisher.PublishChat(ctx, h); err != nil {
				delay := time.Duration(float64(time.Second*time.Duration(1<<min(h.Attempts, 8))) * (0.5 + rand.Float64()/2))
				retries[i] = delay
				result.Retried++
			} else {
				result.Published++
			}
		}

		acked, deleted := 0, 0
		err = s.store.Update(ctx, func(w Writer) error {
			// Start backoff at acknowledgement: later publishes or waiting for the
			// write transaction must not turn a valid retry into an expired deadline.
			acknowledgedAt := s.now().UTC()
			for i, h := range hints {
				var retry time.Time
				if retries[i] > 0 {
					retry = acknowledgedAt.Add(retries[i])
				}

				ok, err := w.FinishChatHint(h.ID, lease, acknowledgedAt, retry)
				if err != nil {
					return err
				}

				if ok {
					acked++
				}
			}

			n, err := w.DeleteDispatchedChatHints(100)
			deleted = n
			// Drain existing dispatched backlog even when no new events were claimed.
			result.More = result.More || n == 100

			return err
		})
		if err != nil {
			return result, err
		}

		result.Acknowledged += acked
		result.Deleted += deleted
		if !result.More {
			return result, nil
		}
	}

	return result, nil
}

// AuthorizeChatSubscription rechecks current private access independently of sync flags.
func (s *Service) AuthorizeChatSubscription(ctx context.Context, userID, id string) error {
	if userID == "" {
		return ErrUnauthenticated
	}

	return s.store.View(ctx, func(r Reader) error {
		m, err := r.Meeting(id)
		if err != nil {
			return err
		}

		response, err := r.RSVP(id, userID)
		if err != nil && !errors.Is(err, ErrNotFound) {
			return err
		}

		if !allowed(Details{Meeting: m, MyResponse: response}, userID) {
			return ErrForbidden
		}

		return nil
	})
}

// prepareChatHint never publishes a stale journal range. Its replacement is a
// current reference, recomputed on retry; the original durable event ID is kept.
func prepareChatHint(r Reader, h *ChatHint, now time.Time) (bool, error) {
	if h.Target == "user" {
		removed, err := r.UserRemoved(h.TargetID)
		if err != nil {
			return false, err
		}

		if removed {
			return false, nil
		}
	}

	stream, err := r.ChatStream(h.MeetingID)
	if errors.Is(err, ErrNotFound) {
		if h.Target == "meeting" {
			return false, nil
		}

		h.Terminal, h.Invalidation = true, true

		return true, nil
	}

	if err != nil {
		return false, err
	}

	if h.Epoch != stream.Epoch || h.LatestSequence < stream.RetainedAfter || h.CreatedAt.Before(now.Add(-chatRetention)) {
		h.Epoch, h.LatestSequence, h.Invalidation = stream.Epoch, stream.LatestSequence, true
	}

	return true, nil
}
