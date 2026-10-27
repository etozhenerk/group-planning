package httpapi

import (
	"context"
	"errors"
	"fmt"
	"html/template"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
	"github.com/etozhenerk/group-planning/backend/internal/webui"
)

// browserProvider is compiled only into Go tests, never cmd/server.
type browserProvider struct{ origin string }

var browserProfiles = []struct{ code, name string }{
	{"sasha", "Саша"},
	{"lena", "Лена"},
	{"misha", "Миша"},
	{"anya", "Аня"},
	{"dima", "Дима"},
	{"katya", "Катя"},
	{"oleg", "Олег"},
	{"ira", "Ира"},
	{"profile-fields-full", "Профиль: все поля"},
	{"profile-fields-partial", "Профиль: неполная дата"},
	{"profile-fields-clear", "Профиль: очищение"},
}

func (p browserProvider) AuthorizationURL(state, challenge string) string {
	return p.origin + "/__test/provider?" + url.Values{"state": {state}, "challenge": {challenge}}.Encode()
}

func (p browserProvider) Verify(ctx context.Context, code, verifier string) (identity.Profile, error) {
	if strings.HasPrefix(code, "profile-fields-") && verifier != "" {
		return profileFieldsLogin(ctx, code, p.origin)
	}

	for _, profile := range browserProfiles {
		if profile.code == code && verifier != "" {
			return identity.Profile{Subject: "browser-test-" + code, DisplayName: profile.name}, nil
		}
	}

	return identity.Profile{}, errors.New("invalid browser test code")
}

var providerPage = template.Must(template.New("provider").Parse(`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Тестовый вход Somewhere</title><body style="font-family:system-ui;background:#24252a;color:#f5f4f1;padding:48px 24px;max-width:500px;margin:auto"><h1>Тестовый вход</h1><p>Локальный демостенд. Выберите профиль для проверки приглашений и переписки. Реальный Яндекс ID не используется.</p>{{range .Profiles}}<p><a style="display:block;padding:18px;background:#e0dce8;color:#27252d;border-radius:16px;text-align:center;text-decoration:none" href="{{.URL}}">Войти как {{.Name}}</a></p>{{end}}<p><a style="color:#b9b9c2" href="{{.Cancel}}">Отменить вход</a></p></body></html>`))

// TestBrowserFixture is an opt-in, loopback-only HTTP integration harness. The
// normal go test run skips it; no production env or route can enable this provider.
func TestBrowserFixture(t *testing.T) {
	if os.Getenv("SOMEWHERE_BROWSER_FIXTURE") != "1" {
		t.Skip("browser fixture is opt-in")
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
		address = "127.0.0.1:8443"
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
	identities := memory.NewIdentity()
	config := identity.Config{PublicOrigin: origin, SessionTTL: time.Hour}
	var provider identity.Provider = browserProvider{origin}
	visual := os.Getenv("SOMEWHERE_BROWSER_DESIGN") == "1"
	if visual {
		provider = browserDesignProvider{browserProvider{origin}}
		config.NativeCallbacks = map[string]string{"ios": "group-planning-ios://auth/callback"}
	}

	service, err := identity.New(config, identities, provider, time.Now, func(ctx context.Context, token string) (bool, error) {
		_, err := meetings.Preview(ctx, store, token)
		if errors.Is(err, meetings.ErrNotFound) {
			return false, nil
		}

		return err == nil, err
	})
	if err != nil {
		t.Fatal(err)
	}

	app, stream := browserChatFixture(t, store, service)
	if visual {
		seedNativeDesignFixture(t, store, identities, service, app)
		if err := app.InitializeChatReadState(t.Context()); err != nil {
			t.Fatal(err)
		}
	}

	api := NewWithRealtime(app, service, fixtureSupport(), slog.New(slog.NewTextHandler(io.Discard, nil)), stream, testAccounts(store, identities, service, time.Now))
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
		values := struct {
			Profiles []struct{ Name, URL string }
			Cancel   string
		}{Cancel: "/api/v1/auth/yandex/callback?" + url.Values{"state": {state}, "error": {"access_denied"}}.Encode()}
		for _, profile := range browserProfiles {
			values.Profiles = append(values.Profiles, struct{ Name, URL string }{profile.name, callback(profile.code)})
		}

		if err := providerPage.Execute(w, values); err != nil {
			return
		}
	})
	site, err := webui.New(app, directory, origin)
	if err != nil {
		t.Fatal(err)
	}

	mux.Handle("/", site)
	server.Config.Handler = mux
	server.StartTLS()
	defer server.Close()
	fmt.Println("SOMEWHERE_BROWSER_READY=" + origin)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	worker, err := meetings.NewTransitionWorker(app, meetings.DefaultTransitionOptions(), nil)
	if err != nil {
		t.Fatal(err)
	}

	finished := make(chan struct{})
	go func() {
		defer close(finished)
		worker.Run(ctx)
	}()
	pollWorker, err := meetings.NewDatePollWorker(app, meetings.DefaultTransitionOptions(), nil)
	if err != nil {
		t.Fatal(err)
	}

	pollFinished := make(chan struct{})
	go func() {
		defer close(pollFinished)
		pollWorker.Run(ctx)
	}()
	placeWorker, err := meetings.NewPlacePollWorker(app, meetings.DefaultTransitionOptions(), nil)
	if err != nil {
		t.Fatal(err)
	}

	placeFinished := make(chan struct{})
	go func() {
		defer close(placeFinished)
		placeWorker.Run(ctx)
	}()
	<-ctx.Done()
	<-finished
	<-pollFinished
	<-placeFinished
}
