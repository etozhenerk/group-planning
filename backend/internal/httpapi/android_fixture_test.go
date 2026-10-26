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
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

// TestAndroidFixture exposes the real API to the isolated Android QA target.
// The existing native test provider issues sessions; this does not verify OAuth UI.
func TestAndroidFixture(t *testing.T) {
	if os.Getenv("SOMEWHERE_ANDROID_FIXTURE") != "1" {
		t.Skip("Android UI fixture is opt-in")
	}

	scope := os.Getenv("SOMEWHERE_ANDROID_FIXTURE_SCOPE")
	if scope != "" && scope != "all" && scope != "persistence" && scope != "calendar" && scope != "auth" && scope != "polls" && scope != "saved" && scope != "places" && scope != "tasks" && scope != "covers" && scope != "account" {
		t.Fatal("unknown Android fixture scope")
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
	identities := memory.NewIdentity()
	service, err := identity.New(identity.Config{
		PublicOrigin: origin, SessionTTL: time.Hour,
		NativeCallbacks: map[string]string{"ios": "group-planning-ios://auth/callback"},
	}, identities, iosFixtureProvider{}, time.Now, func(context.Context, string) (bool, error) { return false, nil })
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
	seedIOSFeed(t, store, service, owner)
	seedIOSInvitation(t, store, service, owner,
		"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "RUVFRUVFRUVFRUVFRUVFRQ", "После перезапуска",
		"ffffffff-ffff-4fff-8fff-ffffffffffff", "12121212-1212-4212-8212-121212121212")
	feed := &iosFeedFaults{keys: map[string]bool{}, ids: map[string]bool{}}
	persistence := &iosFeedFaults{scenario: "feed-persistence", keys: map[string]bool{}, ids: map[string]bool{}}
	app := meetings.NewService(store, time.Now, meetings.WithMediaContent(memory.NewMediaContent()))
	seedNativeMemoryFixture(t, store, service, app, owner)
	api := NewWithSupport(app, service, fixtureSupport(), slog.New(slog.NewTextHandler(io.Discard, nil)), testAccounts(store, identities, service, time.Now))
	savedFaults := &nativeSavedInvitationFaults{}
	placeFaults := &nativePlaceFaults{service: meetings.NewService(store, time.Now)}
	taskFaults := &nativePreparationFaults{store: store, service: meetings.NewService(store, time.Now)}
	coverFaults := &nativeCoverFaults{}
	pollFaults := &nativePollFaults{}
	server.Config.Handler = pollFaults.handler(coverFaults.handler(taskFaults.handler(placeFaults.handler(savedFaults.handler(persistence.handler(feed.handler(faults.handler(api))))))))
	server.StartTLS()
	defer server.Close()
	config := iosFixtureConfig{Origin: origin, Certificate: base64.StdEncoding.EncodeToString(server.Certificate().Raw), Cases: map[string]iosFixtureCredential{}}
	config.Cases["design"] = seedNativeDesignFixture(t, store, identities, service, app)
	for _, name := range []string{"account", "account-large", "empty", "list-error", "draft", "lost-create", "cover-create", "cover-system", "cover-large"} {
		config.Cases[name] = iosCredential(t, service, name)
	}

	config.Cases["cover-edit"] = seedNativeCoverFixture(t, store, service)
	calendarOwner := iosCredential(t, service, "calendar")
	seedIOSCalendar(t, store, service, calendarOwner)
	config.Cases["calendar"] = calendarOwner
	config.Cases["calendar-large"] = calendarOwner
	config.Cases["calendar-empty"] = iosCredential(t, service, "calendar-empty")
	config.Cases["saved-invitations"] = seedNativeSavedInvitation(t, store, service, "saved-invitations")
	config.Cases["saved-error"] = seedNativeSavedInvitation(t, store, service, "saved-error")
	config.Cases["saved-empty"] = iosCredential(t, service, "saved-empty")
	config.Cases["place-owner"] = seedNativePlaceFixture(t, store, service, "owner", 100)
	config.Cases["place-close"] = seedNativePlaceFixture(t, store, service, "close", 200)
	config.Cases["place-rejected"] = seedNativePlaceFixture(t, store, service, "rejected", 300)
	config.Cases["place-cancelled"] = seedNativePlaceFixture(t, store, service, "cancelled", 400)
	config.Cases["task-owner"] = seedNativePreparationFixture(t, store, service, "owner", 100)
	config.Cases["task-recipient"] = seedNativePreparationFixture(t, store, service, "recipient", 200)
	config.Cases["task-decline"] = seedNativePreparationFixture(t, store, service, "decline", 300)
	config.Cases["task-cancel"] = seedNativePreparationFixture(t, store, service, "cancel", 400)
	config.Cases["task-conflict"] = seedNativePreparationFixture(t, store, service, "conflict", 500)
	config.Cases["poll-owner"] = seedNativePollFixture(t, store, service)
	config.Cases["poll-tie"] = seedNativePollBoundary(t, store, service, "tie", 200)
	config.Cases["poll-time"] = seedNativePollBoundary(t, store, service, "time", 300)
	config.Cases["poll-hidden"] = seedNativePollBoundary(t, store, service, "hidden", 400)

	config.Cases["invite-owner"] = owner
	config.Cases["memories"] = owner
	config.Cases["feed-owner"] = owner
	config.Cases["feed-persistence"] = owner
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
	if scope == "all" || scope == "covers" {
		coverFaults.verify(t, store)
	}

	if scope == "all" || scope == "tasks" {
		verifyNativePreparationFixture(t, store, taskFaults)
	}

	if scope == "all" || scope == "places" {
		verifyNativePlaceFixture(t, store)
	}

	if scope == "all" || scope == "polls" {
		verifyNativePollFixture(t, store)
		pollFaults.verify(t)
	}

	if scope == "account" || scope == "covers" || scope == "tasks" || scope == "places" || scope == "saved" || scope == "calendar" || scope == "auth" || scope == "polls" {
		return
	}

	persistence.mu.Lock()
	if persistence.posts != 2 || len(persistence.keys) != 1 || persistence.keys[""] || len(persistence.ids) != 1 {
		t.Errorf("Android process restart retry: posts=%d keys=%d IDs=%d", persistence.posts, len(persistence.keys), len(persistence.ids))
	}

	persistence.mu.Unlock()
	if scope == "persistence" {
		return
	}

	faults.verify(t, "invitation")
	feed.verify(t)
	faults.mu.Lock()
	defer faults.mu.Unlock()
	if !faults.listFailed {
		t.Error("Android UI did not exercise list failure and retry")
	}

	if faults.posts != 2 || len(faults.keys) != 1 || faults.keys[""] || len(faults.ids) != 1 {
		t.Errorf("Android create retry: posts=%d, keys=%d, IDs=%d", faults.posts, len(faults.keys), len(faults.ids))
	}
}
