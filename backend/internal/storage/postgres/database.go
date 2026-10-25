// Package postgres persists application records using transactional PostgreSQL storage.
package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ErrUnavailable deliberately excludes connection strings, SQL and record values.
var ErrUnavailable = errors.New("persistent storage unavailable")

// Database owns a bounded pool shared by the two independent domain adapters.
type Database struct{ pool *pgxpool.Pool }

// Open connects through a pgx DSN. Unix sockets and verify-full TLS are supported.
func Open(ctx context.Context, dsn string) (*Database, error) {
	config, err := pgxpool.ParseConfig(dsn)
	if err != nil || dsn == "" {
		return nil, ErrUnavailable
	}

	config.MaxConns = 10
	config.MinConns = 1
	config.ConnConfig.ConnectTimeout = 5 * time.Second
	config.ConnConfig.RuntimeParams["statement_timeout"] = "5000"
	config.ConnConfig.RuntimeParams["lock_timeout"] = "3000"
	config.ConnConfig.RuntimeParams["idle_in_transaction_session_timeout"] = "30000"
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, ErrUnavailable
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, ErrUnavailable
	}

	return &Database{pool: pool}, nil
}

// Close releases all database connections after request and worker shutdown.
func (db *Database) Close() { db.pool.Close() }

// Check verifies both connectivity and the exact supported migration checksums.
func (db *Database) Check(ctx context.Context) error {
	rows, err := db.pool.Query(ctx, "SELECT version, checksum FROM schema_migrations ORDER BY version")
	if err != nil {
		return ErrUnavailable
	}
	defer rows.Close()
	count := 0
	for rows.Next() {
		var version int
		var checksum string
		if rows.Scan(&version, &checksum) != nil || version != 1 || checksum != schemaChecksum() {
			return ErrUnavailable
		}

		count++
	}

	if rows.Err() != nil || count != 1 {
		return ErrUnavailable
	}

	return nil
}
