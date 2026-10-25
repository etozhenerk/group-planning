package identity

import (
	"context"
	"time"
)

// TokenProvider verifies a token obtained by the official native SDK.
// The server must validate both the provider identity and the OAuth client ID.
type TokenProvider interface {
	VerifyToken(context.Context, string) (Profile, error)
}

// ExchangeSDK consumes an application-bound attempt before provider I/O.
// Provider tokens are used only for verification and are never stored.
func (s *Service) ExchangeSDK(ctx context.Context, id, verifier, providerToken string) (IssuedSession, error) {
	provider, ok := s.provider.(TokenProvider)
	if !ok {
		return IssuedSession{}, ErrUnavailable
	}

	if !verifierPattern.MatchString(verifier) || providerToken == "" || len(providerToken) > 4096 {
		return IssuedSession{}, ErrInvalidAttempt
	}

	var attempt Attempt
	err := s.store.Update(ctx, func(records Records) error {
		current, ok := records.Attempt(id)
		if !ok || current.ClientKind == "web" || current.StateConsumed || current.Status != "pending" ||
			!s.now().Before(current.ExpiresAt) || !equal(current.AppChallenge, challenge(verifier)) {
			return ErrInvalidAttempt
		}

		current.StateConsumed = true
		current.ProviderVerifier = ""
		current.StateHash = ""
		records.PutAttempt(current)
		attempt = current

		return nil
	})
	if err != nil {
		return IssuedSession{}, err
	}

	profile, err := provider.VerifyToken(ctx, providerToken)
	if err != nil || profile.Subject == "" || len(profile.Subject) > 256 || profile.DisplayName == "" || len(profile.DisplayName) > 1000 {
		_ = s.store.Update(ctx, func(records Records) error { records.DeleteAttempt(id); return nil })
		return IssuedSession{}, ErrUnavailable
	}

	token := secret()
	var result IssuedSession
	err = s.store.Update(ctx, func(records Records) error {
		current, ok := records.Attempt(id)
		if !ok || !current.StateConsumed || current.Status != "pending" || !s.now().Before(current.ExpiresAt) {
			return ErrInvalidAttempt
		}

		if deletedAt, exists := records.SubjectFence(digest("yandex:" + profile.Subject)); exists && !current.ExpiresAt.Add(-10*time.Minute).After(deletedAt) {
			return ErrInvalidAttempt
		}

		user, exists := records.UserBySubject("yandex:" + profile.Subject)
		if !exists {
			user = User{ID: uuid(), DisplayName: profile.DisplayName, CreatedAt: s.now()}
			if err := records.PutUser("yandex:"+profile.Subject, user); err != nil {
				return err
			}
		}

		session := s.newSession(user.ID, attempt.ClientKind, token)
		records.PutSession(session)
		records.DeleteAttempt(id)
		result = IssuedSession{Secret: token, ExpiresAt: session.ExpiresAt, Context: attempt.Context}

		return nil
	})

	return result, err
}
