package postgres

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"reflect"
	"sort"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/accounts"
	"github.com/etozhenerk/group-planning/backend/internal/httpapi"
	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type coordinatorUnusedProvider struct{}

func (coordinatorUnusedProvider) AuthorizationURL(string, string) string { return "" }
func (coordinatorUnusedProvider) Verify(context.Context, string, string) (identity.Profile, error) {
	return identity.Profile{}, errors.New("synthetic provider must not be called")
}
func coordinatorHash(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}
func coordinatorSecret() string { return base64.RawURLEncoding.EncodeToString(randBytes(32)) }
func coordinatorID() string {
	return fmt.Sprintf("%x-%x-%x-%x-%x", randBytes(4), randBytes(2), randBytes(2), randBytes(2), randBytes(6))
}

// Snapshot includes every public business table, including rows that should have
// been changed by the first meeting and partial second-meeting deletion.
func coordinatorSnapshot(t *testing.T, db *Database) map[string]string {
	t.Helper()
	rows, err := db.pool.Query(t.Context(), `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename<>'schema_migrations' ORDER BY tablename`)
	if err != nil {
		t.Fatal(err)
	}
	tables := []string{}
	for rows.Next() {
		var name string
		if err = rows.Scan(&name); err != nil {
			t.Fatal(err)
		}
		tables = append(tables, name)
	}
	rows.Close()
	if err = rows.Err(); err != nil {
		t.Fatal(err)
	}
	out := map[string]string{}
	for _, name := range tables {
		var fingerprint string
		var count int64
		query := fmt.Sprintf(`SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text)::text,'[]')),count(*) FROM %s t`, pgx.Identifier{"public", name}.Sanitize())
		if err = db.pool.QueryRow(t.Context(), query).Scan(&fingerprint, &count); err != nil {
			t.Fatal(err)
		}
		out[name] = fmt.Sprintf("rows=%d md5=%s", count, fingerprint)
	}
	return out
}

func TestIndependentCoordinatorSecondMeetingSQLRollback(t *testing.T) {
	db := integrationDB(t)
	ctx := t.Context()
	now := time.Now().UTC().Truncate(time.Microsecond)
	var clock atomic.Int64
	clock.Store(now.UnixNano())
	currentTime := func() time.Time { return time.Unix(0, clock.Load()) }
	user := coordinatorID()
	subject := "synthetic-coordinator-" + user
	sessionA, sessionB, operationToken := coordinatorSecret(), coordinatorSecret(), coordinatorSecret()
	attempt := "synthetic-handoff-" + user
	err := db.Identity().Update(ctx, func(r identity.Records) error {
		if err := r.PutUser(subject, identity.User{ID: user, DisplayName: "Synthetic private owner", CreatedAt: now}); err != nil {
			return err
		}
		for i, token := range []string{sessionA, sessionB} {
			r.PutSession(identity.Session{ID: fmt.Sprintf("session-%d-%s", i, user), UserID: user, SecretHash: coordinatorHash(token), ClientKind: "ios", ExpiresAt: now.Add(time.Hour)})
		}
		r.PutAttempt(identity.Attempt{ID: attempt, UserID: user, ExpiresAt: now.Add(time.Minute)})
		return nil
	})
	requireChatSQL(t, err)
	auth, err := identity.New(identity.Config{PublicOrigin: "https://coordinator.example.test", SessionTTL: time.Hour}, db.Identity(), coordinatorUnusedProvider{}, currentTime, func(context.Context, string) (bool, error) { return false, nil })
	requireChatSQL(t, err)
	app := meetings.NewService(db.Meetings(), currentTime)
	ids := []string{}
	for i := 0; i < 2; i++ {
		created, err := app.Create(ctx, meetings.Actor{ID: user, Name: "Synthetic private owner"}, meetings.CreateInput{Title: fmt.Sprintf("Synthetic rollback meeting%d", i), StartsOn: now.AddDate(0, 0, 1).Format(time.DateOnly), Timezone: "Europe/Moscow"}, coordinatorID())
		requireChatSQL(t, err)
		id := created.Details.Meeting.ID
		ids = append(ids, id)
		messageKey := coordinatorID()
		_, err = app.SendMessage(ctx, meetings.Actor{ID: user, Name: "Synthetic private owner"}, id, "Synthetic private history", messageKey, messageKey)
		requireChatSQL(t, err)
		requireChatSQL(t, db.Meetings().Update(ctx, func(w meetings.Writer) error {
			if err := w.SaveCover(meetings.Cover{MeetingID: id, Version: "synthetic", Data: []byte("synthetic-cover")}); err != nil {
				return err
			}
			if err := w.SavePreparationTask(meetings.PreparationTask{ID: coordinatorID(), MeetingID: id}); err != nil {
				return err
			}
			return nil
		}))
	}
	sort.Strings(ids)
	// This nontransactional sequence is an observation channel only. Business data
	// stays transactional; its increment proves the first DELETE already happened.
	_, err = db.pool.Exec(ctx, `CREATE SEQUENCE qa_coordinator_second_seen`)
	requireChatSQL(t, err)
	trigger := fmt.Sprintf(`CREATE FUNCTION qa_coordinator_fail_second() RETURNS trigger LANGUAGE plpgsql AS $body$
 BEGIN
 IF OLD.id='%s' THEN
  IF EXISTS(SELECT 1 FROM meetings WHERE id='%s') THEN
   RAISE EXCEPTION 'synthetic fixture order not reached' USING ERRCODE='P0002';
  END IF;
  PERFORM nextval('qa_coordinator_second_seen');
  RAISE EXCEPTION 'synthetic second meeting SQL failure' USING ERRCODE='P0001';
 END IF;
 RETURN OLD;
 END $body$`, ids[1], ids[0])
	_, err = db.pool.Exec(ctx, trigger)
	requireChatSQL(t, err)
	_, err = db.pool.Exec(ctx, `CREATE TRIGGER qa_coordinator_second_fault BEFORE DELETE ON meetings FOR EACH ROW EXECUTE FUNCTION qa_coordinator_fail_second()`)
	requireChatSQL(t, err)
	before := coordinatorSnapshot(t, db)
	var revoked atomic.Int32
	coordinator := accounts.New(func(ctx context.Context, fn func(accounts.Identity, accounts.Meetings) error) error {
		return db.Identity().AccountUpdate(ctx, db.Meetings(), func(a identity.Store, m meetings.Store) error {
			return fn(auth.WithStore(a), meetings.NewService(m, currentTime))
		})
	}, func(id string) {
		if id != user {
			t.Error("wrong revoked user")
		}
		revoked.Add(1)
		auth.AccountDeleted(id)
	})
	server := httptest.NewServer(httpapi.NewWithRealtime(app, auth, nil, slog.New(slog.NewTextHandler(io.Discard, nil)), nil, coordinator))
	defer server.Close()
	call := func(method, path, session, token string, want int) {
		t.Helper()
		req, err := http.NewRequest(method, server.URL+path, nil)
		requireChatSQL(t, err)
		if session != "" {
			req.Header.Set("Authorization", "Bearer "+session)
		}
		if token != "" {
			req.Header.Set("X-Deletion-Token", token)
		}
		resp, err := http.DefaultClient.Do(req)
		requireChatSQL(t, err)
		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		requireChatSQL(t, err)
		if resp.StatusCode != want {
			t.Fatalf("HTTP%s%s got%d want%d; body omitted", method, path, resp.StatusCode, want)
		}
		if want >= 400 {
			for _, private := range []string{operationToken, sessionA, sessionB, "synthetic second meeting SQL failure", "qa_coordinator", "Synthetic private"} {
				if strings.Contains(string(body), private) {
					t.Fatal("private SQL/session details leaked")
				}
			}
		}
	}
	call("DELETE", "/api/v1/me", sessionA, operationToken, 500)
	// A brand-new pool must see the complete original committed state.
	pool, err := pgxpool.NewWithConfig(ctx, db.pool.Config().Copy())
	requireChatSQL(t, err)
	other := &Database{pool: pool}
	defer other.Close()
	var seen int64
	var called bool
	requireChatSQL(t, other.pool.QueryRow(ctx, `SELECT last_value,is_called FROM qa_coordinator_second_seen`).Scan(&seen, &called))
	if !called || seen != 1 {
		t.Fatal("second meeting fault not reached after first deletion", seen, called)
	}
	after := coordinatorSnapshot(t, other)
	if !reflect.DeepEqual(before, after) {
		t.Fatal("SQL rollback changed business table fingerprints", before, after)
	}
	for _, id := range ids {
		if _, err := meetings.NewService(other.Meetings(), currentTime).Details(ctx, meetings.Actor{ID: user}, id); err != nil {
			t.Fatal("meeting not restored", id, err)
		}
	}
	for _, token := range []string{sessionA, sessionB} {
		if _, err := auth.Authenticate(ctx, token, false); err != nil {
			t.Fatal("session/profile not restored", err)
		}
	}
	requireChatSQL(t, other.Identity().Update(ctx, func(r identity.Records) error {
		if u, ok := r.UserBySubject(subject); !ok || u.ID != user {
			return errors.New("provider/profile changed")
		}
		if _, ok := r.Attempt(attempt); !ok {
			return errors.New("handoff changed")
		}
		if _, ok := r.DeletionReceipt(coordinatorHash(operationToken)); ok {
			return errors.New("failure left completion receipt")
		}
		return nil
	}))
	if revoked.Load() != 0 {
		t.Fatal("rollback notified revocation")
	}
	call("GET", "/api/v1/me", sessionA, "", 200)
	t.Logf("forced second-meeting SQL exception after first DELETE; HTTP500 safe; independent pool %d business tables fingerprint-equal; two meetings,profile/provider,two sessions,handoff unchanged; no receipt/tombstone/revocation", len(before))
	// Remove only the QA fault, then execute the ordinary coordinator commit.
	_, err = db.pool.Exec(ctx, `DROP TRIGGER qa_coordinator_second_fault ON meetings`)
	requireChatSQL(t, err)
	call("DELETE", "/api/v1/me", sessionA, operationToken, 204)
	for _, token := range []string{sessionA, sessionB} {
		call("GET", "/api/v1/me", token, "", 401)
	}
	if revoked.Load() != 1 {
		t.Fatal("successful commit notification count", revoked.Load())
	}
	for _, id := range ids {
		var exists bool
		requireChatSQL(t, other.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM meetings WHERE id=$1)`, id).Scan(&exists))
		if exists {
			t.Fatal("successful deletion retained meeting")
		}
	}
	call("DELETE", "/api/v1/me", "", operationToken, 204)
	newUser, newSession := coordinatorID(), coordinatorSecret()
	requireChatSQL(t, other.Identity().Update(ctx, func(r identity.Records) error {
		if err := r.PutUser(subject, identity.User{ID: newUser, DisplayName: "Synthetic new owner", CreatedAt: now.Add(time.Second)}); err != nil {
			return err
		}
		r.PutSession(identity.Session{ID: "new-" + newUser, UserID: newUser, SecretHash: coordinatorHash(newSession), ClientKind: "ios", ExpiresAt: now.Add(time.Hour)})
		return nil
	}))
	call("DELETE", "/api/v1/me", "", operationToken, 204)
	call("GET", "/api/v1/me", newSession, "", 200)
	call("GET", "/api/v1/me", operationToken, "", 401)
	if revoked.Load() != 1 {
		t.Fatal("receipt retry notified/removes new account")
	}
	clock.Add(int64(25 * time.Hour))
	call("DELETE", "/api/v1/me", "", operationToken, 401)
	requireChatSQL(t, other.Identity().Update(ctx, func(r identity.Records) error {
		if u, ok := r.UserBySubject(subject); !ok || u.ID != newUser {
			return errors.New("expired retry changed new account")
		}
		return nil
	}))
	t.Log("ordinary HTTP coordinator retry committed204; both old sessions401; anonymous receipt replay204 before24h, new same-subject profile/session survives; operation secret bearer401;25h receipt replay401; no realOAuth/client claims")
}
