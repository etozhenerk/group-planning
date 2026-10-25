package memory

import (
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

func (tx *identityTransaction) UserSubject(id string) (string, bool) {
	if tx.data == nil {
		return "", false
	}

	for subject, userID := range tx.data.subjects {
		if userID == id {
			return subject, true
		}
	}

	return "", false
}

func (tx *identityTransaction) DeleteUser(id string) {
	if tx.data == nil {
		return
	}

	delete(tx.data.users, id)
	for subject, userID := range tx.data.subjects {
		if userID == id {
			delete(tx.data.subjects, subject)
		}
	}

	for hash, session := range tx.data.sessions {
		if session.UserID == id {
			delete(tx.data.sessions, hash)
		}
	}

	for key, attempt := range tx.data.attempts {
		if attempt.UserID == id {
			delete(tx.data.attempts, key)
		}
	}
}

func (tx *identityTransaction) DeletionReceipt(hash string) (identity.DeletionReceipt, bool) {
	if tx.data == nil {
		return identity.DeletionReceipt{}, false
	}

	receipt, ok := tx.data.deletions[hash]

	return receipt, ok
}

func (tx *identityTransaction) PutDeletionReceipt(receipt identity.DeletionReceipt) {
	if tx.data != nil {
		tx.data.deletions[receipt.Hash] = receipt
	}
}

func (tx *identityTransaction) SubjectFence(hash string) (time.Time, bool) {
	if tx.data == nil {
		return time.Time{}, false
	}

	at, ok := tx.data.fences[hash]

	return at, ok
}

func (tx *identityTransaction) PutSubjectFence(hash string, at time.Time) {
	if tx.data != nil {
		tx.data.fences[hash] = at
	}
}
