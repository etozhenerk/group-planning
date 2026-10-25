package postgres

import (
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

func (tx *identityTransaction) UserSubject(id string) (string, bool) {
	value, err := one[string](tx.transaction, "SELECT to_jsonb(provider_subject) FROM identity_users WHERE id=$1", id)
	return value, err == nil
}

func (tx *identityTransaction) DeleteUser(id string) {
	for _, query := range []string{
		"DELETE FROM identity_sessions WHERE user_id=$1",
		"DELETE FROM identity_attempts WHERE document->>'UserID'=$1",
		"DELETE FROM identity_users WHERE id=$1",
	} {
		if _, err := tx.exec(query, id); err != nil {
			return
		}
	}
}

func (tx *identityTransaction) DeletionReceipt(hash string) (identity.DeletionReceipt, bool) {
	value, err := one[identity.DeletionReceipt](tx.transaction, "SELECT document FROM identity_deletion_receipts WHERE secret_hash=$1", hash)
	return value, err == nil
}

func (tx *identityTransaction) PutDeletionReceipt(value identity.DeletionReceipt) {
	_ = tx.save(value, `INSERT INTO identity_deletion_receipts(secret_hash,expires_at,document) VALUES($1,$2,$3)
	ON CONFLICT(secret_hash) DO UPDATE SET expires_at=EXCLUDED.expires_at,document=EXCLUDED.document`, value.Hash, value.ExpiresAt)
}

func (tx *identityTransaction) SubjectFence(hash string) (time.Time, bool) {
	value, err := one[time.Time](tx.transaction, "SELECT to_jsonb(deleted_at) FROM identity_subject_fences WHERE subject_hash=$1", hash)
	return value, err == nil
}

func (tx *identityTransaction) PutSubjectFence(hash string, at time.Time) {
	_, _ = tx.exec(`INSERT INTO identity_subject_fences(subject_hash,deleted_at) VALUES($1,$2)
	ON CONFLICT(subject_hash) DO UPDATE SET deleted_at=EXCLUDED.deleted_at`, hash, at)
}
