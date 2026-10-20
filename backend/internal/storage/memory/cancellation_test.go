package memory_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestCancelledUpdateRollsBack(t *testing.T) {
	store := memory.New()
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	err := store.Update(ctx, func(tx meetings.Writer) error {
		if err := tx.SaveMeeting(meetings.Meeting{ID: "meeting"}); err != nil {
			return err
		}

		cancel()

		return nil
	})
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("cancelled update: %v", err)
	}

	err = store.View(t.Context(), func(tx meetings.Reader) error { _, err := tx.Meeting("meeting"); return err })
	if !errors.Is(err, meetings.ErrNotFound) {
		t.Fatalf("cancelled changes were published: %v", err)
	}

	if err := store.Update(ctx, func(meetings.Writer) error { t.Error("cancelled callback ran"); return nil }); !errors.Is(err, context.Canceled) {
		t.Fatalf("already cancelled context: %v", err)
	}
}

func TestWaitingWriterCanCancel(t *testing.T) {
	store := memory.New()
	entered, release := make(chan struct{}), make(chan struct{})
	finished := make(chan error, 1)
	go func() {
		finished <- store.Update(t.Context(), func(meetings.Writer) error {
			close(entered)
			<-release

			return nil
		})
	}()
	<-entered
	defer func() { close(release); <-finished }()
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	waiter := make(chan error, 1)
	go func() {
		waiter <- store.Update(ctx, func(meetings.Writer) error { return errors.New("unexpected callback") })
	}()
	cancel()
	select {
	case err := <-waiter:
		if !errors.Is(err, context.Canceled) {
			t.Fatalf("waiting update: %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("cancelled writer waited for the active transaction")
	}
}

func TestPanicRollsBackAndReleasesWriter(t *testing.T) {
	store := memory.New()
	func() {
		defer func() {
			if value := recover(); value != "abort" {
				t.Fatalf("unexpected panic: %v", value)
			}
		}()
		_ = store.Update(t.Context(), func(tx meetings.Writer) error {
			if err := tx.SaveMeeting(meetings.Meeting{ID: "meeting"}); err != nil {
				t.Fatal(err)
			}

			panic("abort")
		})
	}()
	err := store.View(t.Context(), func(tx meetings.Reader) error { _, err := tx.Meeting("meeting"); return err })
	if !errors.Is(err, meetings.ErrNotFound) {
		t.Fatalf("panic published candidate: %v", err)
	}

	createMeeting(t, store)
}
