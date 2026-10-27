package httpapi

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func newProfileFieldsHTTPFixture(t *testing.T, native bool) *meetingHTTPTest {
	t.Helper()
	h := &meetingHTTPTest{t: t, store: memory.New(), server: httptest.NewUnstartedServer(nil)}
	origin := "https://" + h.server.Listener.Addr().String()
	var provider identity.Provider = browserProvider{origin: origin}
	if native {
		provider = iosFixtureProvider{origin: origin}
	}

	service, err := identity.New(identity.Config{
		PublicOrigin: origin,
		SessionTTL:   time.Hour,
		NativeCallbacks: map[string]string{
			"ios":     "group-planning-ios://auth/callback",
			"android": "group-planning-android://auth/callback",
		},
	}, memory.NewIdentity(), provider, time.Now, func(context.Context, string) (bool, error) { return false, nil })
	if err != nil {
		t.Fatal(err)
	}

	h.app = meetings.NewService(h.store, time.Now)
	h.server.Config.Handler = NewWithIdentity(h.app, service, slog.New(slog.NewTextHandler(io.Discard, nil)))
	h.server.StartTLS()
	t.Cleanup(h.server.Close)
	h.anonymous = h.client(false)

	return h
}

func profileFieldsSDKLogin(h *meetingHTTPTest, client *http.Client, platform, scenario string) map[string]string {
	h.t.Helper()
	verifier := strings.Repeat("v", 43)
	digest := sha256.Sum256([]byte(verifier))
	data, _ := h.request(client, "POST", "/api/v1/auth/yandex/start", map[string]any{
		"client_kind":    platform,
		"return_context": map[string]string{"kind": "home"},
		"app_challenge":  base64.RawURLEncoding.EncodeToString(digest[:]),
	}, nil, http.StatusOK)
	attempt := decodeMeetingTest[authStartedResponse](h.t, data)
	request := sdkExchangeRequest{AttemptID: attempt.AttemptID, AppVerifier: verifier, OAuthToken: scenario}
	wrong := request
	wrong.AppVerifier = strings.Repeat("w", 43)
	h.request(client, "POST", "/api/v1/auth/mobile/sdk/exchange", wrong, nil, http.StatusBadRequest)
	data, _ = h.request(client, "POST", "/api/v1/auth/mobile/sdk/exchange", request, nil, http.StatusOK)
	session := decodeMeetingTest[exchangeResponse](h.t, data)
	h.request(client, "POST", "/api/v1/auth/mobile/sdk/exchange", request, nil, http.StatusBadRequest)

	return map[string]string{"Authorization": "Bearer " + session.SessionToken}
}

func TestProfileFieldsFixtureRepeatedHTTPLogin(t *testing.T) {
	for _, platform := range []string{"web", "ios", "android"} {
		t.Run(platform, func(t *testing.T) {
			h := newProfileFieldsHTTPFixture(t, platform != "web")
			var firstClient *http.Client
			var firstHeaders map[string]string
			var firstID string
			for _, stage := range []string{"full", "partial", "clear"} {
				client := h.client(platform == "web")
				var headers map[string]string
				if platform == "web" {
					h.login(client, "profile-fields-"+stage, map[string]string{"kind": "home"})
				} else {
					headers = profileFieldsSDKLogin(h, client, platform, "profile-fields-"+stage)
				}

				data, _ := h.request(client, "GET", "/api/v1/me/profile", nil, headers, http.StatusOK)
				profile := decodeMeetingTest[profileResponse](t, data)
				if stage == "full" {
					firstClient, firstHeaders, firstID = client, headers, profile.ID
				}

				if profile.ID != firstID || profile.DisplayName != "Александр Тестов" || profile.Provider != "yandex" {
					t.Fatal("repeat login changed profile identity")
				}

				wantBirthday, wantSex := new("1990-12-23"), new("male")
				wantPhone := new("+79990000000")
				wantAvatar := new("https://avatars.yandex.net/get-yapic/fixture/portrait/islands-200")
				if stage != "full" {
					wantBirthday, wantSex = new("0000-12-23"), nil
				}

				if stage == "clear" {
					wantBirthday, wantPhone, wantAvatar = nil, nil, nil
				}

				want := profileResponse{
					ID:          firstID,
					DisplayName: "Александр Тестов",
					Provider:    "yandex",
					Login:       new("profile_fixture"),
					FirstName:   new("Александр"),
					LastName:    new("Тестов"),
					Email:       new("profile@example.test"),
					Phone:       wantPhone,
					AvatarURL:   wantAvatar,
					Birthday:    wantBirthday,
					Sex:         wantSex,
				}
				if !reflect.DeepEqual(profile, want) {
					t.Fatalf("%s optional profile fields differ: got %+v, want %+v", stage, profile, want)
				}

				oldData, _ := h.request(firstClient, "GET", "/api/v1/me/profile", nil, firstHeaders, http.StatusOK)
				if !reflect.DeepEqual(decodeMeetingTest[profileResponse](t, oldData), profile) {
					t.Fatal("prior session was revoked or did not read refreshed profile")
				}
			}
		})
	}
}

func TestProfileFieldsFixtureRejectsUnknownSDKTokens(t *testing.T) {
	provider := iosFixtureProvider{origin: "https://127.0.0.1:8443"}
	for _, token := range []string{"", "sasha", "profile-fields-unknown", "profile-fields-full?birthday=null"} {
		if _, err := provider.VerifyToken(context.Background(), token); err == nil {
			t.Fatal("fixture accepted an unregistered SDK result")
		}
	}

	for _, stage := range []string{"full", "partial", "clear"} {
		profile, err := provider.VerifyToken(context.Background(), "profile-fields-"+stage)
		if err != nil || profile.Subject != profileFieldsSubject {
			t.Fatal("fixture scenarios must share the same verified subject", err)
		}
	}
}
