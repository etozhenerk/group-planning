package memory

import (
	"context"
	"errors"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

// AccountUpdate holds both stores in a fixed order and publishes both snapshots together.
func (s *Identity) AccountUpdate(ctx context.Context, store meetings.Store, fn func(identity.Store, meetings.Store) error) error {
	meetingStore, ok := store.(*Store)
	if !ok {
		return errors.New("account transaction requires matching memory stores")
	}

	select {
	case s.gate <- struct{}{}:
	case <-ctx.Done():
		return ctx.Err()
	}

	defer func() { <-s.gate }()
	if err := meetingStore.acquire(ctx); err != nil {
		return err
	}

	defer func() { <-meetingStore.gate }()
	data := s.data.clone()
	auth := &identityTransaction{data: &data}
	defer func() { auth.data = nil }()
	tx := &transaction{ctx: ctx, data: meetingStore.data.clone(), writable: true}
	defer tx.close()
	if err := fn(accountIdentityStore{auth}, accountMeetingStore{tx}); err != nil {
		return err
	}

	if err := ctx.Err(); err != nil {
		return err
	}

	s.data, meetingStore.data = data, tx.close()

	return nil
}

type accountIdentityStore struct{ records *identityTransaction }

func (s accountIdentityStore) Update(ctx context.Context, fn func(identity.Records) error) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	if s.records.data == nil {
		return identity.ErrConflict
	}

	return fn(s.records)
}

type accountMeetingStore struct{ tx *transaction }

func (s accountMeetingStore) View(ctx context.Context, fn func(meetings.Reader) error) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	return fn(s.tx)
}

func (s accountMeetingStore) Update(ctx context.Context, fn func(meetings.Writer) error) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	return fn(s.tx)
}
