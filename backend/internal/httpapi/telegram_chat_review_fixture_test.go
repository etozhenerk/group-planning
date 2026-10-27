package httpapi

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
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

type chatReviewProvider struct{ browserProvider }

func (p chatReviewProvider) Verify(_ context.Context, code, verifier string) (identity.Profile, error) {
	for _, person := range chatReviewPeople {
		if code == person.code && verifier != "" {
			return identity.Profile{Subject: "chat-review-" + code, DisplayName: person.name}, nil
		}
	}

	return identity.Profile{}, errors.New("unknown chat review profile")
}

// TestTelegramChatReviewFixture is a separate opt-in process. No runtime flag can
// enable this provider, control file or synthetic data in the production binary.
func TestTelegramChatReviewFixture(t *testing.T) {
	if os.Getenv("SOMEWHERE_CHAT_REVIEW") != "1" {
		t.Skip("chat review fixture is opt-in")
	}

	directory := os.Getenv("SOMEWHERE_CHAT_REVIEW_DIR")
	if !filepath.IsAbs(directory) {
		t.Fatal("private fixture directory must be absolute and new")
	}

	if err := os.Mkdir(directory, 0o700); err != nil {
		t.Fatal(err)
	}

	address := os.Getenv("SOMEWHERE_CHAT_REVIEW_ADDR")
	if address == "" {
		address = "127.0.0.1:0"
	}

	host, _, err := net.SplitHostPort(address)
	if err != nil || host != "127.0.0.1" {
		t.Fatal("chat review fixture must bind to IPv4 loopback")
	}

	listener, err := net.Listen("tcp", address)
	if err != nil {
		t.Fatal(err)
	}

	server := httptest.NewUnstartedServer(nil)
	server.Listener.Close()
	server.Listener = listener
	origin := "https://" + listener.Addr().String()
	store, identities, media := memory.New(), memory.NewIdentity(), memory.NewMediaContent()
	auth := newChatReviewAuth(t, origin, identities)
	app := meetings.NewService(store, func() time.Time { return chatReviewNow }, meetings.WithMediaContent(media))
	seedChatReview(t, store, identities, media)
	api := NewWithSupport(app, auth, fixtureSupport(), slog.New(slog.NewTextHandler(io.Discard, nil)), testAccounts(store, identities, auth, time.Now))
	controls := &chatReviewFaults{directory: directory, auth: auth, consumed: map[string]bool{}}
	mux := http.NewServeMux()
	mux.Handle("/api/", controls.handler(api))
	mux.Handle("/healthz", api)
	mux.HandleFunc("/__test/provider", chatReviewProviderPage)
	if dist := os.Getenv("SOMEWHERE_BROWSER_DIST"); dist != "" {
		site, err := webui.New(app, dist, origin)
		if err != nil {
			t.Fatal(err)
		}

		mux.Handle("/", site)
	}

	server.Config.Handler = mux
	server.StartTLS()
	defer server.Close()
	config := iosFixtureConfig{Origin: origin, Certificate: base64.StdEncoding.EncodeToString(server.Certificate().Raw), Cases: map[string]iosFixtureCredential{}}
	for _, person := range chatReviewPeople[:3] {
		config.Cases["chat-review-"+person.code] = iosCredential(t, auth, person.code)
	}

	config.Cases["design"] = config.Cases["chat-review-sasha"]
	writeChatReviewJSON(t, filepath.Join(directory, "config.json"), config)
	for _, person := range chatReviewPeople[:3] {
		config.Cases["design"] = config.Cases["chat-review-"+person.code]
		writeChatReviewJSON(t, filepath.Join(directory, "config-"+person.code+".json"), config)
	}

	writeChatReviewJSON(t, filepath.Join(directory, "control.json"), chatReviewControl{})
	writeChatReviewJSON(t, filepath.Join(directory, "metadata.json"), map[string]any{
		"fixture": "telegram-chat-review-v1", "origin": origin, "clock": chatReviewNow,
		"visualMeeting": chatReviewVisualID, "functionalMeeting": chatReviewMeetingID,
		"actors":          map[string]string{"sasha": chatReviewActor(0).ID, "lena": chatReviewActor(1).ID, "tim": chatReviewActor(2).ID},
		"visualPlacePoll": chatReviewID("a3", 1),
		"visualMessages":  []string{chatReviewID("d2", 1), chatReviewID("d2", 2), chatReviewID("d2", 3)},
		"reactionMessage": chatReviewID("d0", 65), "toggleMessage": chatReviewID("d0", 60),
		"attachmentMessage": chatReviewID("d0", 62), "systemEntry": chatReviewID("d0", 61),
		"tasks": map[string]string{"visual": chatReviewID("a2", 1), "sashaOffer": chatReviewID("a1", 1), "timAccept": chatReviewID("a1", 2), "timDecline": chatReviewID("a1", 3), "timCompleteDetails": chatReviewID("a1", 4), "timCompleteInline": chatReviewID("a1", 5), "lenaAcceptedCancel": chatReviewID("a1", 6), "anyone": chatReviewID("a1", 7)},
	})
	if err := os.WriteFile(filepath.Join(directory, "certificate.pem"), pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: server.Certificate().Raw}), 0o600); err != nil {
		t.Fatal(err)
	}

	writeChatReviewAssets(t, directory)
	fmt.Println("SOMEWHERE_CHAT_REVIEW_READY=" + origin)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	<-ctx.Done()
}

func newChatReviewAuth(t *testing.T, origin string, identities *memory.Identity) *identity.Service {
	t.Helper()
	auth, err := identity.New(identity.Config{
		PublicOrigin: origin, SessionTTL: 8 * time.Hour,
		NativeCallbacks: map[string]string{"ios": "group-planning-ios://auth/callback", "android": "group-planning-android://auth/callback"},
	}, identities, chatReviewProvider{browserProvider{origin}}, time.Now, func(context.Context, string) (bool, error) { return false, nil })
	if err != nil {
		t.Fatal(err)
	}

	return auth
}

func chatReviewProviderPage(w http.ResponseWriter, r *http.Request) {
	values := struct {
		Profiles []struct{ Name, URL string }
		Cancel   string
	}{
		Cancel: "/api/v1/auth/yandex/callback?" + url.Values{"state": {r.URL.Query().Get("state")}, "error": {"access_denied"}}.Encode(),
	}
	for _, person := range chatReviewPeople {
		values.Profiles = append(values.Profiles, struct{ Name, URL string }{person.name, "/api/v1/auth/yandex/callback?" + url.Values{"state": {r.URL.Query().Get("state")}, "code": {person.code}}.Encode()})
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Referrer-Policy", "no-referrer")
	if err := providerPage.Execute(w, values); err != nil {
		return
	}
}

func writeChatReviewJSON(t *testing.T, path string, value any) {
	t.Helper()
	data, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(path, append(data, '\n'), 0o600); err != nil {
		t.Fatal(err)
	}
}
