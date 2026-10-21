package httpapi

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"io"
	"log/slog"
	"net"
	"net/http/httptest"
	"os"
	"os/signal"
	"syscall"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

// TestAndroidFixture exposes the real API to the isolated Android QA target.
// The existing native test provider issues sessions; this does not verify OAuth UI.
func TestAndroidFixture(t *testing.T) {
	if os.Getenv("SOMEWHERE_ANDROID_FIXTURE") != "1" {
		t.Skip("Android UI fixture is opt-in")
	}

	path := os.Getenv("SOMEWHERE_ANDROID_FIXTURE_CONFIG")
	if path == "" {
		t.Fatal("missing private config path")
	}

	server := httptest.NewUnstartedServer(nil)
	server.Listener.Close()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}

	server.Listener = listener
	origin := "https://" + listener.Addr().String()
	service, err := identity.New(identity.Config{
		PublicOrigin: origin, SessionTTL: time.Hour,
		NativeCallbacks: map[string]string{"ios": "group-planning-ios://auth/callback"},
	}, memory.NewIdentity(), iosFixtureProvider{}, time.Now, func(context.Context, string) (bool, error) { return false, nil })
	if err != nil {
		t.Fatal(err)
	}

	faults := &iosFixtureFaults{keys: map[string]bool{}, ids: map[string]bool{}}
	api := NewWithIdentity(memory.New(), service, slog.New(slog.NewTextHandler(io.Discard, nil)))
	server.Config.Handler = faults.handler(api)
	server.StartTLS()
	defer server.Close()
	config := iosFixtureConfig{Origin: origin, Certificate: base64.StdEncoding.EncodeToString(server.Certificate().Raw), Cases: map[string]iosFixtureCredential{}}
	for _, name := range []string{"empty", "list-error", "draft", "lost-create"} {
		config.Cases[name] = iosCredential(t, service, name)
	}

	data, err := json.Marshal(config)
	if err != nil {
		t.Fatal(err)
	}

	if err = os.WriteFile(path, data, 0o600); err != nil {
		t.Fatal(err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	<-ctx.Done()
	faults.mu.Lock()
	defer faults.mu.Unlock()
	if !faults.listFailed {
		t.Error("Android UI did not exercise list failure and retry")
	}

	if faults.posts != 2 || len(faults.keys) != 1 || faults.keys[""] || len(faults.ids) != 1 {
		t.Errorf("Android create retry: posts=%d, keys=%d, IDs=%d", faults.posts, len(faults.keys), len(faults.ids))
	}
}
