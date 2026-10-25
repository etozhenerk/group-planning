package postgres

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestAccountDeletionAtomicityAndPersistence(t *testing.T) {
	db := integrationDB(t)
	ctx := t.Context()
	key := fmt.Sprintf("account-%x", randBytes(16))
	now := time.Now().UTC().Truncate(time.Microsecond)
	app := meetings.NewService(db.Meetings(), func() time.Time { return now })
	created, err := app.Create(ctx, meetings.Actor{ID: key, Name: "Private account"}, meetings.CreateInput{Title: "Deletion integration", StartsOn: now.AddDate(0, 0, 1).Format(time.DateOnly), Timezone: "Europe/Moscow"}, fmt.Sprintf("%x-%x-%x-%x-%x", randBytes(4), randBytes(2), randBytes(2), randBytes(2), randBytes(6)))
	if err != nil {
		t.Fatal(err)
	}

	id := created.Details.Meeting.ID
	err = db.Identity().Update(ctx, func(r identity.Records) error {
		if err := r.PutUser(key, identity.User{ID: key, DisplayName: "Private account", CreatedAt: now}); err != nil {
			return err
		}

		r.PutSession(identity.Session{ID: key, UserID: key, SecretHash: key, ClientKind: "ios", ExpiresAt: now.Add(time.Hour)})
		r.PutAttempt(identity.Attempt{ID: key, UserID: key, ExpiresAt: now.Add(time.Minute)})

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	err = db.Meetings().Update(ctx, func(w meetings.Writer) error {
		if err := w.SaveCover(meetings.Cover{MeetingID: id, Version: key, Data: []byte("test")}); err != nil {
			return err
		}

		if err := w.SaveDatePoll(meetings.DatePoll{ID: key, MeetingID: id}); err != nil {
			return err
		}

		if err := w.SavePlacePoll(meetings.PlacePoll{ID: key, MeetingID: id}); err != nil {
			return err
		}

		return w.SavePreparationTask(meetings.PreparationTask{ID: key, MeetingID: id})
	})
	if err != nil {
		t.Fatal(err)
	}

	stop := errors.New("rollback account transaction")
	remove := func(rollback bool) error {
		return db.Identity().AccountUpdate(ctx, db.Meetings(), func(a identity.Store, m meetings.Store) error {
			if err := meetings.NewService(m, func() time.Time { return now }).RemoveAccount(ctx, key); err != nil {
				return err
			}

			if err := a.Update(ctx, func(r identity.Records) error {
				subject, ok := r.UserSubject(key)
				if !ok || subject != key {
					return errors.New("missing provider mapping")
				}

				r.DeleteUser(key)
				r.PutSubjectFence(key, now)
				r.PutDeletionReceipt(identity.DeletionReceipt{Hash: key, ClientKind: "ios", ExpiresAt: now.Add(24 * time.Hour)})

				return nil
			}); err != nil {
				return err
			}

			if rollback {
				return stop
			}

			return nil
		})
	}
	if !errors.Is(remove(true), stop) {
		t.Fatal("rollback error lost")
	}

	if _, err := app.Details(ctx, meetings.Actor{ID: key, Name: "Private account"}, id); err != nil {
		t.Fatal("meeting did not roll back", err)
	}

	err = db.Identity().Update(ctx, func(r identity.Records) error {
		if _, ok := r.User(key); !ok {
			return errors.New("identity did not roll back")
		}

		if _, ok := r.DeletionReceipt(key); ok {
			return errors.New("rollback left completion receipt")
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	if err := remove(false); err != nil {
		t.Fatal(err)
	}

	// Reopen through another pool to prove committed persistence, not cached state.
	config := db.pool.Config().Copy()
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		t.Fatal(err)
	}

	other := &Database{pool: pool}
	defer other.Close()
	err = other.Identity().Update(ctx, func(r identity.Records) error {
		if _, ok := r.User(key); ok {
			return errors.New("profile retained")
		}

		if _, ok := r.UserBySubject(key); ok {
			return errors.New("provider mapping retained")
		}

		if _, ok := r.Session(key); ok {
			return errors.New("session retained")
		}

		if _, ok := r.Attempt(key); ok {
			return errors.New("handoff retained")
		}

		receipt, ok := r.DeletionReceipt(key)
		if !ok || receipt.ClientKind != "ios" {
			return errors.New("receipt missing")
		}

		fence, ok := r.SubjectFence(key)
		if !ok || !fence.Equal(now) {
			return errors.New("fence missing")
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	err = other.Meetings().View(ctx, func(r meetings.Reader) error {
		removed, err := r.UserRemoved(key)
		if err != nil {
			return err
		}

		if !removed {
			return errors.New("stale actor fence missing")
		}

		_, err = r.Meeting(id)
		if !errors.Is(err, meetings.ErrNotFound) {
			return errors.New("meeting retained")
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	for _, table := range []string{"invitations", "rsvps", "feed_entries", "transition_jobs", "date_polls", "place_polls", "preparation_tasks", "meeting_covers"} {
		var count int
		if err := other.pool.QueryRow(ctx, "SELECT count(*) FROM "+pgx.Identifier{table}.Sanitize()+" WHERE meeting_id=$1", id).Scan(&count); err != nil || count != 0 {
			t.Fatalf("child %s retained: count=%d err=%v", table, count, err)
		}
	}

	err = other.Identity().Update(ctx, func(r identity.Records) error {
		r.Cleanup(now.Add(25 * time.Hour))
		if _, ok := r.DeletionReceipt(key); ok {
			return errors.New("receipt not expired")
		}

		if _, ok := r.SubjectFence(key); ok {
			return errors.New("fence not expired")
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestAccountMigrationUpgradesVersionOne(t *testing.T) {
	db := integrationDB(t)
	ctx := t.Context()
	schema := fmt.Sprintf("account_upgrade_%x", randBytes(8))
	quoted := pgx.Identifier{schema}.Sanitize()
	if _, err := db.pool.Exec(ctx, "CREATE SCHEMA "+quoted); err != nil {
		t.Fatal(err)
	}

	defer func() {
		if _, err := db.pool.Exec(context.Background(), "DROP SCHEMA "+quoted+" CASCADE"); err != nil {
			t.Error(err)
		}
	}()
	config := db.pool.Config().Copy()
	config.ConnConfig.RuntimeParams["search_path"] = schema
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		t.Fatal(err)
	}

	upgrade := &Database{pool: pool}
	defer upgrade.Close()
	if _, err := pool.Exec(ctx, initialSchema, pgx.QueryExecModeSimpleProtocol); err != nil {
		t.Fatal(err)
	}

	if _, err := pool.Exec(ctx, "CREATE TABLE schema_migrations(version integer PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())"); err != nil {
		t.Fatal(err)
	}

	if _, err := pool.Exec(ctx, "INSERT INTO schema_migrations(version,checksum) VALUES(1,$1)", migrationChecksum(1)); err != nil {
		t.Fatal(err)
	}

	err = upgrade.Identity().Update(ctx, func(r identity.Records) error {
		return r.PutUser("existing", identity.User{ID: "existing", DisplayName: "Unchanged"})
	})
	if err != nil {
		t.Fatal(err)
	}

	if upgrade.Check(ctx) == nil {
		t.Fatal("version 1 accepted before migration")
	}

	for range 2 {
		if err := upgrade.Migrate(ctx); err != nil {
			t.Fatal(err)
		}
	}

	if err := upgrade.Check(ctx); err != nil {
		t.Fatal(err)
	}

	err = upgrade.Identity().Update(ctx, func(r identity.Records) error {
		user, ok := r.UserBySubject("existing")
		if !ok || user.DisplayName != "Unchanged" {
			return errors.New("upgrade changed existing profile")
		}

		r.PutDeletionReceipt(identity.DeletionReceipt{Hash: "new", ClientKind: "web", ExpiresAt: time.Now().Add(time.Hour)})

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}
