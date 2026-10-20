package yandex

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strings"
	"testing"
)

type transportFunc func(*http.Request) (*http.Response, error)

func (f transportFunc) RoundTrip(r *http.Request) (*http.Response, error) {
	return f(r)
}

func response(status int, body string) *http.Response {
	return &http.Response{
		StatusCode: status,
		Header:     make(http.Header),
		Body:       io.NopCloser(strings.NewReader(body)),
	}
}

func TestProviderCodePKCEAndVerifiedProfile(t *testing.T) {
	calls := 0
	p := New("client", "private-client-secret", "https://somewhere.example/api/v1/auth/yandex/callback", transportFunc(func(r *http.Request) (*http.Response, error) {
		calls++
		if r.URL.String() == "https://oauth.yandex.ru/token" {
			id, secret, ok := r.BasicAuth()
			if !ok || id != "client" || secret != "private-client-secret" {
				t.Fatal("missing Basic auth")
			}

			body, _ := io.ReadAll(r.Body)
			values, _ := url.ParseQuery(string(body))
			if values.Get("code") != "code" || values.Get("code_verifier") != "verifier" || values.Get("redirect_uri") != "https://somewhere.example/api/v1/auth/yandex/callback" {
				t.Fatal("code exchange lost PKCE or callback")
			}

			return response(200, `{"access_token":"private-provider-token","token_type":"bearer","refresh_token":"discard-me"}`), nil
		}

		if r.URL.String() != "https://login.yandex.ru/info?format=json" || r.Header.Get("Authorization") != "OAuth private-provider-token" {
			t.Fatal("unsafe profile request")
		}

		return response(200, `{"id":"123","client_id":"client","login":"lena","email":"discard-me"}`), nil
	}))
	u, _ := url.Parse(p.AuthorizationURL("state", "challenge"))
	if u.Query().Get("scope") != "login:info" || u.Query().Get("code_challenge_method") != "S256" || u.Query().Get("code_challenge") != "challenge" {
		t.Fatal("authorization URL")
	}

	profile, err := p.Verify(context.Background(), "code", "verifier")
	if err != nil || profile.Subject != "123" || profile.DisplayName != "lena" || calls != 2 {
		t.Fatalf("profile: %+v %v", profile, err)
	}
}

func TestProviderRejectsNetworkRedirectAndInvalidProfile(t *testing.T) {
	for _, mode := range []string{"network", "redirect", "wrong-client", "missing-id", "bad-json", "oversized"} {
		t.Run(mode, func(t *testing.T) {
			p := New("client", "secret", "https://somewhere.example/api/v1/auth/yandex/callback", transportFunc(func(r *http.Request) (*http.Response, error) {
				if mode == "network" {
					return nil, errors.New("private-network-detail")
				}

				if mode == "redirect" {
					v := response(302, "")
					v.Header.Set("Location", "https://attacker.example")

					return v, nil
				}

				if r.URL.Host == "oauth.yandex.ru" {
					return response(200, `{"access_token":"token","token_type":"bearer"}`), nil
				}

				switch mode {
				case "wrong-client":
					return response(200, `{"id":"1","client_id":"attacker","login":"lena"}`), nil
				case "missing-id":
					return response(200, `{"client_id":"client","login":"lena"}`), nil
				case "oversized":
					return response(200, strings.Repeat("a", (64<<10)+1)), nil
				default:
					return response(200, `{} {}`), nil
				}
			}))
			if _, err := p.Verify(context.Background(), "code", "verifier"); err == nil || strings.Contains(err.Error(), "private") {
				t.Fatal("unsafe provider success/error", err)
			}
		})
	}
}
