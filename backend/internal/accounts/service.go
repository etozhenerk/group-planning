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
type Service struct {
	atomic  Atomic
	deleted func(string)
}

// New receives the transaction boundary assembled by the composition root.
func New(atomic Atomic, deleted ...func(string)) *Service {
	s := &Service{atomic: atomic}
	if len(deleted) > 0 {
		s.deleted = deleted[0]
	}

	return s
}

// Delete confirms either one complete removal or the result of a previous attempt.
func (s *Service) Delete(ctx context.Context, input identity.DeletionInput) error {
	userID := ""
	err := s.atomic(ctx, func(auth Identity, meetings Meetings) error {
		grant, err := auth.PrepareDeletion(ctx, input)
		if err != nil || grant.Completed {
			return err
		}

		if err := meetings.RemoveAccount(ctx, grant.UserID); err != nil {
			return err
		}

		userID = grant.UserID

		return auth.CompleteDeletion(ctx, grant)
	})
	if err == nil && userID != "" && s.deleted != nil {
		s.deleted(userID)
	}

	return err
}
