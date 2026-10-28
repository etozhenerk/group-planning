package httpapi

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
	"github.com/etozhenerk/group-planning/backend/internal/webui"
)

type crossPlatformProvider struct{ browserProvider }

func (p crossPlatformProvider) Verify(ctx context.Context, code, verifier string) (identity.Profile, error) {
	if code == "android" && verifier != "" {
		return identity.Profile{Subject: "cross-platform-android", DisplayName: "Миша"}, nil
	}

	return p.browserProvider.Verify(ctx, code, verifier)
}

// TestCrossPlatformFixture is an opt-in, loopback-only HTTP integration harness. The
// normal go test run skips it; no production env or route can enable this provider.
func TestCrossPlatformFixture(t *testing.T) {
	if os.Getenv("SOMEWHERE_CROSS_FIXTURE") != "1" {
		t.Skip("cross-platform fixture is opt-in")
	}

	directory, err := filepath.Abs(os.Getenv("SOMEWHERE_BROWSER_DIST"))
	if err != nil {
		t.Fatal(err)
	}

	if _, err = os.Stat(filepath.Join(directory, "index.html")); err != nil {
		t.Fatal("build the web client before starting browser fixture")
	}

	address := os.Getenv("SOMEWHERE_BROWSER_ADDR")
	if address == "" {
		address = "127.0.0.1:0"
	}

	host, _, err := net.SplitHostPort(address)
	if err != nil || host != "127.0.0.1" {
		t.Fatal("browser fixture must bind to IPv4 loopback")
	}

	listener, err := net.Listen("tcp", address)
	if err != nil {
		t.Fatal(err)
	}

	server := httptest.NewUnstartedServer(nil)
	server.Listener.Close()
	server.Listener = listener
	origin := "https://" + listener.Addr().String()
	store := memory.New()
	service, err := identity.New(identity.Config{
		PublicOrigin:    origin,
		SessionTTL:      time.Hour,
		NativeCallbacks: map[string]string{"ios": "group-planning-ios://auth/callback"},
	}, memory.NewIdentity(), crossPlatformProvider{browserProvider{origin}}, time.Now, func(ctx context.Context, token string) (bool, error) {
		_, err := meetings.Preview(ctx, store, token)
		if errors.Is(err, meetings.ErrNotFound) {
			return false, nil
		}

		return err == nil, err
	})
	if err != nil {
		t.Fatal(err)
	}

	app := meetings.NewService(store, time.Now, meetings.WithMediaContent(memory.NewMediaContent()))
	api := NewWithIdentity(app, service, slog.New(slog.NewTextHandler(io.Discard, nil)))
	mux := http.NewServeMux()
	mux.Handle("/api/", api)
	mux.Handle("/healthz", api)
	mux.HandleFunc("/__test/provider", func(w http.ResponseWriter, r *http.Request) {
		state := r.URL.Query().Get("state")
		callback := func(code string) string {
			return "/api/v1/auth/yandex/callback?" + url.Values{"state": {state}, "code": {code}}.Encode()
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Referrer-Policy", "no-referrer")
		values := crossPlatformProviderValues(callback,
			"/api/v1/auth/yandex/callback?"+url.Values{
				"state": {state}, "error": {"access_denied"},
			}.Encode(),
		)
		if err := providerPage.Execute(w, values); err != nil {
			return
		}
	})
	site, err := webui.New(meetings.NewService(store, time.Now), directory, origin)
	if err != nil {
		t.Fatal(err)
	}

	mux.Handle("/", site)
	server.Config.Handler = mux
	server.StartTLS()
	defer server.Close()
	config := iosFixtureConfig{
		Origin:      origin,
		Certificate: base64.StdEncoding.EncodeToString(server.Certificate().Raw),
		Cases: map[string]iosFixtureCredential{
			"invite-rsvp":  iosCredential(t, service, "lena"),
			"invite-owner": iosCredential(t, service, "sasha"),
			"invite-error": iosCredential(t, service, "android"),
		},
	}
	seedCrossPlatformMemoryFixture(t, store, service, app, config.Cases)
	data, err := json.Marshal(config)
	if err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(os.Getenv("SOMEWHERE_CROSS_CONFIG"), data, 0o600); err != nil {
		t.Fatal(err)
	}

	fmt.Println("SOMEWHERE_CROSS_READY=" + origin)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	<-ctx.Done()
}
