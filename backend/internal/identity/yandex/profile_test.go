package yandex

import (
	"context"
	"net/http"
	"testing"
)

func TestOptionalProfileFieldsAreValidatedAndMayBeAbsent(t *testing.T) {
	for _, tc := range []struct {
		body    string
		present bool
	}{
		{`{"id":"123","client_id":"client","login":"lena","default_avatar_id":"123/abc-def","default_email":"lena@example.test","default_phone":{"number":"+79991234567"}}`, true},
		{`{"id":"123","client_id":"client","login":"lena"}`, false},
		{`{"id":"123","client_id":"client","login":"lena","default_avatar_id":"../../attack","default_email":"bad email","default_phone":{"number":"not a phone"}}`, false},
	} {
		p := New("client", "secret", "https://somewhere.example/callback", transportFunc(func(*http.Request) (*http.Response, error) { return response(200, tc.body), nil }))
		profile, err := p.VerifyToken(context.Background(), "token")
		if err != nil {
			t.Fatal(err)
		}

		if (profile.AvatarURL != nil) != tc.present || (profile.Email != nil) != tc.present || (profile.Phone != nil) != tc.present {
			t.Fatalf("invalid optional fields: %+v", profile)
		}

		if tc.present && *profile.AvatarURL != "https://avatars.yandex.net/get-yapic/123/abc-def/islands-200" {
			t.Fatal("unsafe avatar URL")
		}
	}
}
