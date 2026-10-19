package memory

import (
	"context"
	"maps"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

// Identity is the temporary transactional adapter for authentication records.
// No data is shared with other processes or retained across restarts.
type Identity struct {
	gate chan struct{}
	data identityData
}
type identityData struct {
	attempts map[string]identity.Attempt
	users    map[string]identity.User
	subjects map[string]string
	sessions map[string]identity.Session
}

// NewIdentity creates an empty authentication store independent from meetings.
func NewIdentity() *Identity {
	return &Identity{gate: make(chan struct{}, 1), data: identityData{attempts: map[string]identity.Attempt{}, users: map[string]identity.User{}, subjects: map[string]string{}, sessions: map[string]identity.Session{}}}
}

// Update rolls back errors, panics and cancellation, including all uniqueness indexes.
func (s *Identity) Update(ctx context.Context, callback func(identity.Records) error) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	select {
	case s.gate <- struct{}{}:
	case <-ctx.Done():
		return ctx.Err()
	}
	defer func() { <-s.gate }()
	if err := ctx.Err(); err != nil {
		return err
	}
	data := identityData{attempts: maps.Clone(s.data.attempts), users: maps.Clone(s.data.users), subjects: maps.Clone(s.data.subjects), sessions: maps.Clone(s.data.sessions)}
	tx := &identityTransaction{data: &data}
	defer func() { tx.data = nil }()
	if err := callback(tx); err != nil {
		return err
	}
	if err := ctx.Err(); err != nil {
		return err
	}
	s.data = data
	return nil
}

type identityTransaction struct{ data *identityData }

func (tx *identityTransaction) Attempt(id string) (identity.Attempt, bool) {
	if tx.data == nil {
		return identity.Attempt{}, false
	}
	a, ok := tx.data.attempts[id]
	return a, ok
}
func (tx *identityTransaction) PutAttempt(a identity.Attempt) {
	if tx.data != nil {
		tx.data.attempts[a.ID] = a
	}
}
func (tx *identityTransaction) DeleteAttempt(id string) {
	if tx.data != nil {
		delete(tx.data.attempts, id)
	}
}
func (tx *identityTransaction) UserBySubject(subject string) (identity.User, bool) {
	if tx.data == nil {
		return identity.User{}, false
	}
	return tx.User(tx.data.subjects[subject])
}
func (tx *identityTransaction) User(id string) (identity.User, bool) {
	if tx.data == nil {
		return identity.User{}, false
	}
	u, ok := tx.data.users[id]
	return u, ok
}
func (tx *identityTransaction) PutUser(subject string, u identity.User) error {
	if tx.data == nil {
		return identity.ErrConflict
	}
	if id, ok := tx.data.subjects[subject]; ok && id != u.ID {
		return identity.ErrConflict
	}
	if _, ok := tx.data.users[u.ID]; ok && tx.data.subjects[subject] != u.ID {
		return identity.ErrConflict
	}
	tx.data.users[u.ID] = u
	tx.data.subjects[subject] = u.ID
	return nil
}
func (tx *identityTransaction) Session(hash string) (identity.Session, bool) {
	if tx.data == nil {
		return identity.Session{}, false
	}
	s, ok := tx.data.sessions[hash]
	return s, ok
}
func (tx *identityTransaction) PutSession(s identity.Session) {
	if tx.data != nil {
		tx.data.sessions[s.SecretHash] = s
	}
}
func (tx *identityTransaction) DeleteSession(hash string) {
	if tx.data != nil {
		delete(tx.data.sessions, hash)
	}
}
func (tx *identityTransaction) Cleanup(now time.Time) identity.CleanupCount {
	var result identity.CleanupCount
	if tx.data == nil {
		return result
	}
	for id, a := range tx.data.attempts {
		if !now.Before(a.ExpiresAt) || (a.Status == "provider_verified" && !now.Before(a.HandoffExpiresAt)) {
			delete(tx.data.attempts, id)
			result.Attempts++
		}
	}
	for hash, s := range tx.data.sessions {
		if !now.Before(s.ExpiresAt) {
			delete(tx.data.sessions, hash)
			result.Sessions++
		}
	}
	return result
}
