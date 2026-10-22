package meetings

import (
	"context"
	"errors"
)

// ClaimTransition reserves the next due job, recovering an expired lease safely.
// A failed result records exhausted attempts and must not be executed.
func (s *Service) ClaimTransition(ctx context.Context, options TransitionOptions) (TransitionJob, error) {
	if err := options.Validate(); err != nil {
		return TransitionJob{}, err
	}

	var result TransitionJob
	err := s.store.Update(ctx, func(w Writer) error {
		now := s.now().UTC()
		jobs, err := w.DueTransitions(now, 1)
		if err != nil {
			return err
		}

		if len(jobs) == 0 {
			return ErrNotFound
		}

		result = jobs[0]
		if result.Attempts >= options.MaxAttempts {
			result.State, result.ErrorCode = TransitionFailed, "lease_expired"
			result.LeaseToken = ""
			result.LastFailureCode, result.LastFailedAt = "lease_expired", now
		} else {
			if result.State == TransitionRunning {
				result.ErrorCode = "lease_expired"
			}

			result.State = TransitionRunning
			result.Attempts++
			result.TotalAttempts++
			result.LeaseToken = randomUUID()
			result.LeaseUntil = now.Add(options.Lease)
		}

		return w.SaveTransitionJob(result)
	})

	return result, err
}

// CompleteTransition atomically commits the status and acknowledges the leased job.
// Old schedules and deliveries after a committed transition are harmless no-ops.
func (s *Service) CompleteTransition(ctx context.Context, claimed TransitionJob) error {
	return s.store.Update(ctx, func(w Writer) error {
		job, err := w.TransitionJob(claimed.MeetingID, claimed.ScheduleVersion)
		if err != nil {
			return err
		}

		now := s.now().UTC()
		if job.State == TransitionCompleted {
			return nil
		}

		if !ownsTransition(job, claimed) || !job.LeaseUntil.After(now) {
			return ErrTransitionLeaseLost
		}

		meeting, err := w.Meeting(job.MeetingID)
		if err != nil {
			return err
		}

		if meeting.ScheduleVersion == job.ScheduleVersion && meeting.Status == Upcoming {
			if meeting.PastAt == nil || !meeting.PastAt.Equal(job.DueAt) || meeting.PastAt.After(now) {
				return ErrInvalidRecord
			}

			meeting.Status = Past
			meeting.Revision, err = increment(meeting.Revision)
			if err != nil {
				return err
			}

			if err := w.SaveMeeting(meeting); err != nil {
				return err
			}
		}

		job.State, job.LeaseToken, job.ErrorCode = TransitionCompleted, "", ""

		return w.SaveTransitionJob(job)
	})
}

// FailTransition retains attempt history and schedules a bounded retry.
func (s *Service) FailTransition(ctx context.Context, claimed TransitionJob, options TransitionOptions, cause error) error {
	if err := options.Validate(); err != nil {
		return err
	}

	return s.store.Update(ctx, func(w Writer) error {
		job, err := w.TransitionJob(claimed.MeetingID, claimed.ScheduleVersion)
		if err != nil {
			return err
		}

		if !ownsTransition(job, claimed) || !job.LeaseUntil.After(s.now()) {
			return nil
		}

		job.ErrorCode, job.LeaseToken = transitionError(cause), ""
		job.LastFailureCode, job.LastFailedAt = job.ErrorCode, s.now().UTC()
		job.State = TransitionFailed
		if job.Attempts < options.MaxAttempts {
			job.State = TransitionPending
			job.AvailableAt = s.now().UTC().Add(options.retryDelay(job.Attempts))
		}

		return w.SaveTransitionJob(job)
	})
}

func ownsTransition(job, claimed TransitionJob) bool {
	return job.State == TransitionRunning && job.LeaseToken != "" && job.LeaseToken == claimed.LeaseToken
}

func transitionError(err error) string {
	if errors.Is(err, ErrTransitionLeaseLost) {
		return "lease_lost"
	}

	if errors.Is(err, context.Canceled) {
		return "cancelled"
	}

	if errors.Is(err, context.DeadlineExceeded) {
		return "deadline_exceeded"
	}

	if errors.Is(err, ErrInvalidRecord) {
		return "invalid_state"
	}

	return "storage_error"
}
