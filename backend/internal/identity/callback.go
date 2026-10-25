package identity

import (
	"context"
	"time"
)

// CallbackInput contains provider parameters and the initiating browser's binding.
type CallbackInput struct{ State, Code, ProviderError, Binding string }

// Completed redirects only to a configured client; web secrets belong in cookies.
type Completed struct {
	SessionMaxAge                                     int
	AttemptID, ClientKind, RedirectURL, SessionSecret string
	ExpiresAt                                         time.Time
}

// Callback consumes state before external I/O so concurrent callbacks cannot
// exchange the same provider code or issue more than one handoff/session.
func (s *Service) Callback(ctx context.Context, input CallbackInput) (Completed, error) {
	if input.State == "" || len(input.State) > 128 || (input.Code == "") == (input.ProviderError == "") || len(input.Code) > 4096 {
		return Completed{}, ErrInvalidAttempt
	}

	var attempt Attempt
	err := s.store.Update(ctx, func(records Records) error {
		current, ok := records.Attempt(AttemptID(input.State))
		if !ok || current.StateConsumed || !s.now().Before(current.ExpiresAt) || !equal(current.StateHash, digest(input.State)) {
			return ErrInvalidAttempt
		}

		if current.ClientKind == "web" && (!validSecret(input.Binding) || !equal(current.BindingHash, digest(input.Binding))) {
			return ErrForbidden
		}

		current.StateConsumed = true
		records.PutAttempt(current)
		attempt = current

		return nil
	})
	if err != nil {
		return Completed{}, err
	}

	if input.ProviderError != "" {
		code := "auth_failed"
		if input.ProviderError == "access_denied" {
			code = "auth_cancelled"
		}

		return s.failedCallback(ctx, attempt, code)
	}

	profile, err := s.provider.Verify(ctx, input.Code, attempt.ProviderVerifier)
	if err != nil {
		return s.failedCallback(ctx, attempt, "auth_unavailable")
	}

	if profile.Subject == "" || len(profile.Subject) > 256 || profile.DisplayName == "" || len(profile.DisplayName) > 1000 {
		return s.failedCallback(ctx, attempt, "auth_unavailable")
	}

	handoff := secret()
	sessionSecret := secret()
	result := Completed{AttemptID: attempt.ID, ClientKind: attempt.ClientKind}
	err = s.store.Update(ctx, func(records Records) error {
		current, ok := records.Attempt(attempt.ID)
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

		current.ProviderVerifier = ""
		current.StateHash = ""
		current.BindingHash = ""
		current.UserID = user.ID
		if current.ClientKind == "web" {
			session := s.newSession(user.ID, "web", sessionSecret)
			records.PutSession(session)
			records.DeleteAttempt(current.ID)
			result.SessionMaxAge = int(s.config.SessionTTL.Seconds())
			result.SessionSecret = sessionSecret
			result.ExpiresAt = session.ExpiresAt
		} else {
			current.Status = "provider_verified"
			current.HandoffHash = digest(handoff)
			current.HandoffExpiresAt = s.now().Add(time.Minute)
			records.PutAttempt(current)
		}

		result.RedirectURL = s.returnURL(current, "", handoff)

		return nil
	})

	return result, err
}

func (s *Service) failedCallback(ctx context.Context, attempt Attempt, code string) (Completed, error) {
	err := s.store.Update(ctx, func(records Records) error { records.DeleteAttempt(attempt.ID); return nil })
	if err != nil {
		return Completed{}, err
	}

	return Completed{
		AttemptID:   attempt.ID,
		ClientKind:  attempt.ClientKind,
		RedirectURL: s.returnURL(attempt, code, ""),
	}, nil
}

func (s *Service) newSession(userID, kind, secret string) Session {
	return Session{
		ID:         uuid(),
		UserID:     userID,
		SecretHash: digest(secret),
		ClientKind: kind,
		ExpiresAt:  s.now().Add(s.config.SessionTTL),
	}
}
