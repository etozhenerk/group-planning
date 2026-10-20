package memory

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

func TestIdentityAtomicityAndCancellation(t *testing.T) {
	store := NewIdentity()
	failure := errors.New("rollback")
	err := store.Update(context.Background(), func(records identity.Records) error {
		records.PutAttempt(identity.Attempt{ID: "attempt"})
		if err := records.PutUser("yandex:1", identity.User{ID: "user"}); err != nil {
			return err
		}

		records.PutSession(identity.Session{SecretHash: "hash"})

		return failure
	})
	if !errors.Is(err, failure) || len(store.data.attempts) != 0 || len(store.data.users) != 0 || len(store.data.subjects) != 0 || len(store.data.sessions) != 0 {
		t.Fatal("partial authentication commit")
	}

	ctx, cancel := context.WithCancel(context.Background())
	err = store.Update(ctx, func(records identity.Records) error {
		records.PutAttempt(identity.Attempt{ID: "cancelled"})
		cancel()

		return nil
	})
	if !errors.Is(err, context.Canceled) || len(store.data.attempts) != 0 {
		t.Fatal("cancelled commit")
	}

	func() {
		defer func() {
			if recover() == nil {
				t.Error("panic not propagated")
			}
		}()
		_ = store.Update(context.Background(), func(records identity.Records) error {
			records.PutAttempt(identity.Attempt{ID: "panic"})
			panic("rollback")
		})
	}()
	if len(store.data.attempts) != 0 {
		t.Fatal("panic committed")
	}

	if err := store.Update(context.Background(), func(records identity.Records) error { return records.PutUser("yandex:1", identity.User{ID: "one"}) }); err != nil {
		t.Fatal(err)
	}

	if err := store.Update(context.Background(), func(records identity.Records) error { return records.PutUser("yandex:1", identity.User{ID: "two"}) }); !errors.Is(err, identity.ErrConflict) {
		t.Fatal("duplicate subject")
	}
}

func TestIdentityCleanup(t *testing.T) {
	store := NewIdentity()
	now := time.Now()
	if err := store.Update(context.Background(), func(records identity.Records) error {
		records.PutAttempt(identity.Attempt{ID: "expired", ExpiresAt: now})
		records.PutAttempt(identity.Attempt{ID: "live", ExpiresAt: now.Add(time.Minute)})
		records.PutAttempt(identity.Attempt{
			ID:               "handoff",
			ExpiresAt:        now.Add(time.Minute),
			Status:           "provider_verified",
			HandoffExpiresAt: now,
		})
		records.PutSession(identity.Session{SecretHash: "expired", ExpiresAt: now})
		records.PutSession(identity.Session{SecretHash: "live", ExpiresAt: now.Add(time.Hour)})

		return nil
	}); err != nil {
		t.Fatal(err)
	}

	if err := store.Update(context.Background(), func(records identity.Records) error {
		count := records.Cleanup(now)
		if count.Attempts != 2 || count.Sessions != 1 {
			t.Fatalf("cleanup: %+v", count)
		}

		if _, ok := records.Attempt("live"); !ok {
			t.Fatal("deleted live attempt")
		}

		if _, ok := records.Session("live"); !ok {
			t.Fatal("deleted live session")
		}

		return nil
	}); err != nil {
		t.Fatal(err)
	}
}
