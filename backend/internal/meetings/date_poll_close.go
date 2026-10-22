package meetings

import (
	"context"
	"time"
)

// CloseDatePoll applies an expired poll atomically; repeated deliveries are no-ops.
func (s *Service) CloseDatePoll(ctx context.Context, id string) error {
	return s.update(ctx, func(writer Writer) error {
		poll, err := writer.DatePoll(id)
		if err != nil {
			return err
		}

		if poll.State != PollOpen || poll.CloseJob.State == TransitionFailed || s.now().Before(poll.CloseJob.AvailableAt) {
			return nil
		}

		if s.now().Before(poll.ClosesAt) {
			return &Conflict{Code: "date_poll_not_due"}
		}

		meeting, err := writer.Meeting(poll.MeetingID)
		if err != nil {
			return err
		}

		poll.CloseJob.Attempts++
		poll.CloseJob.TotalAttempts++
		if err := s.evaluateDatePoll(writer, meeting, &poll, true); err != nil {
			return err
		}

		return writer.SaveDatePoll(poll)
	})
}

func (s *Service) failDatePollClose(ctx context.Context, id string, options TransitionOptions) error {
	return s.update(ctx, func(writer Writer) error {
		poll, err := writer.DatePoll(id)
		if err != nil {
			return err
		}

		if poll.State != PollOpen || poll.CloseJob.State == TransitionFailed || s.now().Before(poll.CloseJob.AvailableAt) {
			return nil
		}

		poll.CloseJob.Attempts++
		poll.CloseJob.TotalAttempts++
		poll.CloseJob.ErrorCode = "storage_error"
		poll.CloseJob.AvailableAt = s.now().Add(options.retryDelay(poll.CloseJob.Attempts))
		if poll.CloseJob.Attempts >= options.MaxAttempts {
			poll.CloseJob.State = TransitionFailed
		}

		return writer.SaveDatePoll(poll)
	})
}

// RetryDatePollClose is an operator operation, deliberately absent from public HTTP.
func (s *Service) RetryDatePollClose(ctx context.Context, id string) error {
	return s.update(ctx, func(writer Writer) error {
		poll, err := writer.DatePoll(id)
		if err != nil {
			return err
		}

		if poll.State != PollOpen || poll.CloseJob.State != TransitionFailed {
			return nil
		}

		poll.CloseJob.Attempts = 0
		poll.CloseJob.ManualRetries++
		poll.CloseJob.State = TransitionPending
		poll.CloseJob.AvailableAt = s.now().UTC()

		return writer.SaveDatePoll(poll)
	})
}

func (s *Service) dueDatePolls(ctx context.Context, limit int) ([]DatePoll, int, time.Duration, error) {
	result := []DatePoll{}
	failed := 0
	var delay time.Duration
	err := s.store.View(ctx, func(reader Reader) error {
		polls, err := reader.DatePolls()
		if err != nil {
			return err
		}

		for _, poll := range polls {
			if poll.State != PollOpen {
				continue
			}

			if s.now().After(poll.ClosesAt) {
				delay = max(delay, s.now().Sub(poll.ClosesAt))
			}

			if poll.CloseJob.State == TransitionFailed {
				failed++
				continue
			}

			if poll.CloseJob.State == TransitionPending && !s.now().Before(poll.CloseJob.AvailableAt) && len(result) < limit {
				result = append(result, poll)
			}
		}

		return nil
	})

	return result, failed, delay, err
}

func (s *Service) repairDatePollJobs(ctx context.Context, limit int) error {
	return s.update(ctx, func(writer Writer) error {
		polls, err := writer.DatePolls()
		if err != nil {
			return err
		}

		count := 0
		for _, poll := range polls {
			if poll.State != PollOpen || poll.CloseJob.State != "" || count == limit {
				continue
			}

			poll.CloseJob = PollCloseJob{State: TransitionPending, AvailableAt: poll.ClosesAt}
			if err := writer.SaveDatePoll(poll); err != nil {
				return err
			}

			count++
		}

		return nil
	})
}
