package support_test

import (
	"context"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
	"github.com/etozhenerk/group-planning/backend/internal/support"
)

func TestRetentionRemovesAllStatusesAndPrivateDataAtThirtyDays(t *testing.T) {
	store := memory.NewSupport()
	now := time.Date(2026, 10, 28, 12, 0, 0, 0, time.UTC)
	service := support.New(store, nil, func() time.Time { return now })
	for index, state := range []string{"queued", "delivered", "failed", "leased"} {
		if err := store.Update(t.Context(), func(r support.Records) error {
			return r.Put(support.Feedback{
				Key: state, CreatedAt: now.Add(-support.Retention),
				Description: "private", Email: "person@example.test", Screenshot: &support.Screenshot{Data: []byte{1}},
				Delivered: index == 1, DeliveryFailed: index == 2, LeaseUntil: now.Add(time.Minute),
			})
		}); err != nil {
			t.Fatal(err)
		}
	}

	if err := store.Update(t.Context(), func(r support.Records) error {
		return r.Put(support.Feedback{Key: "recent", CreatedAt: now.Add(-support.Retention + time.Nanosecond)})
	}); err != nil {
		t.Fatal(err)
	}

	if work, err := service.DeliverNext(context.Background()); work || err != nil {
		t.Fatal("retention without delivery", work, err)
	}

	if err := store.Update(t.Context(), func(r support.Records) error {
		items, err := r.All()
		if err == nil && (len(items) != 1 || items[0].Key != "recent") {
			t.Fatal("wrong retention boundary", items)
		}

		return err
	}); err != nil {
		t.Fatal(err)
	}
}

func TestRetentionExpiresReceiptBeforeAcceptingNewSubmission(t *testing.T) {
	now := time.Now().UTC()
	service := support.New(memory.NewSupport(), nil, func() time.Time { return now })
	first, err := submit(service, 1)
	if err != nil {
		t.Fatal(err)
	}

	now = now.Add(support.Retention)
	second, err := submit(service, 1)
	if err != nil || first.ID == second.ID {
		t.Fatal("expired receipt retained", err)
	}
}
