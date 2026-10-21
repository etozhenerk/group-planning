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
	store := memory.New()
	owner := iosCredential(t, service, "invite-owner")
	seedIOSInvitation(t, store, service, owner,
		"22222222-2222-4222-8222-222222222222", iosInvitationToken, "Настолки у Саши",
		"33333333-3333-4333-8333-333333333333", "44444444-4444-4444-8444-444444444444")
	seedIOSInvitation(t, store, service, owner,
		"55555555-5555-4555-8555-555555555555", "QkJCQkJCQkJCQkJCQkJCQg", "Проверка повтора",
		"66666666-6666-4666-8666-666666666666", "77777777-7777-4777-8777-777777777777")
	api := NewWithIdentity(store, service, slog.New(slog.NewTextHandler(io.Discard, nil)))
	server.Config.Handler = faults.handler(api)
	server.StartTLS()
	defer server.Close()
	config := iosFixtureConfig{Origin: origin, Certificate: base64.StdEncoding.EncodeToString(server.Certificate().Raw), Cases: map[string]iosFixtureCredential{}}
	for _, name := range []string{"empty", "list-error", "draft", "lost-create"} {
		config.Cases[name] = iosCredential(t, service, name)
	}

	config.Cases["invite-owner"] = owner
	config.Cases["invite-rsvp"] = iosCredential(t, service, "invite-guest-rsvp")
	config.Cases["invite-rsvp-reentry"] = iosCredential(t, service, "invite-guest-rsvp")
	config.Cases["invite-error"] = iosCredential(t, service, "invite-guest-error")

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
	faults.verify(t, "invitation")
	faults.mu.Lock()
	defer faults.mu.Unlock()
	if !faults.listFailed {
		t.Error("Android UI did not exercise list failure and retry")
	}

	if faults.posts != 2 || len(faults.keys) != 1 || faults.keys[""] || len(faults.ids) != 1 {
		t.Errorf("Android create retry: posts=%d, keys=%d, IDs=%d", faults.posts, len(faults.keys), len(faults.ids))
	}
}
