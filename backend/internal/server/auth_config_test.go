package server

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

func TestAuthConfig(t *testing.T) {
	base := map[string]string{
		"SOMEWHERE_AUTH_ENABLED":          "true",
		"SOMEWHERE_PUBLIC_ORIGIN":         "https://somewhere.example",
		"SOMEWHERE_YANDEX_CLIENT_ID":      "client",
		"SOMEWHERE_YANDEX_CLIENT_SECRET":  "private-secret",
		"SOMEWHERE_IOS_AUTH_CALLBACK":     "group-planning-ios://auth/callback",
		"SOMEWHERE_ANDROID_AUTH_CALLBACK": "group-planning-android://auth/callback",
	}
	config, err := LoadConfig(func(key string) string { return base[key] })
	if err != nil || !config.Auth.Enabled {
		t.Fatal(err)
	}

	cases := map[string]string{
		"SOMEWHERE_PUBLIC_ORIGIN":         "http://somewhere.example",
		"SOMEWHERE_IOS_AUTH_CALLBACK":     "javascript://host/callback",
		"SOMEWHERE_ANDROID_AUTH_CALLBACK": "group-planning-android://auth/callback?url=attacker",
		"SOMEWHERE_SESSION_TTL":           "721h",
		"SOMEWHERE_YANDEX_CLIENT_SECRET":  "",
		"SOMEWHERE_AUTH_ENABLED":          "false",
		"SOMEWHERE_DEV_USER":              "test",
		"SOMEWHERE_AUTH_BYPASS":           "true",
		"SOMEWHERE_YANDEX_TOKEN_URL":      "http://fake.example",
	}
	for key, value := range cases {
		t.Run(key, func(t *testing.T) {
			if _, err := LoadConfig(func(name string) string {
				if name == key {
					return value
				}

				return base[name]
			}); err == nil {
				t.Fatal("accepted unsafe configuration")
			}
		})
	}

	for _, address := range []string{"http://host/callback", "https://host/callback#token", "https://user:password@host/callback"} {
		cfg := config.Auth.Identity
		cfg.NativeCallbacks = map[string]string{"ios": address}
		if identity.ValidateConfig(cfg) == nil {
			t.Fatal("accepted native callback", address)
		}
	}
}

func TestConfiguredIdentityRoutesStartAndStop(t *testing.T) {
	settings := map[string]string{
		"SOMEWHERE_AUTH_ENABLED":         "true",
		"SOMEWHERE_PUBLIC_ORIGIN":        "https://somewhere.example",
		"SOMEWHERE_YANDEX_CLIENT_ID":     "client",
		"SOMEWHERE_YANDEX_CLIENT_SECRET": "test-secret",
	}
	config, err := LoadConfig(func(key string) string { return settings[key] })
	if err != nil {
		t.Fatal(err)
	}

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	done := make(chan error, 1)
	go func() {
		done <- Serve(ctx, listener, memory.New(), config, slog.New(slog.NewTextHandler(io.Discard, nil)))
	}()
	request, err := http.NewRequest("POST", "http://"+listener.Addr().String()+"/api/v1/auth/yandex/start", strings.NewReader(`{"client_kind":"web","return_context":{"kind":"home"}}`))
	if err != nil {
		t.Fatal(err)
	}

	request.Header.Set("Origin", settings["SOMEWHERE_PUBLIC_ORIGIN"])
	request.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: time.Second}
	response, err := client.Do(request)
	if err != nil {
		t.Fatal(err)
	}

	var result struct {
		URL string `json:"authorization_url"`
	}
	err = json.NewDecoder(response.Body).Decode(&result)
	response.Body.Close()
	if err != nil || response.StatusCode != 200 {
		t.Fatalf("configured start: %d %v", response.StatusCode, err)
	}

	location, err := url.Parse(result.URL)
	if err != nil || location.Host != "oauth.yandex.ru" || location.Query().Get("redirect_uri") != "https://somewhere.example/api/v1/auth/yandex/callback" {
		t.Fatal("wrong provider configuration")
	}

	cancel()
	select {
	case err := <-done:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("identity cleanup did not stop")
	}
}
