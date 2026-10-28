package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/support"
)

// Support persists accepted feedback, rate limits and delivery leases together.
type Support struct{ db *Database }

// Support returns an independent domain adapter backed by this database.
func (db *Database) Support() *Support { return &Support{db: db} }

var _ support.Store = (*Support)(nil)

// Update serializes bounded queue changes across API and worker processes.
// Telegram requests are performed by the service after this transaction commits.
func (s *Support) Update(ctx context.Context, fn func(support.Records) error) error {
	return s.db.transact(ctx, true, 19372008, func(tx *transaction) error {
		return fn(&supportTransaction{tx})
	})
}

type supportTransaction struct{ *transaction }

func (tx *supportTransaction) ByKey(key string) (support.Feedback, bool, error) {
	value, err := one[support.Feedback](tx.transaction, "SELECT document FROM support_feedback WHERE request_key=$1", key)
	if errors.Is(err, meetings.ErrNotFound) {
		return support.Feedback{}, false, nil
	}

	return value, err == nil, err
}

func (tx *supportTransaction) All() ([]support.Feedback, error) {
	return many[support.Feedback](tx.transaction, "SELECT document FROM support_feedback ORDER BY created_at,id")
}

func (tx *supportTransaction) Put(value support.Feedback) error {
	return tx.save(value, `INSERT INTO support_feedback(request_key,id,created_at,document) VALUES($1,$2,$3,$4)
		ON CONFLICT(request_key) DO UPDATE SET created_at=EXCLUDED.created_at,document=EXCLUDED.document`, value.Key, value.ID, value.CreatedAt)
}

func (tx *supportTransaction) Rate(key string) (support.RateWindow, bool, error) {
	value, err := one[support.RateWindow](tx.transaction, "SELECT document FROM support_rate_windows WHERE source_key=$1", key)
	if errors.Is(err, meetings.ErrNotFound) {
		return support.RateWindow{}, false, nil
	}

	return value, err == nil, err
}

func (tx *supportTransaction) PutRate(value support.RateWindow) error {
	return tx.save(value, `INSERT INTO support_rate_windows(source_key,expires_at,document) VALUES($1,$2,$3)
		ON CONFLICT(source_key) DO UPDATE SET expires_at=EXCLUDED.expires_at,document=EXCLUDED.document`, value.Key, value.ExpiresAt)
}

func (tx *supportTransaction) PruneRates(now time.Time) error {
	_, err := tx.exec("DELETE FROM support_rate_windows WHERE expires_at <= $1", now)
	return err
}

func (tx *supportTransaction) PruneFeedback(before time.Time) error {
	_, err := tx.exec("DELETE FROM support_feedback WHERE created_at <= $1", before)
	return err
}
