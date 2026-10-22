package meetings

import (
	"context"
	"errors"
)

// ReconcileTransitions repairs missing jobs in one bounded, rechecked batch.
// next is empty after a complete pass; callers retain it between batches.
func (s *Service) ReconcileTransitions(ctx context.Context, after string, limit int) (next string, repaired int, err error) {
	if limit < 1 || limit > 1000 {
		return "", 0, ErrInvalidRecord
	}

	var candidates []Meeting
	err = s.store.View(ctx, func(r Reader) error {
		var readErr error
		candidates, readErr = r.OverdueMeetings(after, s.now(), limit)

		return readErr
	})
	if err != nil {
		return "", 0, err
	}

	err = s.store.Update(ctx, func(w Writer) error {
		for _, candidate := range candidates {
			current, readErr := w.Meeting(candidate.ID)
			if errors.Is(readErr, ErrNotFound) {
				continue
			}

			if readErr != nil {
				return readErr
			}

			if current.Status != Upcoming || current.ScheduleVersion != candidate.ScheduleVersion || current.PastAt == nil || current.PastAt.After(s.now()) {
				continue
			}

			_, readErr = w.TransitionJob(current.ID, current.ScheduleVersion)
			if readErr == nil {
				continue
			}

			if !errors.Is(readErr, ErrNotFound) {
				return readErr
			}

			if err := ensureTransition(w, current); err != nil {
				return err
			}

			repaired++
		}

		return nil
	})
	if err != nil {
		return "", 0, err
	}

	if len(candidates) == limit {
		next = candidates[len(candidates)-1].ID
	}

	return next, repaired, nil
}

// RetryFailedTransition is an operator operation, not exposed through public HTTP.
// Only the current failed schedule is requeued; history records manual retries.
func (s *Service) RetryFailedTransition(ctx context.Context, meetingID string, version uint64) error {
	return s.store.Update(ctx, func(w Writer) error {
		job, err := w.TransitionJob(meetingID, version)
		if err != nil {
			return err
		}

		if job.State != TransitionFailed {
			return ErrInvalidRecord
		}

		meeting, err := w.Meeting(meetingID)
		if err != nil {
			return err
		}

		job.State = TransitionCompleted
		job.ManualRetries++
		if meeting.ScheduleVersion == version && meeting.Status == Upcoming {
			if meeting.PastAt == nil || !meeting.PastAt.Equal(job.DueAt) {
				return ErrInvalidRecord
			}

			job.State, job.Attempts, job.ErrorCode = TransitionPending, 0, ""
			job.AvailableAt = *meeting.PastAt
		}

		return w.SaveTransitionJob(job)
	})
}

// ReadTransitionStats reads safe operational counters without changing meetings.
func (s *Service) ReadTransitionStats(ctx context.Context) (TransitionStats, error) {
	var result TransitionStats
	err := s.store.View(ctx, func(r Reader) error {
		var err error
		result, err = r.TransitionStats(s.now())

		return err
	})

	return result, err
}
