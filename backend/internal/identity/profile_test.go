package identity_test

import (
	"context"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

type optionalProfileProvider struct{ profile identity.Profile }

func (p *optionalProfileProvider) AuthorizationURL(string, string) string {
	return "https://provider.example/authorize"
}

func (p *optionalProfileProvider) Verify(context.Context, string, string) (identity.Profile, error) {
	return p.profile, nil
}

func (p *optionalProfileProvider) VerifyToken(context.Context, string) (identity.Profile, error) {
	return p.profile, nil
}

func TestRepeatedLoginPreservesMissingOptionalFields(t *testing.T) {
	ctx := context.Background()
	email, phone, avatar := "owner@example.test", "+79991234567", "https://avatars.yandex.net/get-yapic/1/a/islands-200"
	loginName, firstName, lastName, birthday, sex := "owner", "Александр", "Иванов", "0000-12-23", "male"
	provider := &optionalProfileProvider{profile: identity.Profile{Subject: "same-user", DisplayName: "Имя", Email: &email, Phone: &phone, AvatarURL: &avatar, Login: &loginName, FirstName: &firstName, LastName: &lastName, Birthday: &birthday, Sex: &sex}}
	service, err := identity.New(identity.Config{PublicOrigin: "https://somewhere.example", NativeCallbacks: map[string]string{"ios": "group-planning-ios://auth/callback"}, SessionTTL: time.Hour}, memory.NewIdentity(), provider, time.Now, func(context.Context, string) (bool, error) { return true, nil })
	if err != nil {
		t.Fatal(err)
	}

	login := func() identity.User {
		t.Helper()
		attempt, verifier := start(t, service, "ios")
		session, err := service.ExchangeSDK(ctx, attempt.AttemptID, verifier, "test-token")
		if err != nil {
			t.Fatal(err)
		}

		principal, err := service.Authenticate(ctx, session.Secret, false)
		if err != nil {
			t.Fatal(err)
		}

		return principal.User
	}
	first := login()
	provider.profile = identity.Profile{Subject: "same-user", DisplayName: "Новое имя"}
	second := login()
	if first.ID != second.ID || second.DisplayName != "Новое имя" || second.Email != email || second.Phone != phone || second.AvatarURL != avatar || second.Login != loginName || second.FirstName != firstName || second.LastName != lastName || second.Birthday != birthday || second.Sex != sex {
		t.Fatal("partial permissions erased stored profile")
	}

	empty := ""
	provider.profile.AvatarURL = &empty
	provider.profile.Birthday = &empty
	provider.profile.Sex = &empty
	provider.profile.LastName = &empty
	third := login()
	if third.AvatarURL != "" || third.Email != email || third.Birthday != "" || third.Sex != "" || third.LastName != "" || third.FirstName != firstName {
		t.Fatal("explicit avatar removal or missing contact handling")
	}
}
