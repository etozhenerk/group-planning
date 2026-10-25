package postgres

import (
	"context"
	"crypto/sha256"
	_ "embed"
	"fmt"

	"github.com/jackc/pgx/v5"
)

//go:embed migrations/001_initial.sql
var initialSchema string

//go:embed migrations/002_account_deletion.sql
var accountDeletionSchema string

//go:embed migrations/003_meeting_experience.sql
var meetingExperienceSchema string

var migrations = []string{initialSchema, accountDeletionSchema, meetingExperienceSchema}

func migrationChecksum(version int) string {
	return fmt.Sprintf("%x", sha256.Sum256([]byte(migrations[version-1])))
}
func schemaChecksum() string { return migrationChecksum(1) }

// Migrate applies the embedded schema atomically using a separate DDL identity.
// Existing checksums must match; there is no destructive down migration.
func (db *Database) Migrate(ctx context.Context) error {
	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return ErrUnavailable
	}
	defer tx.Rollback(context.Background())
	if _, err = tx.Exec(ctx, "SELECT pg_advisory_xact_lock(19372001)"); err != nil {
		return ErrUnavailable
	}

	if _, err = tx.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
		version integer PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`); err != nil {
		return ErrUnavailable
	}

	rows, err := tx.Query(ctx, "SELECT version, checksum FROM schema_migrations ORDER BY version")
	if err != nil {
		return ErrUnavailable
	}

	applied := 0
	for rows.Next() {
		var version int
		var checksum string
		if rows.Scan(&version, &checksum) != nil || version != applied+1 || version > len(migrations) || checksum != migrationChecksum(version) {
			rows.Close()
			return fmt.Errorf("unsupported schema version or migration checksum")
		}

		applied++
	}

	rows.Close()
	if rows.Err() != nil {
		return ErrUnavailable
	}

	for version := applied + 1; version <= len(migrations); version++ {
		if _, err = tx.Exec(ctx, migrations[version-1], pgx.QueryExecModeSimpleProtocol); err != nil {
			return ErrUnavailable
		}

		if _, err = tx.Exec(ctx, "INSERT INTO schema_migrations (version,checksum) VALUES ($1,$2)", version, migrationChecksum(version)); err != nil {
			return ErrUnavailable
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return ErrUnavailable
	}

	return nil
}
