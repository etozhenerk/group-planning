package identity_test

import (
	"context"
	"encoding/base64"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

type readIdentity struct {
	*memory.Identity
	reads   int
	updates int
	failure error
}

func (s *readIdentity) View(ctx context.Context, fn func(identity.ReadRecords) error) error {
	s.reads++
	if s.failure != nil {
		return s.failure
	}

	return s.Identity.Update(ctx, func(records identity.Records) error { return fn(records) })
}

func (s *readIdentity) Update(ctx context.Context, fn func(identity.Records) error) error {
	s.updates++
	return s.Identity.Update(ctx, fn)
}

func TestAuthenticationAndProfilesUseReadOnlySnapshot(t *testing.T) {
	store := &readIdentity{Identity: memory.NewIdentity()}
	token := base64.RawURLEncoding.EncodeToString([]byte(strings.Repeat("r", 32)))
	err := store.Identity.Update(t.Context(), func(records identity.Records) error {
		if err := records.PutUser("subject", identity.User{ID: "reader", DisplayName: "Лена"}); err != nil {
			return err
		}

		records.PutSession(identity.Session{ID: "session", UserID: "reader", SecretHash: sum(token), ClientKind: "ios", ExpiresAt: time.Now().Add(time.Hour)})

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	service, err := identity.New(identity.Config{PublicOrigin: "https://somewhere.test", SessionTTL: time.Hour}, store, &provider{}, time.Now, func(context.Context, string) (bool, error) { return false, nil })
	if err != nil {
		t.Fatal(err)
	}

	principal, err := service.Authenticate(t.Context(), token, false)
	if err != nil || principal.User.ID != "reader" {
		t.Fatalf("session lookup failed: %+v %v", principal, err)
	}

	users, err := service.Users(t.Context(), []string{"reader"})
	if err != nil || users["reader"].DisplayName != "Лена" || store.reads != 2 || store.updates != 0 {
		t.Fatalf("read path took mutation lock: reads=%d updates=%d err=%v", store.reads, store.updates, err)
	}

	store.failure = identity.ErrUnavailable
	if _, err := service.Authenticate(t.Context(), token, false); !errors.Is(err, identity.ErrUnavailable) {
		t.Fatalf("transient read became session denial: %v", err)
	}

	store.failure = nil
	if err := service.Logout(t.Context(), token); err != nil || store.updates != 1 {
		t.Fatalf("logout bypassed atomic mutation: updates=%d err=%v", store.updates, err)
	}

	if _, err := service.Authenticate(t.Context(), token, false); !errors.Is(err, identity.ErrUnauthenticated) {
		t.Fatalf("revoked session remained authenticated: %v", err)
	}
}
