// Package accounts coordinates profile removal through narrow domain operations.
package accounts

import (
	"context"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

// Identity owns authentication, erasure and the completion receipt.
type Identity interface {
	PrepareDeletion(context.Context, identity.DeletionInput) (identity.DeletionGrant, error)
	CompleteDeletion(context.Context, identity.DeletionGrant) error
}

// Meetings owns succession, shared history and participation rules.
type Meetings interface {
	RemoveAccount(context.Context, string) error
}

// Atomic binds both domain operations to one transaction, without exposing their stores.
type Atomic func(context.Context, func(Identity, Meetings) error) error

// Service publishes deletion only after every domain operation commits together.
type Service struct{ atomic Atomic }

// New receives the transaction boundary assembled by the composition root.
func New(atomic Atomic) *Service { return &Service{atomic: atomic} }

// Delete confirms either one complete removal or the result of a previous attempt.
func (s *Service) Delete(ctx context.Context, input identity.DeletionInput) error {
	return s.atomic(ctx, func(auth Identity, meetings Meetings) error {
		grant, err := auth.PrepareDeletion(ctx, input)
		if err != nil || grant.Completed {
			return err
		}

		if err := meetings.RemoveAccount(ctx, grant.UserID); err != nil {
			return err
		}

		return auth.CompleteDeletion(ctx, grant)
	})
}
