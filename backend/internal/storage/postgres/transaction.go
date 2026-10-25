package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"sync"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// Store implements the meeting transaction port without depending on HTTP.
type Store struct{ db *Database }

// Meetings returns the domain adapter sharing this database's pool.
func (db *Database) Meetings() *Store { return &Store{db: db} }

var _ meetings.Store = (*Store)(nil)

type transaction struct {
	mu       sync.Mutex
	ctx      context.Context
	tx       pgx.Tx
	writable bool
	closed   bool
	err      error
}

func (s *Store) View(ctx context.Context, fn func(meetings.Reader) error) error {
	return s.db.transact(ctx, false, 0, func(tx *transaction) error { return fn(tx) })
}

func (s *Store) Update(ctx context.Context, fn func(meetings.Writer) error) error {
	return s.db.transact(ctx, true, 19372002, func(tx *transaction) error { return fn(tx) })
}

func (db *Database) transact(ctx context.Context, write bool, lock int64, fn func(*transaction) error) error {
	options := pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly}
	if write {
		options = pgx.TxOptions{IsoLevel: pgx.ReadCommitted, AccessMode: pgx.ReadWrite}
	}

	connection, err := db.pool.BeginTx(ctx, options)
	if err != nil {
		return ErrUnavailable
	}
	defer connection.Rollback(context.Background())
	tx := &transaction{ctx: ctx, tx: connection, writable: write}
	defer tx.close()
	if write {
		if _, err = connection.Exec(ctx, "SELECT pg_advisory_xact_lock($1)", lock); err != nil {
			return ErrUnavailable
		}
	}

	callbackErr := fn(tx)
	tx.close()
	if tx.err != nil {
		return tx.err
	}

	if callbackErr != nil {
		return callbackErr
	}

	if ctx.Err() != nil {
		return ctx.Err()
	}

	if err = connection.Commit(ctx); err != nil {
		return storageError(err)
	}

	return nil
}

func (tx *transaction) close() { tx.mu.Lock(); defer tx.mu.Unlock(); tx.closed = true }

func (tx *transaction) check(write bool) error {
	if tx.closed {
		return meetings.ErrTransactionClosed
	}

	if write && !tx.writable {
		return meetings.ErrReadOnly
	}

	if tx.err != nil {
		return tx.err
	}

	return tx.ctx.Err()
}

func storageError(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return meetings.ErrNotFound
	}

	var postgresError *pgconn.PgError
	if errors.As(err, &postgresError) {
		switch postgresError.Code {
		case "23505":
			return meetings.ErrAlreadyExists
		case "23503":
			return meetings.ErrNotFound
		case "23514", "23502":
			return meetings.ErrInvalidRecord
		}
	}

	return ErrUnavailable
}

func one[T any](tx *transaction, query string, args ...any) (T, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	var value T
	if err := tx.check(false); err != nil {
		return value, err
	}

	var data []byte
	if err := tx.tx.QueryRow(tx.ctx, query, args...).Scan(&data); err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			tx.err = storageError(err)
		}

		return value, storageError(err)
	}

	if json.Unmarshal(data, &value) != nil {
		tx.err = ErrUnavailable
		return value, tx.err
	}

	return value, nil
}

func many[T any](tx *transaction, query string, args ...any) ([]T, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	rows, err := tx.tx.Query(tx.ctx, query, args...)
	if err != nil {
		tx.err = storageError(err)
		return nil, tx.err
	}
	defer rows.Close()
	result := []T{}
	for rows.Next() {
		var data []byte
		var value T
		if rows.Scan(&data) != nil || json.Unmarshal(data, &value) != nil {
			tx.err = ErrUnavailable
			return nil, tx.err
		}

		result = append(result, value)
	}

	if rows.Err() != nil {
		tx.err = ErrUnavailable
		return nil, tx.err
	}

	return result, nil
}

func (tx *transaction) exec(query string, args ...any) (int64, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return 0, err
	}

	result, err := tx.tx.Exec(tx.ctx, query, args...)
	if err != nil {
		tx.err = storageError(err)
		return 0, tx.err
	}

	return result.RowsAffected(), nil
}

func (tx *transaction) save(value any, query string, args ...any) error {
	data, err := json.Marshal(value)
	if err != nil {
		return meetings.ErrInvalidRecord
	}

	_, err = tx.exec(query, append(args, data)...)

	return err
}
