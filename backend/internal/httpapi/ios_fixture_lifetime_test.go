package httpapi

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestIOSFixtureSessionCoversWholeSuiteAndStillExpires(t *testing.T) {
	now := time.Date(2026, 11, 1, 12, 0, 0, 0, time.UTC)
	origin := "https://127.0.0.1:8088"
	auth, err := identity.New(identity.Config{
		PublicOrigin:    origin,
		SessionTTL:      iosFixtureSessionTTL,
		NativeCallbacks: map[string]string{"ios": "group-planning-ios://auth/callback"},
	}, memory.NewIdentity(), iosFixtureProvider{origin: origin}, func() time.Time { return now }, func(context.Context, string) (bool, error) { return false, nil })
	if err != nil {
		t.Fatal(err)
	}

	credential := iosCredential(t, auth, "fixture-lifetime")
	now = now.Add(2 * time.Hour)
	if _, err := auth.Authenticate(t.Context(), credential.Token, false); err != nil {
		t.Fatal("whole-suite synthetic session expired early", err)
	}

	now = credential.ExpiresAt
	if _, err := auth.Authenticate(t.Context(), credential.Token, false); !errors.Is(err, identity.ErrUnauthenticated) {
		t.Fatal("synthetic session lost its expiry boundary", err)
	}
}
