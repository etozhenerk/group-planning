package httpapi

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http/httptest"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

type iosFixtureCredential struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expiresAt"`
}

type iosFixtureConfig struct {
	Origin      string                          `json:"origin"`
	Certificate string                          `json:"certificate"`
	Cases       map[string]iosFixtureCredential `json:"cases"`
}

type iosFixtureProvider struct{}

func (iosFixtureProvider) AuthorizationURL(state, _ string) string {
	return "https://provider.example.test/?" + url.Values{"state": {state}}.Encode()
}

func (iosFixtureProvider) Verify(_ context.Context, code, _ string) (identity.Profile, error) {
	name := "Саша"
	if strings.HasPrefix(code, "invite-guest") {
		name = "Лена"
	}

	return identity.Profile{Subject: "ios-ui-" + code, DisplayName: name}, nil
}

// TestIOSFixture serves real native API operations in an isolated test process.
// Its provider, credentials and fault injection never enter the server binary.
func TestIOSFixture(t *testing.T) {
	if os.Getenv("SOMEWHERE_IOS_FIXTURE") != "1" {
		t.Skip("iOS fixture is opt-in")
	}

	path := os.Getenv("SOMEWHERE_IOS_FIXTURE_CONFIG")
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
	feedOwner := iosCredential(t, service, "feed-owner")
	seedIOSFeed(t, store, service, feedOwner)
	api := NewWithIdentity(meetings.NewService(store, time.Now), service, slog.New(slog.NewTextHandler(io.Discard, nil)))
	feedFaults := &iosFeedFaults{keys: map[string]bool{}, ids: map[string]bool{}}
	server.Config.Handler = feedFaults.handler(faults.handler(api))
	server.StartTLS()
	defer server.Close()
	config := iosFixtureConfig{Origin: origin, Certificate: base64.StdEncoding.EncodeToString(server.Certificate().Raw), Cases: map[string]iosFixtureCredential{}}
	for _, name := range []string{"empty", "list-error", "draft", "lost-create"} {
		config.Cases[name] = iosCredential(t, service, name)
	}

	calendarOwner := iosCredential(t, service, "calendar")
	seedIOSCalendar(t, store, service, calendarOwner)
	config.Cases["calendar"] = calendarOwner
	config.Cases["calendar-large"] = calendarOwner
	config.Cases["calendar-empty"] = iosCredential(t, service, "calendar-empty")
	config.Cases["audit-guest"] = iosCredential(t, service, "invite-guest-audit")
	config.Cases["audit-large-create"] = iosCredential(t, service, "audit-large-create")
	config.Cases["audit-loading"] = feedOwner
	config.Cases["audit-owner"] = feedOwner
	config.Cases["audit-empty"] = iosCredential(t, service, "audit-empty")
	config.Cases["feed-owner"] = feedOwner
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

	fmt.Println("SOMEWHERE_IOS_READY=" + origin)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	<-ctx.Done()
	scope := os.Getenv("SOMEWHERE_IOS_FIXTURE_SCOPE")
	if scope != "feed" && scope != "accessibility" && scope != "calendar" {
		faults.verify(t, scope)
	}

	if scope == "feed" || scope == "" {
		feedFaults.verify(t)
	}
}

func iosCredential(t *testing.T, service *identity.Service, name string) iosFixtureCredential {
	t.Helper()
	ctx := context.Background()
	verifier := strings.Repeat("a", 43)
	digest := sha256.Sum256([]byte(verifier))
	started, err := service.Start(ctx, identity.StartInput{ClientKind: "ios", Context: identity.ReturnContext{Kind: "home"}, AppChallenge: base64.RawURLEncoding.EncodeToString(digest[:])}, "")
	if err != nil {
		t.Fatal(err)
	}

	authorization, err := url.Parse(started.AuthorizationURL)
	if err != nil {
		t.Fatal(err)
	}

	callback, err := service.Callback(ctx, identity.CallbackInput{State: authorization.Query().Get("state"), Code: name})
	if err != nil {
		t.Fatal(err)
	}

	destination, err := url.Parse(callback.RedirectURL)
	if err != nil {
		t.Fatal(err)
	}

	issued, err := service.Exchange(ctx, started.AttemptID, destination.Query().Get("handoff_code"), verifier)
	if err != nil {
		t.Fatal(err)
	}

	return iosFixtureCredential{Token: issued.Secret, ExpiresAt: issued.ExpiresAt}
}
