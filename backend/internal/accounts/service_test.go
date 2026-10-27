package accounts_test

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/accounts"
	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

type noProvider struct{}

func (noProvider) AuthorizationURL(string, string) string { return "" }
func (noProvider) Verify(context.Context, string, string) (identity.Profile, error) {
	return identity.Profile{}, errors.New("unused")
}

func hash(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func secret(value byte) string {
	data := make([]byte, 32)
	for i := range data {
		data[i] = value
	}

	return base64.RawURLEncoding.EncodeToString(data)
}

type fixture struct {
	auth       *identity.Service
	meetings   *meetings.Service
	identities *memory.Identity
	store      *memory.Store
	now        time.Time
	input      identity.DeletionInput
	id         string
}

func setup(t *testing.T) *fixture {
	t.Helper()
	f := &fixture{identities: memory.NewIdentity(), store: memory.New(), now: time.Now(), id: "88000000-0000-4000-8000-000000000001"}
	f.input = identity.DeletionInput{SessionToken: secret(1), Token: secret(2), Web: false}
	var err error
	f.auth, err = identity.New(identity.Config{PublicOrigin: "https://somewhere.example", SessionTTL: time.Hour}, f.identities, noProvider{}, func() time.Time { return f.now }, func(context.Context, string) (bool, error) { return true, nil })
	if err != nil {
		t.Fatal(err)
	}

	f.meetings = meetings.NewService(f.store, func() time.Time { return f.now })
	err = f.identities.Update(t.Context(), func(r identity.Records) error {
		if err := r.PutUser("yandex:test", identity.User{ID: f.id, DisplayName: "Private name", CreatedAt: f.now}); err != nil {
			return err
		}

		for _, value := range []byte{1, 3} {
			r.PutSession(identity.Session{ID: secret(value), UserID: f.id, SecretHash: hash(secret(value)), ClientKind: "ios", ExpiresAt: f.now.Add(time.Hour)})
		}

		r.PutAttempt(identity.Attempt{ID: "handoff", UserID: f.id, ExpiresAt: f.now.Add(time.Minute)})

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	return f
}

func (f *fixture) atomic(ctx context.Context, fn func(accounts.Identity, accounts.Meetings) error) error {
	return f.identities.AccountUpdate(ctx, f.store, func(a identity.Store, m meetings.Store) error {
		return fn(f.auth.WithStore(a), meetings.NewService(m, func() time.Time { return f.now }))
	})
}

func TestDeletionRevokesEverySessionAndRetryCannotDeleteNewAccount(t *testing.T) {
	f := setup(t)
	service := accounts.New(f.atomic)
	var wg sync.WaitGroup
	for range 8 {
		wg.Go(func() {
			if err := service.Delete(t.Context(), f.input); err != nil {
				t.Error(err)
			}
		})
	}

	wg.Wait()
	for _, value := range []byte{1, 3} {
		if _, err := f.auth.Authenticate(t.Context(), secret(value), false); !errors.Is(err, identity.ErrUnauthenticated) {
			t.Fatal("session survived", err)
		}
	}

	err := f.identities.Update(t.Context(), func(r identity.Records) error {
		if _, ok := r.User(f.id); ok {
			return errors.New("profile survived")
		}

		if _, ok := r.UserBySubject("yandex:test"); ok {
			return errors.New("provider mapping survived")
		}

		if _, ok := r.Attempt("handoff"); ok {
			return errors.New("handoff survived")
		}

		return r.PutUser("yandex:test", identity.User{ID: "new-user", DisplayName: "New account"})
	})
	if err != nil {
		t.Fatal(err)
	}

	retry := f.input
	retry.SessionToken = ""
	if err := service.Delete(t.Context(), retry); err != nil {
		t.Fatal("lost response retry", err)
	}

	err = f.identities.Update(t.Context(), func(r identity.Records) error {
		if user, ok := r.UserBySubject("yandex:test"); !ok || user.ID != "new-user" {
			return errors.New("retry touched new profile")
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	f.now = f.now.Add(25 * time.Hour)
	if err := service.Delete(t.Context(), retry); !errors.Is(err, identity.ErrUnauthenticated) {
		t.Fatal("expired receipt accepted", err)
	}

	if _, err := f.auth.Cleanup(t.Context()); err != nil {
		t.Fatal(err)
	}

	err = f.identities.Update(t.Context(), func(r identity.Records) error {
		if _, ok := r.DeletionReceipt(hash(f.input.Token)); ok {
			return errors.New("expired receipt retained")
		}

		if _, ok := r.SubjectFence(hash("yandex:test")); ok {
			return errors.New("expired subject fence retained")
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestAtomicAccountRemovalRollsBackBothStores(t *testing.T) {
	for _, mode := range []string{"error", "cancel", "panic"} {
		t.Run(mode, func(t *testing.T) {
			f := setup(t)
			actor := meetings.Actor{ID: f.id, Name: "Private name"}
			created, err := f.meetings.Create(t.Context(), actor, meetings.CreateInput{Title: "Survives rollback", StartsOn: "2026-12-24", Timezone: "Europe/Moscow"}, "88000000-0000-4000-8000-000000000002")
			if err != nil {
				t.Fatal(err)
			}

			ctx, cancel := context.WithCancel(t.Context())
			defer cancel()
			failure := errors.New("injected after both operations")
			service := accounts.New(func(ctx context.Context, fn func(accounts.Identity, accounts.Meetings) error) error {
				return f.atomic(ctx, func(a accounts.Identity, m accounts.Meetings) error {
					if err := fn(a, m); err != nil {
						return err
					}

					switch mode {
					case "cancel":
						cancel()
						return nil
					case "panic":
						panic(failure)
					default:
						return failure
					}
				})
			})
			func() {
				defer func() {
					if mode == "panic" && recover() == nil {
						t.Error("panic lost")
					}
				}()
				err = service.Delete(ctx, f.input)
			}()
			if mode != "panic" && err == nil {
				t.Fatal("failure committed")
			}

			if _, err := f.auth.Authenticate(t.Context(), f.input.SessionToken, false); err != nil {
				t.Fatal("profile rollback failed", err)
			}

			if _, err := f.meetings.Details(t.Context(), actor, created.Details.Meeting.ID); err != nil {
				t.Fatal("meeting rollback failed", err)
			}

			if err := accounts.New(f.atomic).Delete(t.Context(), f.input); err != nil {
				t.Fatal("gate retained after rollback", err)
			}
		})
	}
}

func TestDeletionObserverRunsAfterOuterCommitOnly(t *testing.T) {
	f := setup(t)
	calls := 0
	unwatch := f.auth.OnRevocation(func(session, user string) {
		calls++
		if session != "" || user != f.id {
			t.Error("wrong revocation reference")
		}

		if _, err := f.auth.Authenticate(t.Context(), f.input.SessionToken, false); !errors.Is(err, identity.ErrUnauthenticated) {
			t.Error("not committed before observer", err)
		}
	})
	defer unwatch()
	aborted := errors.New("abort outer transaction")
	failed := accounts.New(func(ctx context.Context, fn func(accounts.Identity, accounts.Meetings) error) error {
		return f.identities.AccountUpdate(ctx, f.store, func(a identity.Store, m meetings.Store) error {
			if err := fn(f.auth.WithStore(a), meetings.NewService(m, func() time.Time { return f.now })); err != nil {
				return err
			}

			return aborted
		})
	}, f.auth.AccountDeleted)
	if err := failed.Delete(t.Context(), f.input); !errors.Is(err, aborted) {
		t.Fatal(err)
	}

	if calls != 0 {
		t.Fatal("rollback notified consumers")
	}

	service := accounts.New(f.atomic, f.auth.AccountDeleted)
	if err := service.Delete(t.Context(), f.input); err != nil {
		t.Fatal(err)
	}

	if calls != 1 {
		t.Fatal("committed deletion did not notify", calls)
	}
}
