package identity_test

import (
	"context"
	"encoding/base64"
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

func TestDeletionFencesPreviousOAuthAndSDKAttempts(t *testing.T) {
	s, _, now, _ := setup(t)
	login := webLogin(t, s)
	principal, err := s.Authenticate(context.Background(), login.SessionSecret, true)
	if err != nil {
		t.Fatal(err)
	}

	web, _ := start(t, s, "web")
	native, verifier := start(t, s, "ios")
	now.add(time.Second)
	grant, err := s.PrepareDeletion(t.Context(), identity.DeletionInput{SessionToken: login.SessionSecret, Web: true, Origin: "https://somewhere.example", CSRF: principal.CSRF, Token: base64.RawURLEncoding.EncodeToString(make([]byte, 32))})
	if err != nil {
		t.Fatal(err)
	}

	if err := s.CompleteDeletion(t.Context(), grant); err != nil {
		t.Fatal(err)
	}

	if _, err := s.Callback(t.Context(), identity.CallbackInput{State: state(t, web), Code: "ok", Binding: web.BindingSecret}); !errors.Is(err, identity.ErrInvalidAttempt) {
		t.Fatal("old OAuth resurrected account", err)
	}

	if _, err := s.ExchangeSDK(t.Context(), native.AttemptID, verifier, "sdk-token"); !errors.Is(err, identity.ErrInvalidAttempt) {
		t.Fatal("old SDK resurrected account", err)
	}

	now.add(time.Second)
	next := webLogin(t, s)
	newPrincipal, err := s.Authenticate(t.Context(), next.SessionSecret, true)
	if err != nil || newPrincipal.User.ID == principal.User.ID {
		t.Fatal("new login did not create a fresh profile", err)
	}
}
