package postgres

import (
	"context"
	"crypto/sha256"
	_ "embed"
	"fmt"

	"github.com/jackc/pgx/v5"
)

//go:embed operations/001_business_metrics.sql
var businessMetricsSchema string

// EnableBusinessMetrics installs optional aggregate telemetry using the DDL role.
// It leaves application schema version 1 compatible with earlier API releases.
func (db *Database) EnableBusinessMetrics(ctx context.Context) error {
	if err := db.Check(ctx); err != nil {
		return err
	}

	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return ErrUnavailable
	}
	defer tx.Rollback(context.Background())
	if _, err = tx.Exec(ctx, `SELECT pg_advisory_xact_lock(19372004);
		CREATE SCHEMA IF NOT EXISTS observability;
		CREATE TABLE IF NOT EXISTS observability.installations (
			component text PRIMARY KEY, checksum text NOT NULL,
			installed_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`, pgx.QueryExecModeSimpleProtocol); err != nil {
		return ErrUnavailable
	}

	checksum := fmt.Sprintf("%x", sha256.Sum256([]byte(businessMetricsSchema)))
	var stored string
	err = tx.QueryRow(ctx, "SELECT checksum FROM observability.installations WHERE component='business-v1'").Scan(&stored)
	switch {
	case err == pgx.ErrNoRows:
		if _, err = tx.Exec(ctx, businessMetricsSchema, pgx.QueryExecModeSimpleProtocol); err != nil {
			return ErrUnavailable
		}

		if _, err = tx.Exec(ctx, "INSERT INTO observability.installations(component,checksum) VALUES ('business-v1',$1)", checksum); err != nil {
			return ErrUnavailable
		}
	case err != nil:
		return ErrUnavailable
	case stored != checksum:
		return fmt.Errorf("business metrics migration checksum mismatch")
	}

	if err = tx.Commit(ctx); err != nil {
		return ErrUnavailable
	}

	return nil
}
