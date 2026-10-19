// Package identity verifies provider identities and manages opaque, revocable sessions.
package identity

import (
	"context"
	"errors"
	"time"
)

var (
	ErrInvalidAttempt  = errors.New("invalid or expired authentication attempt")
	ErrUnauthenticated = errors.New("no valid session")
	ErrForbidden       = errors.New("request binding does not match")
	ErrUnavailable     = errors.New("authentication provider unavailable")
	ErrConflict        = errors.New("identity record conflict")
)

// ValidationError identifies a field without exposing submitted values.
type ValidationError struct{ Field string }

func (e ValidationError) Error() string { return "invalid authentication field: " + e.Field }

// ReturnContext is a closed choice of local destinations, never an arbitrary URL.
type ReturnContext struct{ Kind, Token string }

// User is the local profile linked to a verified external subject.
type User struct {
	ID, DisplayName string
	CreatedAt       time.Time
}

// Attempt holds short-lived provider and application bindings. ProviderVerifier
// is needed only until the provider exchange; session and handoff secrets are hashed.
type Attempt struct {
	ID, StateHash, ClientKind, BindingHash, AppChallenge, ProviderVerifier string
	Context                                                                ReturnContext
	ExpiresAt                                                              time.Time
	StateConsumed                                                          bool
	Status, UserID, HandoffHash                                            string
	HandoffExpiresAt                                                       time.Time
}

// Session stores the hash of an opaque secret, never the secret itself.
type Session struct {
	ID, UserID, SecretHash, ClientKind string
	ExpiresAt                          time.Time
}

// CleanupCount describes expired records removed from the process-local store.
type CleanupCount struct{ Attempts, Sessions int }

// Records is valid only during its store callback; returned values are copies.
type Records interface {
	Attempt(string) (Attempt, bool)
	PutAttempt(Attempt)
	DeleteAttempt(string)
	UserBySubject(string) (User, bool)
	User(string) (User, bool)
	PutUser(string, User) error
	Session(string) (Session, bool)
	PutSession(Session)
	DeleteSession(string)
	Cleanup(time.Time) CleanupCount
}

// Store serializes short callbacks and publishes their changes atomically.
// External HTTP requests must run outside callbacks.
type Store interface {
	Update(context.Context, func(Records) error) error
}

// Profile comes only from a provider verified by the server.
type Profile struct{ Subject, DisplayName string }

// Provider performs authorization code + PKCE and verifies the resulting profile.
type Provider interface {
	AuthorizationURL(state, challenge string) string
	Verify(context.Context, string, string) (Profile, error)
}
