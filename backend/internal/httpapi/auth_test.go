package httpapi

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

type safeAuthLogs struct {
	mu     sync.Mutex
	buffer bytes.Buffer
}

func (b *safeAuthLogs) Write(data []byte) (int, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buffer.Write(data)
}
func (b *safeAuthLogs) String() string { b.mu.Lock(); defer b.mu.Unlock(); return b.buffer.String() }

type fakeAuthProvider struct{}

func (fakeAuthProvider) AuthorizationURL(state, challenge string) string {
	return "https://provider.example/authorize?" + url.Values{"state": {state}, "code_challenge": {challenge}}.Encode()
}
func (fakeAuthProvider) Verify(context.Context, string, string) (identity.Profile, error) {
	return identity.Profile{Subject: "123", DisplayName: "Лена"}, nil
}

func TestAuthOpenAPIResponses(t *testing.T) {
	store := seededStore(t)
	var logs safeAuthLogs
	server := httptest.NewUnstartedServer(nil)
	origin := "https://" + server.Listener.Addr().String()
	service, err := identity.New(identity.Config{PublicOrigin: origin, NativeCallbacks: map[string]string{"ios": "group-planning-ios://auth/callback", "android": "group-planning-android://auth/callback"}, SessionTTL: time.Hour}, memory.NewIdentity(), fakeAuthProvider{}, time.Now, func(ctx context.Context, token string) (bool, error) {
		_, err := meetings.Preview(ctx, store, token)
		return err == nil, err
	})
	if err != nil {
		t.Fatal(err)
	}
	server.Config.Handler = NewWithIdentity(store, service, slog.New(slog.NewJSONHandler(&logs, nil)))
	server.StartTLS()
	defer server.Close()
	jar, _ := cookiejar.New(nil)
	webCopy := *server.Client()
	web := &webCopy
	web.Jar = jar
	web.CheckRedirect = func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }
	anonymousCopy := *server.Client()
	anonymous := &anonymousCopy
	anonymous.Jar = nil
	anonymous.CheckRedirect = web.CheckRedirect
	var captures []capturedResponse
	request := func(client *http.Client, method, path, operationPath string, body any, headers map[string]string, expected int) *http.Response {
		t.Helper()
		var reader io.Reader
		if body != nil {
			data, _ := json.Marshal(body)
			reader = bytes.NewReader(data)
		}
		req, err := http.NewRequest(method, server.URL+path, reader)
		if err != nil {
			t.Fatal(err)
		}
		if body != nil {
			req.Header.Set("Content-Type", "application/json")
		}
		for k, v := range headers {
			req.Header.Set(k, v)
		}
		response, err := client.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		data, err := io.ReadAll(response.Body)
		response.Body.Close()
		if err != nil {
			t.Fatal(err)
		}
		if response.StatusCode != expected {
			t.Fatalf("%s %s: %d %s", method, operationPath, response.StatusCode, data)
		}
		var payload json.RawMessage
		if len(data) > 0 {
			if !json.Valid(data) {
				t.Fatal("non JSON auth response")
			}
			payload = data
		}
		captures = append(captures, capturedResponse{Path: operationPath, Method: strings.ToLower(method), Status: response.StatusCode, Headers: response.Header, Body: payload})
		response.Body = io.NopCloser(bytes.NewReader(data))
		return response
	}
	startBody := map[string]any{"client_kind": "web", "return_context": map[string]string{"kind": "invitation", "token": invitationToken}}
	request(web, "POST", "/api/v1/auth/yandex/start", "/api/v1/auth/yandex/start", startBody, map[string]string{"Origin": "https://attacker.example"}, 403)
	startedResponse := request(web, "POST", "/api/v1/auth/yandex/start", "/api/v1/auth/yandex/start", startBody, map[string]string{"Origin": origin}, 200)
	var started authStartedResponse
	if err := json.NewDecoder(startedResponse.Body).Decode(&started); err != nil {
		t.Fatal(err)
	}
	authURL, _ := url.Parse(started.AuthorizationURL)
	callbackPath := "/api/v1/auth/yandex/callback?" + url.Values{"state": {authURL.Query().Get("state")}, "code": {"private-provider-code"}}.Encode()
	request(anonymous, "GET", callbackPath, "/api/v1/auth/yandex/callback", nil, nil, 403)
	callback := request(web, "GET", callbackPath, "/api/v1/auth/yandex/callback", nil, nil, 303)
	if len(callback.Cookies()) != 2 {
		t.Fatal("missing session/binding cookies")
	}
	sessionSecret := ""
	for _, cookie := range callback.Cookies() {
		if !cookie.Secure || !cookie.HttpOnly || cookie.SameSite != http.SameSiteLaxMode || cookie.Path != "/" || cookie.Domain != "" {
			t.Fatal("unsafe cookie flags")
		}
		if cookie.Name == sessionCookie {
			sessionSecret = cookie.Value
		}
	}
	destination, _ := url.Parse(callback.Header.Get("Location"))
	if destination.Query().Get("token") != invitationToken || destination.Query().Has("code") || destination.Query().Has("state") {
		t.Fatal("callback lost invitation or leaked provider parameters")
	}
	me := request(web, "GET", "/api/v1/me", "/api/v1/me", nil, nil, 200)
	var profile meResponse
	data, _ := io.ReadAll(me.Body)
	if bytes.Contains(data, []byte(sessionSecret)) {
		t.Fatal("web secret exposed as JSON")
	}
	if err := json.Unmarshal(data, &profile); err != nil || profile.CSRFToken == nil {
		t.Fatal("missing profile/CSRF", err)
	}
	if err := store.View(context.Background(), func(reader meetings.Reader) error {
		responses, err := reader.RSVPs(meetingID)
		if err == nil && len(responses) != 1 {
			t.Fatal("login changed RSVP")
		}
		return err
	}); err != nil {
		t.Fatal(err)
	}
	// A repeat login must retain both the local profile ID and existing owned data.
	if err := store.Update(context.Background(), func(writer meetings.Writer) error {
		return writer.SaveMeeting(meetings.Meeting{ID: "existing", OrganizerID: profile.User.ID, Title: "Сохранённая встреча"})
	}); err != nil {
		t.Fatal(err)
	}
	request(web, "POST", "/api/v1/auth/logout", "/api/v1/auth/logout", nil, map[string]string{"Origin": origin}, 403)
	request(web, "POST", "/api/v1/auth/logout", "/api/v1/auth/logout", nil, map[string]string{"Origin": "https://attacker.example", "X-CSRF-Token": *profile.CSRFToken}, 403)
	request(web, "POST", "/api/v1/auth/logout", "/api/v1/auth/logout", nil, map[string]string{"Origin": origin, "X-CSRF-Token": *profile.CSRFToken}, 204)
	request(web, "GET", "/api/v1/me", "/api/v1/me", nil, nil, 401)
	request(anonymous, "GET", "/api/v1/me", "/api/v1/me", nil, map[string]string{"Cookie": sessionCookie + "=" + sessionSecret}, 401)
	request(anonymous, "GET", callbackPath, "/api/v1/auth/yandex/callback", nil, nil, 400)
	// Native clients never receive a session in a redirect; only a verifier-bound code.
	for _, kind := range []string{"ios", "android"} {
		verifier := strings.Repeat("v", 43)
		hash := sha256.Sum256([]byte(verifier))
		challenge := base64.RawURLEncoding.EncodeToString(hash[:])
		body := map[string]any{"client_kind": kind, "app_challenge": challenge, "return_context": map[string]string{"kind": "home"}}
		body["callback_url"] = "https://attacker.example/callback"
		request(anonymous, "POST", "/api/v1/auth/yandex/start", "/api/v1/auth/yandex/start", body, nil, 400)
		delete(body, "callback_url")
		response := request(anonymous, "POST", "/api/v1/auth/yandex/start", "/api/v1/auth/yandex/start", body, nil, 200)
		var attempt authStartedResponse
		if err := json.NewDecoder(response.Body).Decode(&attempt); err != nil {
			t.Fatal(err)
		}
		u, _ := url.Parse(attempt.AuthorizationURL)
		path := "/api/v1/auth/yandex/callback?" + url.Values{"state": {u.Query().Get("state")}, "code": {"private-provider-code"}}.Encode()
		response = request(anonymous, "GET", path, "/api/v1/auth/yandex/callback", nil, nil, 303)
		destination, _ := url.Parse(response.Header.Get("Location"))
		code := destination.Query().Get("handoff_code")
		if code == "" || len(response.Cookies()) != 0 {
			t.Fatal("native session in callback")
		}
		exchange := map[string]string{"attempt_id": attempt.AttemptID, "handoff_code": code, "app_verifier": strings.Repeat("x", 43)}
		request(anonymous, "POST", "/api/v1/auth/mobile/exchange", "/api/v1/auth/mobile/exchange", exchange, nil, 400)
		exchange["app_verifier"] = verifier
		response = request(anonymous, "POST", "/api/v1/auth/mobile/exchange", "/api/v1/auth/mobile/exchange", exchange, nil, 200)
		var session exchangeResponse
		if err := json.NewDecoder(response.Body).Decode(&session); err != nil {
			t.Fatal(err)
		}
		response = request(anonymous, "GET", "/api/v1/me", "/api/v1/me", nil, map[string]string{"Authorization": "Bearer " + session.SessionToken}, 200)
		var nativeProfile meResponse
		if err := json.NewDecoder(response.Body).Decode(&nativeProfile); err != nil || nativeProfile.CSRFToken != nil || nativeProfile.User.ID != profile.User.ID {
			t.Fatal("native created duplicate profile", err)
		}
		request(anonymous, "GET", "/api/v1/me", "/api/v1/me", nil, map[string]string{"Authorization": "Bearer " + session.SessionToken, "Cookie": sessionCookie + "=" + sessionSecret}, 401)
		request(anonymous, "POST", "/api/v1/auth/mobile/exchange", "/api/v1/auth/mobile/exchange", exchange, nil, 400)
		request(anonymous, "POST", "/api/v1/auth/logout", "/api/v1/auth/logout", nil, map[string]string{"Authorization": "Bearer " + session.SessionToken}, 204)
		request(anonymous, "GET", "/api/v1/me", "/api/v1/me", nil, map[string]string{"Authorization": "Bearer " + session.SessionToken}, 401)
		if strings.Contains(logs.String(), code) || strings.Contains(logs.String(), session.SessionToken) {
			t.Fatal("native secrets in logs")
		}
	}
	if err := store.View(context.Background(), func(reader meetings.Reader) error {
		meeting, err := reader.Meeting("existing")
		if err == nil && meeting.OrganizerID != profile.User.ID {
			t.Fatal("login lost owned meeting")
		}
		return err
	}); err != nil {
		t.Fatal(err)
	}
	for _, secret := range []string{sessionSecret, invitationToken, "private-provider-code"} {
		if strings.Contains(logs.String(), secret) {
			t.Fatal("auth secrets in logs")
		}
	}
	if output := os.Getenv("SOMEWHERE_CONTRACT_CAPTURE"); output != "" {
		data, _ := json.Marshal(captures)
		if err := os.WriteFile(output+".auth", data, 0600); err != nil {
			t.Fatal(err)
		}
	}
}

func TestAuthDisabledAndUnknownInputs(t *testing.T) {
	handler := New(memory.New(), slog.New(slog.NewTextHandler(io.Discard, nil)))
	for path, status := range map[string]int{"/api/v1/auth/yandex/start": 503, "/api/v1/auth/mobile/exchange": 503, "/api/v1/me": 401, "/api/v1/auth/logout": 401} {
		method := "POST"
		if strings.HasSuffix(path, "/me") {
			method = "GET"
		}
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, httptest.NewRequest(method, path, nil))
		if response.Code != status {
			t.Fatalf("disabled %s: %d", path, response.Code)
		}
	}
	for _, raw := range []string{`{"kind":"home","token":""}`, `{"kind":"home","token":null}`, `{"kind":"home","kind":"invitation"}`, `{"kind":"home","return_url":"https://attacker.example"}`} {
		if _, ok := parseAuthContext(json.RawMessage(raw)); ok {
			t.Fatal("accepted invalid return context")
		}
	}
	request := httptest.NewRequest("GET", "/api/v1/auth/yandex/callback?state=ok&code=ok&bad=%ZZ", nil)
	if _, err := parseCallbackQuery(request); err == nil {
		t.Fatal("ignored malformed query")
	}
}
