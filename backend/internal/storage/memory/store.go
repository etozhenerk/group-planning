// Package memory provides temporary, process-local storage for development.
package memory

import (
	"context"
	"sync"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

// Store starts empty and loses all records when discarded or the process exits.
// New must be used to construct it. Each instance owns independent state.
type Store struct {
	gate chan struct{}
	data *state
}

var _ meetings.Store = (*Store)(nil)

// New creates an empty store with no network or filesystem dependencies.
func New() *Store {
	return &Store{gate: make(chan struct{}, 1), data: newState()}
}

func (s *Store) acquire(ctx context.Context) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case s.gate <- struct{}{}:
		if err := ctx.Err(); err != nil {
			<-s.gate
			return err
		}

		return nil
	}
}

// View reads a detached, consistent snapshot without holding the store gate
// during the callback. Writers may commit while this reader observes its snapshot.
func (s *Store) View(ctx context.Context, fn func(meetings.Reader) error) error {
	if err := s.acquire(ctx); err != nil {
		return err
	}

	tx := &transaction{data: s.data.clone()}
	<-s.gate
	defer tx.close()
	if err := fn(tx); err != nil {
		return err
	}

	return ctx.Err()
}

// Update publishes all changes together. Error, cancellation or panic discards
// the candidate snapshot. A panic is propagated after the store gate is released.
func (s *Store) Update(ctx context.Context, fn func(meetings.Writer) error) error {
	if err := s.acquire(ctx); err != nil {
		return err
	}

	defer func() { <-s.gate }()
	tx := &transaction{data: s.data.clone(), writable: true}
	defer tx.close()
	if err := fn(tx); err != nil {
		return err
	}

	candidate := tx.close()
	if err := ctx.Err(); err != nil {
		return err
	}

	s.data = candidate

	return nil
}

type transaction struct {
	mu       sync.Mutex
	data     *state
	writable bool
	closed   bool
}

func (tx *transaction) close() *state {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	tx.closed = true

	return tx.data
}

func (tx *transaction) check(write bool) error {
	if tx.closed {
		return meetings.ErrTransactionClosed
	}

	if write && !tx.writable {
		return meetings.ErrReadOnly
	}

	return nil
}
