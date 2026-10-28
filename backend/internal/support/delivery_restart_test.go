package support_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
	"github.com/etozhenerk/group-planning/backend/internal/support"
)

func TestRestartAfterLastLeaseDoesNotExceedDeliveryBudget(t *testing.T) {
	store := memory.NewSupport()
	now := time.Now().UTC()
	if err := store.Update(t.Context(), func(r support.Records) error {
		return r.Put(support.Feedback{
			Key: "last-attempt", CreatedAt: now.Add(-time.Hour),
			Attempts: support.MaxDeliveryAttempts, LeaseID: "crashed-worker", LeaseUntil: now.Add(-time.Second),
		})
	}); err != nil {
		t.Fatal(err)
	}

	service := support.New(store, deliveryFunc(func(context.Context, support.Feedback) (support.Progress, error) {
		t.Fatal("automatic retry exceeded budget after crash")
		return support.Progress{}, nil
	}), func() time.Time { return now })
	if work, err := service.DeliverNext(t.Context()); !work || !errors.Is(err, support.ErrDeliveryExhausted) {
		t.Fatal("exhausted lease was not fenced", work, err)
	}

	if err := store.Update(t.Context(), func(r support.Records) error {
		item, _, err := r.ByKey("last-attempt")
		if !item.DeliveryFailed || item.Attempts != support.MaxDeliveryAttempts || item.LeaseID != "" {
			t.Fatal("terminal delivery state not saved")
		}

		return err
	}); err != nil {
		t.Fatal(err)
	}
}
