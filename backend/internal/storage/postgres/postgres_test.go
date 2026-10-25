package postgres

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"os"
	"reflect"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

// This suite requires a disposable cloud database owned by the test OS role.
// It never connects to the production database or starts a local database.
func integrationDB(t *testing.T) *Database {
	t.Helper()
	dsn := os.Getenv("SOMEWHERE_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("cloud integration database is not configured")
	}

	db, err := Open(t.Context(), dsn)
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(db.Close)
	if db.pool.Config().ConnConfig.Database != "somewhere_integration" {
		t.Fatal("refusing non-test database")
	}

	if err := db.Migrate(t.Context()); err != nil {
		t.Fatal(err)
	}

	if err := db.Migrate(t.Context()); err != nil {
		t.Fatal("migration replay", err)
	}

	if err := db.Check(t.Context()); err != nil {
		t.Fatal(err)
	}

	return db
}

func TestPersistenceAndAtomicity(t *testing.T) {
	db := integrationDB(t)
	ctx := t.Context()
	key := fmt.Sprintf("%x-%x-%x-%x-%x", randBytes(4), randBytes(2), randBytes(2), randBytes(2), randBytes(6))
	now := time.Now().UTC().Truncate(time.Microsecond)
	app := meetings.NewService(db.Meetings(), func() time.Time { return now })
	created, err := app.Create(ctx, meetings.Actor{ID: key, Name: "Persistence test"}, meetings.CreateInput{Title: "Cloud integration", StartsOn: now.AddDate(0, 0, 1).Format(time.DateOnly), Timezone: "Europe/Moscow"}, key)
	if err != nil {
		t.Fatal("create with deferred job", err)
	}

	_ = created
	var id string
	err = db.Meetings().View(ctx, func(r meetings.Reader) error {
		all, err := r.Meetings()
		if err != nil {
			return err
		}

		for _, m := range all {
			if m.OrganizerID == key {
				id = m.ID
			}
		}

		return nil
	})
	if err != nil || id == "" {
		t.Fatal("missing created meeting", err)
	}

	cover := meetings.Cover{MeetingID: id, Version: key, Data: []byte("persisted-image"), MediaType: "image/png", Width: 1, Height: 1}
	err = db.Meetings().Update(ctx, func(w meetings.Writer) error {
		if err := w.SaveRSVP(meetings.RSVP{MeetingID: id, UserID: key, Answer: meetings.Going, Revision: 1, UpdatedAt: now}); err != nil {
			return err
		}

		if err := w.SaveCover(cover); err != nil {
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

	err = db.Identity().Update(ctx, func(r identity.Records) error {
		if err := r.PutUser(key, identity.User{ID: key, DisplayName: "Persistence test", CreatedAt: now}); err != nil {
			return err
		}

		r.PutSession(identity.Session{ID: key, UserID: key, SecretHash: key, ExpiresAt: now.Add(time.Hour)})
		r.PutAttempt(identity.Attempt{ID: key, ExpiresAt: now.Add(time.Hour)})

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	other, err := Open(ctx, os.Getenv("SOMEWHERE_TEST_DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer other.Close()
	err = other.Meetings().View(ctx, func(r meetings.Reader) error {
		if _, err := r.RSVP(id, key); err != nil {
			return err
		}

		c, err := r.Cover(id)
		if err != nil {
			return err
		}

		if !reflect.DeepEqual(c, cover) {
			return errors.New("cover differs")
		}

		if _, err := r.DatePoll(key); err != nil {
			return err
		}

		if _, err := r.PlacePoll(key); err != nil {
			return err
		}

		if _, err := r.PreparationTask(key); err != nil {
			return err
		}

		if _, err := r.TransitionJob(id, 1); err != nil {
			return err
		}

		_, err = r.Receipt(meetings.RequestKey{UserID: key, Operation: "create", Key: key})

		return err
	})
	if err != nil {
		t.Fatal("independent pool persistence", err)
	}

	err = other.Identity().Update(ctx, func(r identity.Records) error {
		if _, ok := r.Session(key); !ok {
			return errors.New("session missing")
		}

		if _, ok := r.Attempt(key); !ok {
			return errors.New("attempt missing")
		}

		if _, ok := r.UserBySubject(key); !ok {
			return errors.New("user missing")
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	rollback := errors.New("rollback")
	err = db.Meetings().Update(ctx, func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: key}); err != nil {
			return err
		}

		return rollback
	})
	if !errors.Is(err, rollback) {
		t.Fatal(err)
	}

	err = other.Meetings().View(ctx, func(r meetings.Reader) error { _, err := r.Meeting(key); return err })
	if !errors.Is(err, meetings.ErrNotFound) {
		t.Fatal("rollback leaked", err)
	}

	var retained meetings.Reader
	err = db.Meetings().View(ctx, func(r meetings.Reader) error {
		retained = r
		return r.(meetings.Writer).SaveMeeting(meetings.Meeting{ID: key})
	})
	if !errors.Is(err, meetings.ErrReadOnly) {
		t.Fatal(err)
	}

	if _, err := retained.Meeting(id); !errors.Is(err, meetings.ErrTransactionClosed) {
		t.Fatal(err)
	}

	var wg sync.WaitGroup
	failures := make(chan error, 12)
	for i := 0; i < 12; i++ {
		wg.Go(func() {
			failures <- other.Meetings().Update(ctx, func(w meetings.Writer) error {
				_, err := w.AppendEntry(meetings.FeedEntry{ID: fmt.Sprintf("%s-%d", key, i), MeetingID: id, ActorID: key, Payload: []byte(`{}`)})
				return err
			})
		})
	}

	wg.Wait()
	close(failures)
	for err := range failures {
		if err != nil {
			t.Fatal(err)
		}
	}

	err = db.Meetings().View(ctx, func(r meetings.Reader) error {
		feed, err := r.Feed(id)
		if err != nil {
			return err
		}

		if len(feed) != 14 {
			return fmt.Errorf("feed count %d", len(feed))
		}

		for i, e := range feed {
			if e.Sequence != uint64(i+1) {
				return errors.New("non-contiguous sequence")
			}
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	cancelled, cancel := context.WithCancel(ctx)
	cancel()
	if err := db.Meetings().Update(cancelled, func(meetings.Writer) error { t.Fatal("cancelled callback ran"); return nil }); err == nil {
		t.Fatal("cancelled transaction succeeded")
	}
}

func TestIdentityFailureCannotBecomeUnauthenticated(t *testing.T) {
	db := integrationDB(t)
	err := db.Identity().Update(t.Context(), func(r identity.Records) error {
		tx := r.(*identityTransaction)
		_, _ = tx.exec("SELECT 1/0")
		_, _ = r.Session("not-a-session")

		return identity.ErrUnauthenticated
	})
	if !errors.Is(err, ErrUnavailable) {
		t.Fatal("SQL failure was masked", err)
	}
}

func TestMigrationChecksumGuard(t *testing.T) {
	db := integrationDB(t)
	ctx := t.Context()
	if _, err := db.pool.Exec(ctx, "UPDATE schema_migrations SET checksum='test-mismatch' WHERE version=1"); err != nil {
		t.Fatal(err)
	}

	defer func() {
		if _, err := db.pool.Exec(context.Background(), "UPDATE schema_migrations SET checksum=$1 WHERE version=1", schemaChecksum()); err != nil {
			t.Error(err)
		}
	}()
	if db.Check(ctx) == nil || db.Migrate(ctx) == nil {
		t.Fatal("accepted incompatible schema")
	}
}

func randBytes(n int) []byte { data := make([]byte, n); _, _ = rand.Read(data); return data }
