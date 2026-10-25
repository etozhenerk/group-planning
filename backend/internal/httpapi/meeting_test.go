package httpapi

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

// This provider exists only in tests. Production has no dev-user switch.
type meetingTestProvider struct{}

func (meetingTestProvider) AuthorizationURL(state, challenge string) string {
	return "https://provider.example/authorize?" + url.Values{"state": {state}, "code_challenge": {challenge}}.Encode()
}

func (meetingTestProvider) Verify(_ context.Context, code, _ string) (identity.Profile, error) {
	names := map[string]string{"owner": "Лена", "guest": "Миша", "other": "Катя"}
	name, ok := names[code]
	if !ok {
		return identity.Profile{}, errors.New("unknown test profile")
	}

	email, phone, avatar := code+"@example.test", "+79991234567", "https://avatars.yandex.net/get-yapic/1/a/islands-200"

	return identity.Profile{Subject: code, DisplayName: name, Email: &email, Phone: &phone, AvatarURL: &avatar}, nil
}

type meetingHTTPTest struct {
	t         *testing.T
	server    *httptest.Server
	store     *memory.Store
	app       *meetings.Service
	anonymous *http.Client
	captures  []capturedResponse
	clock     atomic.Int64
	logs      safeAuthLogs
}

func newMeetingHTTPTest(t *testing.T) *meetingHTTPTest {
	t.Helper()
	h := &meetingHTTPTest{t: t, store: memory.New()}
	h.clock.Store(time.Now().Unix())
	h.server = httptest.NewUnstartedServer(nil)
	origin := "https://" + h.server.Listener.Addr().String()
	identities := memory.NewIdentity()
	service, err := identity.New(identity.Config{
		PublicOrigin:    origin,
		SessionTTL:      time.Hour,
		NativeCallbacks: map[string]string{"ios": "group-planning-ios://auth/callback"},
	}, identities, meetingTestProvider{}, func() time.Time { return time.Unix(h.clock.Load(), 0) }, func(ctx context.Context, token string) (bool, error) {
		_, err := meetings.Preview(ctx, h.store, token)
		if errors.Is(err, meetings.ErrNotFound) {
			return false, nil
		}

		return err == nil, err
	})
	if err != nil {
		t.Fatal(err)
	}

	h.app = meetings.NewService(h.store, func() time.Time { return time.Unix(h.clock.Load(), 0) }, meetings.WithMediaContent(memory.NewMediaContent()))
	h.server.Config.Handler = NewWithSupport(h.app, service, fixtureSupport(), slog.New(slog.NewJSONHandler(&h.logs, nil)), testAccounts(h.store, identities, service, func() time.Time { return time.Unix(h.clock.Load(), 0) }))
	h.server.StartTLS()
	t.Cleanup(h.server.Close)
	h.anonymous = h.client(false)

	return h
}

func (h *meetingHTTPTest) client(cookies bool) *http.Client {
	client := *h.server.Client()
	client.CheckRedirect = func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }
	if cookies {
		client.Jar, _ = cookiejar.New(nil)
	} else {
		client.Jar = nil
	}

	return &client
}

func (h *meetingHTTPTest) request(client *http.Client, method, path string, body any, headers map[string]string, expected int) ([]byte, *http.Response) {
	h.t.Helper()
	var reader io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			h.t.Fatal(err)
		}

		reader = bytes.NewReader(data)
	}

	request, err := http.NewRequest(method, h.server.URL+path, reader)
	if err != nil {
		h.t.Fatal(err)
	}

	if body != nil {
		request.Header.Set("Content-Type", "application/json")
	}

	for name, value := range headers {
		request.Header.Set(name, value)
	}

	response, err := client.Do(request)
	if err != nil {
		h.t.Fatal(err)
	}

	data, err := io.ReadAll(response.Body)
	response.Body.Close()
	if err != nil {
		h.t.Fatal(err)
	}

	if response.StatusCode != expected {
		h.t.Fatalf("%s %s: got %d, want %d: %s", method, path, response.StatusCode, expected, data)
	}

	route := strings.Split(path, "?")[0]
	parts := strings.Split(route, "/")
	if len(parts) >= 5 && (parts[3] == "meetings" || parts[3] == "invitations") {
		if parts[3] == "meetings" {
			parts[4] = "{id}"
		} else {
			parts[4] = "{token}"
		}

		if len(parts) >= 7 && parts[3] == "meetings" && (parts[5] == "date-polls" || parts[5] == "place-polls") {
			parts[6] = "{poll_id}"
		}

		if len(parts) >= 7 && parts[3] == "meetings" && parts[5] == "preparation-tasks" {
			parts[6] = "{task_id}"
		}

		if len(parts) >= 8 && parts[3] == "meetings" && parts[5] == "media" {
			parts[6] = "{media_id}"
		}

		if len(parts) >= 8 && parts[3] == "meetings" && parts[5] == "messages" {
			parts[6] = "{entry_id}"
		}

		route = strings.Join(parts, "/")
	}

	var payload json.RawMessage
	if len(data) > 0 {
		payload = data
	}

	h.captures = append(h.captures, capturedResponse{
		Path:    route,
		Method:  strings.ToLower(method),
		Status:  expected,
		Headers: response.Header,
		Body:    payload,
	})

	return data, response
}

func decodeMeetingTest[T any](t *testing.T, data []byte) T {
	t.Helper()
	var value T
	if err := json.Unmarshal(data, &value); err != nil {
		t.Fatal(err)
	}

	return value
}

func (h *meetingHTTPTest) login(client *http.Client, code string, context map[string]string) meResponse {
	data, _ := h.request(client, "POST", "/api/v1/auth/yandex/start", map[string]any{"client_kind": "web", "return_context": context}, map[string]string{"Origin": h.server.URL}, 200)
	started := decodeMeetingTest[authStartedResponse](h.t, data)
	address, _ := url.Parse(started.AuthorizationURL)
	_, response := h.request(client, "GET", "/api/v1/auth/yandex/callback?"+url.Values{"state": {address.Query().Get("state")}, "code": {code}}.Encode(), nil, nil, 303)
	destination, _ := url.Parse(response.Header.Get("Location"))
	if context["kind"] == "invitation" && destination.Query().Get("token") != context["token"] {
		h.t.Fatal("lost original invitation")
	}

	data, _ = h.request(client, "GET", "/api/v1/me", nil, nil, 200)

	return decodeMeetingTest[meResponse](h.t, data)
}

func headersFor(h *meetingHTTPTest, profile meResponse, key string) map[string]string {
	return map[string]string{
		"Origin":          h.server.URL,
		"X-CSRF-Token":    *profile.CSRFToken,
		"Idempotency-Key": key,
	}
}

func testKey(n string) string {
	return "f6597c00-0000-4000-8000-" + strings.Repeat("0", 12-len(n)) + n
}

func TestMeetingOpenAPIResponses(t *testing.T) {
	h := newMeetingHTTPTest(t)
	h.clock.Store(time.Date(2026, 10, 20, 0, 0, 0, 0, time.UTC).Unix())
	ownerClient := h.client(true)
	guestClient := h.client(true)
	otherClient := h.client(true)
	owner := h.login(ownerClient, "owner", map[string]string{"kind": "home"})
	h.request(h.anonymous, "GET", "/api/v1/meetings", nil, nil, 401)
	data, _ := h.request(ownerClient, "GET", "/api/v1/meetings", nil, nil, 200)
	if len(decodeMeetingTest[meetingsPageResponse](t, data).Meetings) != 0 {
		t.Fatal("new profile list not empty")
	}

	input := map[string]any{
		"title":       "Настолки",
		"description": "Описание приглашения",
		"starts_at":   "2026-10-24T19:00:00+03:00",
		"timezone":    "Europe/Moscow",
		"place":       nil,
	}
	h.request(ownerClient, "POST", "/api/v1/meetings", input, map[string]string{"Origin": h.server.URL, "Idempotency-Key": testKey("1")}, 403)
	bad := map[string]any{"title": " ", "starts_at": "2026-10-24T19:00:00+03:00", "timezone": "Europe/Moscow"}
	h.request(ownerClient, "POST", "/api/v1/meetings", bad, headersFor(h, owner, testKey("2")), 422)
	data, _ = h.request(ownerClient, "POST", "/api/v1/meetings", input, headersFor(h, owner, testKey("1")), 201)
	created := decodeMeetingTest[createdMeetingResponse](t, data)
	id := created.Meeting.ID
	base := "/api/v1/meetings/" + id
	address, _ := url.Parse(created.InvitationURL)
	token := strings.TrimPrefix(address.Path, "/i/")
	invite := "/api/v1/invitations/" + token
	data, _ = h.request(ownerClient, "POST", "/api/v1/meetings", input, headersFor(h, owner, testKey("1")), 201)
	if decodeMeetingTest[createdMeetingResponse](t, data).Meeting.ID != id {
		t.Fatal("lost response created duplicate")
	}

	h.request(ownerClient, "GET", base+"/invitation", nil, nil, 200)
	data, _ = h.request(h.anonymous, "GET", invite, nil, nil, 200)
	if got := decodeMeetingTest[previewResponse](t, data).Description; got == nil || *got != "Описание приглашения" {
		t.Fatal("public description missing")
	}

	if len(token) != 22 {
		t.Fatal("new invitation is not compact")
	}

	for _, word := range []string{"organizer_id", "participants", "entries", "display_name"} {
		if bytes.Contains(data, []byte(word)) {
			t.Fatalf("public preview leaked %s", word)
		}
	}

	h.request(h.anonymous, "PUT", invite+"/rsvp", map[string]string{"answer": "going", "expected_revision": "0"}, nil, 401)
	guest := h.login(guestClient, "guest", map[string]string{"kind": "invitation", "token": token})
	data, _ = h.request(guestClient, "GET", invite, nil, nil, 200)
	preview := decodeMeetingTest[previewResponse](t, data)
	if preview.MyRSVP != nil || preview.MyRSVPRevision != "0" {
		t.Fatal("login changed RSVP")
	}

	h.request(guestClient, "GET", base+"/feed", nil, nil, 403)
	h.request(guestClient, "GET", base, nil, nil, 403)
	h.request(guestClient, "GET", base+"/participants", nil, nil, 403)
	// Own link never registers its organizer as a guest.
	h.request(ownerClient, "GET", invite, nil, nil, 200)
	h.request(ownerClient, "PUT", invite+"/rsvp", map[string]string{"answer": "going", "expected_revision": "0"}, headersFor(h, owner, testKey("3")), 403)
	going := map[string]string{"answer": "going", "expected_revision": "0"}
	data, _ = h.request(guestClient, "PUT", invite+"/rsvp", going, headersFor(h, guest, testKey("4")), 200)
	if !decodeMeetingTest[rsvpResponse](t, data).CanAccessFeed {
		t.Fatal("going did not grant access")
	}

	h.request(guestClient, "PUT", base+"/rsvp", going, headersFor(h, guest, testKey("4")), 200)
	data, _ = h.request(guestClient, "GET", base, nil, nil, 200)
	if decodeMeetingTest[meetingResponse](t, data).ParticipantCount != 2 {
		t.Fatal("owner counted twice")
	}

	h.request(guestClient, "GET", "/api/v1/meetings", nil, nil, 200)
	h.request(guestClient, "GET", base+"/invitation", nil, nil, 403)
	data, _ = h.request(ownerClient, "GET", base+"/participants", nil, nil, 200)
	people := decodeMeetingTest[struct {
		Participants []participantResponse `json:"participants"`
	}](t, data)
	if len(people.Participants) != 2 || people.Participants[0].User.DisplayName != "Лена" {
		t.Fatal("profiles missing")
	}

	patch := map[string]any{"place": "Пиццерия", "description": nil, "expected_revision": "2"}
	h.request(guestClient, "PATCH", base, patch, headersFor(h, guest, testKey("5")), 403)
	h.request(ownerClient, "PATCH", base, map[string]string{"title": "Старая форма", "expected_revision": "1"}, headersFor(h, owner, testKey("5")), 409)
	data, _ = h.request(ownerClient, "PATCH", base, patch, headersFor(h, owner, testKey("5")), 200)
	if decodeMeetingTest[meetingResponse](t, data).Description != nil {
		t.Fatal("explicit null did not clear")
	}

	h.request(ownerClient, "PATCH", base, patch, headersFor(h, owner, testKey("5")), 200)
	h.request(ownerClient, "PATCH", base, map[string]string{"title": "Другая правка", "expected_revision": "2"}, headersFor(h, owner, testKey("5")), 409)
	h.request(ownerClient, "PATCH", base, map[string]any{"user_id": guest.User.ID, "expected_revision": "3"}, headersFor(h, owner, testKey("6")), 400)
	h.request(guestClient, "PUT", base+"/rsvp", map[string]any{"user_id": owner.User.ID, "answer": "going", "expected_revision": "1"}, headersFor(h, guest, testKey("6")), 400)
	message := map[string]string{
		"text":              "Принесу настолки <b>и чай</b>",
		"client_request_id": testKey("7"),
	}
	data, _ = h.request(guestClient, "POST", base+"/messages", message, headersFor(h, guest, testKey("7")), 201)
	sent := decodeMeetingTest[feedEntryResponse](t, data)
	data, _ = h.request(guestClient, "POST", base+"/messages", message, headersFor(h, guest, testKey("7")), 201)
	if decodeMeetingTest[feedEntryResponse](t, data).ID != sent.ID {
		t.Fatal("message duplicated")
	}

	h.request(guestClient, "POST", base+"/messages", map[string]string{"text": "Изменено", "client_request_id": testKey("7")}, headersFor(h, guest, testKey("7")), 409)
	h.request(guestClient, "POST", base+"/messages", message, headersFor(h, guest, testKey("8")), 422)
	data, _ = h.request(ownerClient, "GET", base+"/feed?limit=1&after_sequence=0", nil, nil, 200)
	page := decodeMeetingTest[feedPageResponse](t, data)
	if !page.HasMore || page.Entries[0].Sequence != "1" || page.LatestSequence == "1" {
		t.Fatal("page skipped to latest sequence")
	}

	h.request(ownerClient, "GET", base+"/feed?limit=1&after_sequence=1", nil, nil, 200)
	h.request(ownerClient, "GET", base+"/feed?limit=1&before_sequence=4", nil, nil, 200)
	h.request(ownerClient, "GET", base+"/feed?after_sequence=0&before_sequence=4", nil, nil, 400)
	h.request(ownerClient, "GET", base+"/feed?limit=1&limit=2", nil, nil, 400)
	h.request(ownerClient, "GET", "/api/v1/meetings?limit=0", nil, nil, 400)
	h.request(ownerClient, "GET", "/api/v1/meetings?cursor=invalid", nil, nil, 422)
	data, _ = h.request(guestClient, "PUT", base+"/rsvp", map[string]string{"answer": "maybe", "expected_revision": "1"}, headersFor(h, guest, testKey("9")), 200)
	if decodeMeetingTest[rsvpResponse](t, data).CanAccessFeed {
		t.Fatal("maybe kept access")
	}

	data, _ = h.request(guestClient, "PUT", invite+"/rsvp", going, headersFor(h, guest, testKey("4")), 200)
	state := decodeMeetingTest[rsvpResponse](t, data)
	if state.CanAccessFeed || *state.RSVP != "maybe" {
		t.Fatal("old going reopened feed")
	}

	h.request(guestClient, "GET", base+"/feed", nil, nil, 403)
	h.request(guestClient, "POST", base+"/messages", message, headersFor(h, guest, testKey("7")), 403)
	h.request(guestClient, "GET", base+"/participants", nil, nil, 403)
	h.request(guestClient, "PUT", base+"/rsvp", map[string]string{"answer": "going", "expected_revision": "1"}, headersFor(h, guest, testKey("10")), 409)
	data, _ = h.request(guestClient, "GET", invite, nil, nil, 200)
	if *decodeMeetingTest[previewResponse](t, data).MyRSVP != "maybe" {
		t.Fatal("own preview stale")
	}

	data, _ = h.request(guestClient, "GET", "/api/v1/meetings", nil, nil, 200)
	if len(decodeMeetingTest[meetingsPageResponse](t, data).Meetings) != 0 {
		t.Fatal("maybe listed")
	}

	h.request(guestClient, "PUT", base+"/rsvp", map[string]string{"answer": "not_going", "expected_revision": "2"}, headersFor(h, guest, testKey("11")), 200)
	data, _ = h.request(guestClient, "GET", "/api/v1/meetings", nil, nil, 200)
	if len(decodeMeetingTest[meetingsPageResponse](t, data).Meetings) != 0 {
		t.Fatal("declined listed")
	}

	other := h.login(otherClient, "other", map[string]string{"kind": "home"})
	data, _ = h.request(otherClient, "PUT", invite+"/rsvp", map[string]string{"answer": "going", "expected_revision": "1"}, headersFor(h, other, testKey("12")), 409)
	conflict := decodeMeetingTest[errorBody](t, data)
	if conflict.Error.CurrentResponse == nil || conflict.Error.CurrentResponse.RSVP != nil {
		t.Fatal("first response conflict requires nullable snapshot")
	}

	h.request(otherClient, "GET", base, nil, nil, 403)
	h.request(guestClient, "PUT", base+"/rsvp", map[string]string{"answer": "going", "expected_revision": "3"}, headersFor(h, guest, testKey("13")), 200)
	h.request(guestClient, "GET", base+"/feed", nil, nil, 200)
	// The native bearer obtained by the same provider subject accesses the same data.
	verifier := strings.Repeat("v", 43)
	hash := sha256.Sum256([]byte(verifier))
	challenge := base64.RawURLEncoding.EncodeToString(hash[:])
	data, _ = h.request(h.anonymous, "POST", "/api/v1/auth/yandex/start", map[string]any{
		"client_kind":    "ios",
		"app_challenge":  challenge,
		"return_context": map[string]string{"kind": "home"},
	}, nil, 200)
	started := decodeMeetingTest[authStartedResponse](t, data)
	providerURL, _ := url.Parse(started.AuthorizationURL)
	_, callback := h.request(h.anonymous, "GET", "/api/v1/auth/yandex/callback?"+url.Values{"state": {providerURL.Query().Get("state")}, "code": {"guest"}}.Encode(), nil, nil, 303)
	redirect, _ := url.Parse(callback.Header.Get("Location"))
	data, _ = h.request(h.anonymous, "POST", "/api/v1/auth/mobile/exchange", map[string]string{
		"attempt_id":   started.AttemptID,
		"handoff_code": redirect.Query().Get("handoff_code"),
		"app_verifier": verifier,
	}, nil, 200)
	native := decodeMeetingTest[exchangeResponse](t, data)
	bearer := map[string]string{"Authorization": "Bearer " + native.SessionToken}
	h.request(h.anonymous, "GET", base+"/feed", nil, bearer, 200)
	bearer["Idempotency-Key"] = testKey("14")
	h.request(h.anonymous, "POST", base+"/messages", map[string]string{"text": "С телефона", "client_request_id": testKey("14")}, bearer, 201)
	h.clock.Add(int64((2 * time.Hour) / time.Second))
	h.request(guestClient, "GET", base+"/feed", nil, nil, 401)
	data, _ = h.request(guestClient, "GET", invite, nil, nil, 200)
	if decodeMeetingTest[previewResponse](t, data).MyRSVP != nil {
		t.Fatal("expired session leaked own state")
	}

	// Invite tokens and text must not reach request logs.
	for _, private := range []string{token, "Описание приглашения", message["text"], native.SessionToken} {
		if strings.Contains(h.logs.String(), private) {
			t.Fatal("private request logged")
		}
	}

	if output := os.Getenv("SOMEWHERE_CONTRACT_CAPTURE"); output != "" {
		data, err := json.Marshal(h.captures)
		if err != nil {
			t.Fatal(err)
		}

		if err = os.WriteFile(output+".meetings", data, 0o600); err != nil {
			t.Fatal(err)
		}
	}
}
