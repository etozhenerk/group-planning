package postgres

import (
	"context"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

// Identity implements atomic authentication records with a separate module lock.
type Identity struct{ db *Database }

// Identity returns an authentication adapter backed by the shared pool.
func (db *Database) Identity() *Identity { return &Identity{db: db} }

var _ identity.Store = (*Identity)(nil)

// Update commits all records together, including methods without an error result.
func (s *Identity) Update(ctx context.Context, fn func(identity.Records) error) error {
	return s.db.transact(ctx, true, 19372003, func(tx *transaction) error { return fn(&identityTransaction{tx}) })
}

type identityTransaction struct{ *transaction }

func (tx *identityTransaction) Attempt(id string) (identity.Attempt, bool) {
	value, err := one[identity.Attempt](tx.transaction, "SELECT document FROM identity_attempts WHERE id=$1", id)
	return value, err == nil
}

func (tx *identityTransaction) PutAttempt(value identity.Attempt) {
	var handoff *time.Time
	if value.Status == "provider_verified" {
		handoff = &value.HandoffExpiresAt
	}

	_ = tx.save(value, `INSERT INTO identity_attempts(id,expires_at,handoff_expires_at,document) VALUES($1,$2,$3,$4)
		ON CONFLICT(id) DO UPDATE SET expires_at=EXCLUDED.expires_at,handoff_expires_at=EXCLUDED.handoff_expires_at,document=EXCLUDED.document`, value.ID, value.ExpiresAt, handoff)
}

func (tx *identityTransaction) DeleteAttempt(id string) {
	_, _ = tx.exec("DELETE FROM identity_attempts WHERE id=$1", id)
}

func (tx *identityTransaction) UserBySubject(subject string) (identity.User, bool) {
	value, err := one[identity.User](tx.transaction, "SELECT document FROM identity_users WHERE provider_subject=$1", subject)
	return value, err == nil
}

func (tx *identityTransaction) User(id string) (identity.User, bool) {
	value, err := one[identity.User](tx.transaction, "SELECT document FROM identity_users WHERE id=$1", id)
	return value, err == nil
}

func (tx *identityTransaction) PutUser(subject string, value identity.User) error {
	previous, found := tx.UserBySubject(subject)
	if found && previous.ID != value.ID {
		return identity.ErrConflict
	}

	if _, exists := tx.User(value.ID); exists && !found {
		return identity.ErrConflict
	}

	return tx.save(value, `INSERT INTO identity_users(id,provider_subject,document) VALUES($1,$2,$3)
		ON CONFLICT(id) DO UPDATE SET document=EXCLUDED.document`, value.ID, subject)
}

func (tx *identityTransaction) Session(hash string) (identity.Session, bool) {
	value, err := one[identity.Session](tx.transaction, "SELECT document FROM identity_sessions WHERE secret_hash=$1", hash)
	return value, err == nil
}

func (tx *identityTransaction) PutSession(value identity.Session) {
	_ = tx.save(value, `INSERT INTO identity_sessions(secret_hash,id,user_id,expires_at,document) VALUES($1,$2,$3,$4,$5)
		ON CONFLICT(secret_hash) DO UPDATE SET id=EXCLUDED.id,user_id=EXCLUDED.user_id,expires_at=EXCLUDED.expires_at,document=EXCLUDED.document`, value.SecretHash, value.ID, value.UserID, value.ExpiresAt)
}

func (tx *identityTransaction) DeleteSession(hash string) {
	_, _ = tx.exec("DELETE FROM identity_sessions WHERE secret_hash=$1", hash)
}

func (tx *identityTransaction) Cleanup(now time.Time) identity.CleanupCount {
	_, _ = tx.exec("DELETE FROM identity_deletion_receipts WHERE expires_at <= $1", now)
	_, _ = tx.exec("DELETE FROM identity_subject_fences WHERE deleted_at <= $1", now.Add(-10*time.Minute))
	attempts, _ := tx.exec("DELETE FROM identity_attempts WHERE expires_at <= $1 OR handoff_expires_at <= $1", now)
	sessions, _ := tx.exec("DELETE FROM identity_sessions WHERE expires_at <= $1", now)

	return identity.CleanupCount{Attempts: int(attempts), Sessions: int(sessions)}
}
