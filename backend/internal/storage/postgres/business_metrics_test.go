package postgres

import (
	"errors"
	"fmt"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/jackc/pgx/v5"
)

func TestBusinessMetricsPersistenceAndPrivacy(t *testing.T) {
	db := integrationDB(t)
	ctx := t.Context()
	for range 2 {
		if err := db.EnableBusinessMetrics(ctx); err != nil {
			t.Fatal("enable and replay telemetry", err)
		}
	}

	if err := db.Check(ctx); err != nil {
		t.Fatal("telemetry must preserve application schema version 1", err)
	}

	read := func(name string) float64 {
		t.Helper()
		var value float64
		if err := db.pool.QueryRow(ctx, "SELECT value FROM observability.business_metrics WHERE metric=$1", name).Scan(&value); err != nil {
			t.Fatal(err)
		}

		return value
	}
	before := read("logins_total")
	today := read("logins_today")
	key := fmt.Sprintf("business-%x", randBytes(16))
	makeSession := func(hash string, rollback bool) error {
		return db.Identity().Update(ctx, func(r identity.Records) error {
			if err := r.PutUser(key, identity.User{ID: key, DisplayName: "Private test name"}); err != nil {
				return err
			}

			r.PutSession(identity.Session{ID: hash, SecretHash: hash, UserID: key, ClientKind: "web", ExpiresAt: time.Now().Add(time.Hour)})
			if rollback {
				return errors.New("intentional rollback")
			}

			return nil
		})
	}
	for range 2 {
		if err := makeSession(key, false); err != nil {
			t.Fatal(err)
		}
	}

	if makeSession(key+"-rollback", true) == nil || read("logins_total") != before+1 {
		t.Fatal("upsert or rollback changed successful login count")
	}

	if err := db.Identity().Update(ctx, func(r identity.Records) error { r.DeleteSession(key); return nil }); err != nil {
		t.Fatal(err)
	}

	var wait sync.WaitGroup
	for i := range 5 {
		wait.Go(func() {
			if err := makeSession(fmt.Sprintf("%s-%d", key, i), false); err != nil {
				t.Error(err)
			}
		})
	}

	wait.Wait()
	if read("logins_total") != before+6 || read("logins_today") != today+6 || read("tracking_started_timestamp_seconds") <= 0 {
		t.Fatal("logout or concurrent logins lost persisted accounting")
	}

	if err := db.Identity().Update(ctx, func(r identity.Records) error {
		r.PutSession(identity.Session{ID: key + "-expired", SecretHash: key + "-expired", UserID: key, ClientKind: "web", ExpiresAt: time.Now().Add(-time.Hour)})
		r.Cleanup(time.Now())

		return nil
	}); err != nil || read("logins_total") != before+7 {
		t.Fatal("cleanup lost persisted login count", err)
	}

	// Yesterday's aggregate contributes to the total but not today's UTC count.
	tx, err := db.pool.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, `SET LOCAL TIME ZONE 'Pacific/Auckland';
		INSERT INTO observability.login_daily(day,successful_logins)
		VALUES ((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date - 1, 7)
		ON CONFLICT(day) DO UPDATE SET successful_logins=observability.login_daily.successful_logins+7`, pgx.QueryExecModeSimpleProtocol); err != nil {
		t.Fatal(err)
	}

	var totalUTC, todayUTC float64
	if err = tx.QueryRow(ctx, "SELECT value FROM observability.business_metrics WHERE metric='logins_total'").Scan(&totalUTC); err != nil {
		t.Fatal(err)
	}

	if err = tx.QueryRow(ctx, "SELECT value FROM observability.business_metrics WHERE metric='logins_today'").Scan(&todayUTC); err != nil || totalUTC != before+14 || todayUTC != today+7 {
		t.Fatal("UTC day changed with session timezone", err)
	}

	if err = tx.Rollback(ctx); err != nil {
		t.Fatal(err)
	}

	reopened, err := Open(ctx, os.Getenv("SOMEWHERE_TEST_DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	var persisted float64
	if err = reopened.pool.QueryRow(ctx, "SELECT value FROM observability.business_metrics WHERE metric='logins_total'").Scan(&persisted); err != nil || persisted != before+7 {
		t.Fatal("reopening lost counters", err)
	}

	var canReadView, canReadUsers, canReadCounters bool
	if err = db.pool.QueryRow(ctx, `SELECT
		has_table_privilege('somewhere_metrics','observability.business_metrics','SELECT'),
		has_table_privilege('somewhere_metrics','public.identity_users','SELECT'),
		has_table_privilege('somewhere_metrics','observability.login_daily','SELECT')`).Scan(&canReadView, &canReadUsers, &canReadCounters); err != nil || !canReadView || canReadUsers || canReadCounters {
		t.Fatal("exporter must only read aggregate view", err)
	}

	var checksum string
	if err = db.pool.QueryRow(ctx, "SELECT checksum FROM observability.installations WHERE component='business-v1'").Scan(&checksum); err != nil {
		t.Fatal(err)
	}

	if _, err = db.pool.Exec(ctx, "UPDATE observability.installations SET checksum='invalid' WHERE component='business-v1'"); err != nil {
		t.Fatal(err)
	}

	defer db.pool.Exec(ctx, "UPDATE observability.installations SET checksum=$1 WHERE component='business-v1'", checksum)
	if db.EnableBusinessMetrics(ctx) == nil {
		t.Fatal("changed migration checksum accepted")
	}
}
