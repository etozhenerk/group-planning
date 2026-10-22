package meetings

import (
	"context"
	"errors"
)

// PublicPreview exposes public invitation details without exposing storage.
func (s *Service) PublicPreview(ctx context.Context, token string) (PublicInvitation, error) {
	return Preview(ctx, s.store, token)
}

// InvitationExists checks a return target without sharing meeting records with identity.
func (s *Service) InvitationExists(ctx context.Context, token string) (bool, error) {
	_, err := s.PublicPreview(ctx, token)
	if errors.Is(err, ErrNotFound) {
		return false, nil
	}

	return err == nil, err
}
