package identity_test

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

func (p *provider) VerifyToken(ctx context.Context, token string) (identity.Profile, error) {
	return p.Verify(ctx, token, "sdk")
}

func TestSDKExchangeBindingsReplayAndSharedIdentity(t *testing.T) {
	service, _, now, _ := setup(t)
	ctx := context.Background()
	verifier := strings.Repeat("v", 43)
	begin := func(kind string) identity.Started {
		t.Helper()
		challenge := appChallenge(verifier)
		if kind == "web" {
			challenge = ""
		}

		started, err := service.Start(ctx, identity.StartInput{
			ClientKind: kind,
			Context:    identity.ReturnContext{Kind: "invitation", Token: strings.Repeat("A", 22)}, AppChallenge: challenge,
		}, "https://somewhere.example")
		if err != nil {
			t.Fatal(err)
		}

		return started
	}
	ios := begin("ios")
	if _, err := service.ExchangeSDK(ctx, ios.AttemptID, strings.Repeat("x", 43), "sdk-token"); !errors.Is(err, identity.ErrInvalidAttempt) {
		t.Fatal("accepted foreign verifier")
	}

	first, err := service.ExchangeSDK(ctx, ios.AttemptID, verifier, "sdk-token")
	if err != nil || first.Context.Kind != "invitation" {
		t.Fatal("SDK exchange failed", err)
	}

	if _, err := service.ExchangeSDK(ctx, ios.AttemptID, verifier, "sdk-token"); !errors.Is(err, identity.ErrInvalidAttempt) {
		t.Fatal("accepted replay")
	}

	android := begin("android")
	second, err := service.ExchangeSDK(ctx, android.AttemptID, verifier, "sdk-token")
	if err != nil {
		t.Fatal(err)
	}

	a, _ := service.Authenticate(ctx, first.Secret, false)
	b, _ := service.Authenticate(ctx, second.Secret, false)
	if a.User.ID == "" || a.User.ID != b.User.ID {
		t.Fatal("platforms created separate users")
	}

	web := begin("web")
	if _, err := service.ExchangeSDK(ctx, web.AttemptID, verifier, "sdk-token"); !errors.Is(err, identity.ErrInvalidAttempt) {
		t.Fatal("accepted web attempt")
	}

	expired := begin("ios")
	now.add(11 * time.Minute)
	if _, err := service.ExchangeSDK(ctx, expired.AttemptID, verifier, "sdk-token"); !errors.Is(err, identity.ErrInvalidAttempt) {
		t.Fatal("accepted expired attempt")
	}

	failed := begin("ios")
	if _, err := service.ExchangeSDK(ctx, failed.AttemptID, verifier, "fail"); !errors.Is(err, identity.ErrUnavailable) {
		t.Fatal("accepted invalid provider token")
	}

	if _, err := service.ExchangeSDK(ctx, failed.AttemptID, verifier, "sdk-token"); !errors.Is(err, identity.ErrInvalidAttempt) {
		t.Fatal("reused failed attempt")
	}
}
