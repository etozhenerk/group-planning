package support

import (
	"context"
	"slices"
	"strings"
	"time"
)

// DeliverNext leases one due record. Retry state never depends on the client.
func (s *Service) DeliverNext(ctx context.Context) (bool, error) {
	if s.delivery == nil {
		return false, nil
	}

	var selected Feedback
	found := false
	err := s.store.Update(ctx, func(records Records) error {
		all, err := records.All()
		if err != nil {
			return err
		}

		slices.SortFunc(all, func(a, b Feedback) int {
			if order := a.CreatedAt.Compare(b.CreatedAt); order != 0 {
				return order
			}

			return strings.Compare(a.ID, b.ID)
		})
		now := s.now()
		for _, item := range all {
			if item.Delivered || item.DeliveryFailed || now.Before(item.NextAttemptAt) || now.Before(item.LeaseUntil) {
				continue
			}

			item.LeaseID = newID()
			item.LeaseUntil = now.Add(2 * time.Minute)
			item.Attempts++
			selected = item
			found = true

			return records.Put(item)
		}

		return nil
	})
	if err != nil || !found {
		return false, err
	}

	sendCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	progress, sendErr := s.delivery.Send(sendCtx, selected)
	cancel()
	commitCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 2*time.Second)
	defer cancel()
	err = s.store.Update(commitCtx, func(records Records) error {
		item, exists, err := records.ByKey(selected.Key)
		if err != nil {
			return err
		}

		if !exists || item.LeaseID != selected.LeaseID {
			return nil
		}

		item.Progress = progress
		item.LeaseID = ""
		item.LeaseUntil = time.Time{}
		if sendErr == nil {
			item.Delivered = true
		} else if item.Attempts >= MaxDeliveryAttempts {
			item.DeliveryFailed = true
			item.NextAttemptAt = time.Time{}
		} else {
			delay := time.Minute * time.Duration(1<<min(item.Attempts-1, 6))
			item.NextAttemptAt = s.now().Add(min(delay, time.Hour))
		}

		return records.Put(item)
	})
	if err != nil {
		return true, err
	}

	if sendErr != nil {
		if selected.Attempts >= MaxDeliveryAttempts {
			return true, ErrDeliveryExhausted
		}

		return true, ErrUnavailable
	}

	return true, nil
}

// RetryDelivery reopens a retained failed record for an authorized operator.
// No public HTTP endpoint exposes this operation or the submission key.
func (s *Service) RetryDelivery(ctx context.Context, key string) error {
	return s.store.Update(ctx, func(r Records) error {
		item, exists, err := r.ByKey(key)
		if err != nil {
			return err
		}

		if !exists {
			return ErrUnavailable
		}

		if !item.DeliveryFailed {
			return nil
		}

		item.DeliveryFailed = false
		item.Attempts = 0
		item.NextAttemptAt = s.now()

		return r.Put(item)
	})
}
