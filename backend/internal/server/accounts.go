package server

import (
	"context"
	"errors"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/accounts"
	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type accountStorage interface {
	AccountUpdate(context.Context, meetings.Store, func(identity.Store, meetings.Store) error) error
}

// NewAccounts wires domain operations to the shared transaction supplied by storage.
func NewAccounts(store meetings.Store, identities identity.Store, auth *identity.Service, now func() time.Time) (*accounts.Service, error) {
	if auth == nil {
		return nil, nil
	}

	atomic, ok := identities.(accountStorage)
	if !ok {
		return nil, errors.New("storage does not support atomic account deletion")
	}

	return accounts.New(func(ctx context.Context, fn func(accounts.Identity, accounts.Meetings) error) error {
		return atomic.AccountUpdate(ctx, store, func(authStore identity.Store, meetingStore meetings.Store) error {
			return fn(auth.WithStore(authStore), meetings.NewService(meetingStore, now))
		})
	}, auth.AccountDeleted), nil
}
