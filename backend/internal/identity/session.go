package identity

import (
	"context"
	"time"
)

// IssuedSession is returned once to a native client, never persisted as plaintext.
type IssuedSession struct {
	Secret    string
	ExpiresAt time.Time
	Context   ReturnContext
}

// Exchange atomically verifies the application verifier and consumes its handoff.
func (s *Service) Exchange(ctx context.Context, id, code, verifier string) (IssuedSession, error) {
	if !validSecret(code) || !verifierPattern.MatchString(verifier) {
		return IssuedSession{}, ErrInvalidAttempt
	}
	token := secret()
	var result IssuedSession
	err := s.store.Update(ctx, func(records Records) error {
		attempt, ok := records.Attempt(id)
		if !ok || attempt.ClientKind == "web" || attempt.Status != "provider_verified" || !s.now().Before(attempt.ExpiresAt) || !s.now().Before(attempt.HandoffExpiresAt) || !equal(attempt.HandoffHash, digest(code)) || !equal(attempt.AppChallenge, challenge(verifier)) {
			return ErrInvalidAttempt
		}
		if _, ok := records.User(attempt.UserID); !ok {
			return ErrInvalidAttempt
		}
		session := s.newSession(attempt.UserID, attempt.ClientKind, token)
		records.PutSession(session)
		records.DeleteAttempt(attempt.ID)
		result = IssuedSession{Secret: token, ExpiresAt: session.ExpiresAt, Context: attempt.Context}
		return nil
	})
	return result, err
}

// Principal is the verified local caller; CSRF is derived from the supplied
// web session secret so the store never needs its plaintext or a CSRF secret.
type Principal struct {
	User       User
	ClientKind string
	ExpiresAt  time.Time
	CSRF       string
}

// Authenticate enforces the distinction between browser cookies and Bearer sessions.
func (s *Service) Authenticate(ctx context.Context, token string, web bool) (Principal, error) {
	if !validSecret(token) {
		return Principal{}, ErrUnauthenticated
	}
	var result Principal
	err := s.store.Update(ctx, func(records Records) error {
		session, ok := records.Session(digest(token))
		if !ok || !s.now().Before(session.ExpiresAt) || (session.ClientKind == "web") != web {
			return ErrUnauthenticated
		}
		user, ok := records.User(session.UserID)
		if !ok {
			return ErrUnauthenticated
		}
		result = Principal{User: user, ClientKind: session.ClientKind, ExpiresAt: session.ExpiresAt}
		if web {
			result.CSRF = csrfToken(token)
		}
		return nil
	})
	return result, err
}

// AuthorizeMutation applies Origin and CSRF checks to browser mutations only.
func (s *Service) AuthorizeMutation(principal Principal, origin, csrf string) error {
	if principal.ClientKind == "web" && (origin != s.config.PublicOrigin || csrf == "" || !equal(principal.CSRF, csrf)) {
		return ErrForbidden
	}
	return nil
}

// Logout revokes a session after the caller has passed authentication and CSRF.
func (s *Service) Logout(ctx context.Context, token string) error {
	return s.store.Update(ctx, func(records Records) error { records.DeleteSession(digest(token)); return nil })
}

// Cleanup removes expired attempts/sessions; validity checks never rely on its timing.
func (s *Service) Cleanup(ctx context.Context) (CleanupCount, error) {
	var count CleanupCount
	err := s.store.Update(ctx, func(records Records) error { count = records.Cleanup(s.now()); return nil })
	return count, err
}
