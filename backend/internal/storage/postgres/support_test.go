package postgres

import (
	"context"
	"errors"
	"fmt"
	"os"
	"reflect"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/support"
)

func supportRuntimeDB(t *testing.T) *Database {
	t.Helper()
	dsn := os.Getenv("SOMEWHERE_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("cloud integration database is not configured")
	}

	db, err := Open(t.Context(), dsn)
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(db.Close)
	if db.pool.Config().ConnConfig.Database != "somewhere_integration" {
		t.Fatal("refusing non-test database")
	}

	if err := db.Check(t.Context()); err != nil {
		t.Fatal(err)
	}

	return db
}

func TestSupportMigration(t *testing.T) { integrationDB(t) }

func TestSupportPersistentAcceptanceAndRollback(t *testing.T) {
	db := supportRuntimeDB(t)
	other := supportRuntimeDB(t)
	now := time.Now().UTC()
	service := support.New(db.Support(), nil, func() time.Time { return now })
	key := fmt.Sprintf("%x-%x-%x-%x-%x", randBytes(4), randBytes(2), randBytes(2), randBytes(2), randBytes(6))
	input := support.Input{ClientRequestID: key, Kind: "problem", Description: "SQL synthetic feedback", Screen: "other"}
	var wait sync.WaitGroup
	receipts := make(chan support.Receipt, 12)
	errorsFound := make(chan error, 12)
	for range 12 {
		wait.Go(func() {
			receipt, err := service.Submit(t.Context(), input, key, key)
			receipts <- receipt
			errorsFound <- err
		})
	}

	wait.Wait()
	close(receipts)
	close(errorsFound)
	for err := range errorsFound {
		if err != nil {
			t.Fatal(err)
		}
	}

	first := <-receipts
	for value := range receipts {
		if value != first {
			t.Fatal("concurrent duplicate receipt")
		}
	}

	reopened := support.New(other.Support(), nil, func() time.Time { return now })
	if receipt, err := reopened.Submit(t.Context(), input, key, key); err != nil || receipt != first {
		t.Fatal("receipt lost across connection pools", err)
	}

	input.Description += " changed"
	if _, err := reopened.Submit(t.Context(), input, key, key); !errors.Is(err, support.ErrIdempotencyConflict) {
		t.Fatal("changed submission accepted", err)
	}

	rollback := errors.New("synthetic rollback")
	var retained support.Records
	if err := db.Support().Update(t.Context(), func(r support.Records) error {
		retained = r
		item, ok, err := r.ByKey(key)
		if err != nil || !ok {
			return fmt.Errorf("accepted feedback absent: %w", err)
		}

		item.Description = "must roll back"
		if err := r.Put(item); err != nil {
			return err
		}

		return rollback
	}); !errors.Is(err, rollback) {
		t.Fatal("rollback error", err)
	}

	if _, _, err := retained.ByKey(key); err == nil {
		t.Fatal("closed transaction remained readable")
	}

	if err := other.Support().Update(t.Context(), func(r support.Records) error {
		item, _, err := r.ByKey(key)
		if item.Description != "SQL synthetic feedback" {
			t.Fatal("rollback leaked")
		}

		return err
	}); err != nil {
		t.Fatal(err)
	}

	for count := 0; count < 5; count++ {
		nextKey := fmt.Sprintf("%x-%x-%x-%x-%x", randBytes(4), randBytes(2), randBytes(2), randBytes(2), randBytes(6))
		input.ClientRequestID = nextKey
		_, err := reopened.Submit(t.Context(), input, nextKey, key)
		if count < 4 && err != nil {
			t.Fatal("duplicate requests consumed rate budget", err)
		}

		if count == 4 && !errors.Is(err, support.ErrRateLimited) {
			t.Fatal("rate limit lost across connections", err)
		}
	}
}

type supportDeliveryFunc func(context.Context, support.Feedback) (support.Progress, error)

func (fn supportDeliveryFunc) Send(ctx context.Context, item support.Feedback) (support.Progress, error) {
	return fn(ctx, item)
}

func TestSupportProcessPersistence(t *testing.T) {
	phase := os.Getenv("SOMEWHERE_SUPPORT_TEST_PHASE")
	if phase == "" {
		t.Skip("explicit two-process fixture phase required")
	}

	db := supportRuntimeDB(t)
	now := time.Date(2026, 10, 28, 12, 0, 0, 0, time.UTC)
	key := "50000000-0000-4000-8000-000000000008"
	item := support.Feedback{
		ID: key, Key: key, Reference: "SW-QA", RequestHash: "synthetic",
		Description: "Isolated SQL persistence", CreatedAt: now, NextAttemptAt: now,
		Screenshot:  &support.Screenshot{Data: []byte{1, 2, 3}, ContentType: "image/png"},
		Diagnostics: &support.Diagnostics{Platform: "web", ClientVersion: "qa"},
	}
	if phase == "seed" {
		if err := db.Support().Update(t.Context(), func(r support.Records) error { return r.Put(item) }); err != nil {
			t.Fatal(err)
		}

		service := support.New(db.Support(), supportDeliveryFunc(func(context.Context, support.Feedback) (support.Progress, error) {
			return support.Progress{MessageID: 101, SentChunks: 1}, errors.New("synthetic attachment outage")
		}), func() time.Time { return now })
		if work, err := service.DeliverNext(t.Context()); !work || !errors.Is(err, support.ErrUnavailable) {
			t.Fatal("partial delivery", work, err)
		}

		return
	}

	if phase != "verify" {
		t.Fatal("unknown fixture phase")
	}

	if err := db.Support().Update(t.Context(), func(r support.Records) error {
		stored, ok, err := r.ByKey(key)
		if err != nil || !ok || !reflect.DeepEqual(stored.Screenshot, item.Screenshot) || !reflect.DeepEqual(stored.Diagnostics, item.Diagnostics) || stored.Progress.MessageID != 101 || stored.Progress.SentChunks != 1 || stored.Attempts != 1 || stored.Delivered {
			t.Fatal("process restart lost payload or retry progress", err)
		}

		return nil
	}); err != nil {
		t.Fatal(err)
	}

	now = now.Add(time.Minute)
	started := make(chan struct{})
	release := make(chan struct{})
	first := support.New(db.Support(), supportDeliveryFunc(func(ctx context.Context, value support.Feedback) (support.Progress, error) {
		if value.Progress.SentChunks != 1 {
			t.Error("acknowledged text would be sent again")
		}

		close(started)
		select {
		case <-release:
		case <-ctx.Done():
			return value.Progress, ctx.Err()
		}

		return support.Progress{MessageID: 101, SentChunks: 1, FileMessageID: 102}, nil
	}), func() time.Time { return now })
	done := make(chan error, 1)
	go func() { _, err := first.DeliverNext(t.Context()); done <- err }()
	select {
	case <-started:
	case <-time.After(5 * time.Second):
		t.Fatal("delivery did not start")
	}

	second := support.New(supportRuntimeDB(t).Support(), supportDeliveryFunc(func(context.Context, support.Feedback) (support.Progress, error) {
		t.Error("two workers acquired the same lease")
		return support.Progress{}, nil
	}), func() time.Time { return now })
	work, err := second.DeliverNext(t.Context())
	close(release)
	if work || err != nil {
		t.Fatal("lease was not exclusive", work, err)
	}

	if err := <-done; err != nil {
		t.Fatal(err)
	}

	now = item.CreatedAt.Add(support.Retention)
	if _, err := second.DeliverNext(t.Context()); err != nil {
		t.Fatal(err)
	}

	if err := db.Support().Update(t.Context(), func(r support.Records) error {
		_, exists, err := r.ByKey(key)
		if exists {
			t.Fatal("payload survived thirty-day deadline")
		}

		return err
	}); err != nil {
		t.Fatal(err)
	}
}
