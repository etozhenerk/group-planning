package meetings

import (
	"context"
	"time"
)

// ClosePlacePoll applies an expired poll atomically; repeated deliveries are no-ops.
func (s *Service) ClosePlacePoll(ctx context.Context, id string) error {
	return s.update(ctx, func(writer Writer) error {
		poll, err := writer.PlacePoll(id)
		if err != nil {
			return err
		}

		if poll.State != PlacePollOpen || poll.CloseJob.State == TransitionFailed || s.now().Before(poll.CloseJob.AvailableAt) {
			return nil
		}

		if s.now().Before(poll.ClosesAt) {
			return &Conflict{Code: "place_poll_not_due"}
		}

		meeting, err := writer.Meeting(poll.MeetingID)
		if err != nil {
			return err
		}

		poll.CloseJob.Attempts++
		poll.CloseJob.TotalAttempts++
		if err := s.finishPlacePoll(writer, meeting, &poll); err != nil {
			return err
		}

		return writer.SavePlacePoll(poll)
	})
}

func (s *Service) failPlacePollClose(ctx context.Context, id string, options TransitionOptions) error {
	return s.update(ctx, func(writer Writer) error {
		poll, err := writer.PlacePoll(id)
		if err != nil {
			return err
		}

		if poll.State != PlacePollOpen || poll.CloseJob.State == TransitionFailed || s.now().Before(poll.CloseJob.AvailableAt) {
			return nil
		}

		poll.CloseJob.Attempts++
		poll.CloseJob.TotalAttempts++
		poll.CloseJob.ErrorCode = "storage_error"
		poll.CloseJob.AvailableAt = s.now().Add(options.retryDelay(poll.CloseJob.Attempts))
		if poll.CloseJob.Attempts >= options.MaxAttempts {
			poll.CloseJob.State = TransitionFailed
		}

		return writer.SavePlacePoll(poll)
	})
}

// RetryPlacePollClose is an operator operation, deliberately absent from public HTTP.
func (s *Service) RetryPlacePollClose(ctx context.Context, id string) error {
	return s.update(ctx, func(writer Writer) error {
		poll, err := writer.PlacePoll(id)
		if err != nil {
			return err
		}

		if poll.State != PlacePollOpen || poll.CloseJob.State != TransitionFailed {
			return nil
		}

		poll.CloseJob.Attempts = 0
		poll.CloseJob.ManualRetries++
		poll.CloseJob.State = TransitionPending
		poll.CloseJob.AvailableAt = s.now().UTC()

		return writer.SavePlacePoll(poll)
	})
}

func (s *Service) duePlacePolls(ctx context.Context, limit int) ([]PlacePoll, int, time.Duration, error) {
	result := []PlacePoll{}
	failed := 0
	var delay time.Duration
	err := s.store.View(ctx, func(reader Reader) error {
		polls, err := reader.PlacePolls()
		if err != nil {
			return err
		}

		for _, poll := range polls {
			if poll.State != PlacePollOpen {
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

func (s *Service) repairPlacePollJobs(ctx context.Context, limit int) error {
	return s.update(ctx, func(writer Writer) error {
		polls, err := writer.PlacePolls()
		if err != nil {
			return err
		}

		count := 0
		for _, poll := range polls {
			if poll.State != PlacePollOpen || poll.CloseJob.State != "" || count == limit {
				continue
			}

			poll.CloseJob = PollCloseJob{State: TransitionPending, AvailableAt: poll.ClosesAt}
			if err := writer.SavePlacePoll(poll); err != nil {
				return err
			}

			count++
		}

		return nil
	})
}
