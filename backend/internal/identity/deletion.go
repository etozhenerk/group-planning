package identity

import (
	"context"
	"time"
)

// DeletionInput binds the initial request to a session and subsequent retries to a secret receipt.
type DeletionInput struct {
	SessionToken, Token, Origin, CSRF string
	Web                               bool
}

// DeletionReceipt confirms only completion; it contains no profile or session identifiers.
type DeletionReceipt struct {
	Hash, ClientKind string
	ExpiresAt        time.Time
}

// DeletionGrant is valid only inside the atomic account transaction.
type DeletionGrant struct {
	UserID    string
	Receipt   DeletionReceipt
	Completed bool
}

// WithStore binds the same rules to a short-lived transaction store at the composition root.
func (s *Service) WithStore(store Store) *Service {
	copy := *s
	copy.store = store

	return &copy
}

// PrepareDeletion authenticates a first request or recognizes an unexpired completed receipt.
// The caller must keep this operation and CompleteDeletion in one transaction.
func (s *Service) PrepareDeletion(ctx context.Context, input DeletionInput) (DeletionGrant, error) {
	if !validSecret(input.Token) {
		return DeletionGrant{}, ValidationError{"deletion_token"}
	}

	var receipt DeletionReceipt
	var completed bool
	err := s.store.Update(ctx, func(records Records) error {
		receipt, completed = records.DeletionReceipt(digest(input.Token))
		completed = completed && s.now().Before(receipt.ExpiresAt)

		return nil
	})
	if err != nil {
		return DeletionGrant{}, err
	}

	if completed {
		if receipt.ClientKind == "web" && input.Origin != s.config.PublicOrigin {
			return DeletionGrant{}, ErrForbidden
		}

		return DeletionGrant{Receipt: receipt, Completed: true}, nil
	}

	principal, err := s.Authenticate(ctx, input.SessionToken, input.Web)
	if err != nil {
		return DeletionGrant{}, err
	}

	if err := s.AuthorizeMutation(principal, input.Origin, input.CSRF); err != nil {
		return DeletionGrant{}, err
	}

	return DeletionGrant{UserID: principal.User.ID, Receipt: DeletionReceipt{Hash: digest(input.Token), ClientKind: principal.ClientKind, ExpiresAt: s.now().Add(24 * time.Hour)}}, nil
}

// CompleteDeletion erases profile/provider/session data and persists a bounded completion proof.
func (s *Service) CompleteDeletion(ctx context.Context, grant DeletionGrant) error {
	if grant.Completed || grant.UserID == "" {
		return ErrConflict
	}

	return s.store.Update(ctx, func(records Records) error {
		subject, ok := records.UserSubject(grant.UserID)
		if !ok {
			return ErrUnauthenticated
		}

		records.PutSubjectFence(digest(subject), s.now())
		records.DeleteUser(grant.UserID)
		records.PutDeletionReceipt(grant.Receipt)

		return nil
	})
}
