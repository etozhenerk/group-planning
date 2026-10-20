package httpapi

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

const meetingID = "5cf76452-b7fa-4a5b-b785-1582b58b1d75"

var invitationToken = base64.RawURLEncoding.EncodeToString(bytes.Repeat([]byte{7}, 32))

func seededStore(t *testing.T) *memory.Store {
	t.Helper()
	store := memory.New()
	instant := time.Date(2026, 10, 24, 16, 0, 0, 0, time.UTC)
	err := store.Update(context.Background(), func(writer meetings.Writer) error {
		if err := writer.SaveMeeting(meetings.Meeting{
			ID: meetingID, Title: "Суббота без спешки",
			StartsAt: &instant, Timezone: "Europe/Moscow", OrganizerID: "private-profile",
			Description: "private-description", CreationRequestHash: "private-hash",
		}); err != nil {
			return err
		}

		if err := writer.InsertInvitation(meetings.Invitation{ID: "invite", MeetingID: meetingID, Token: invitationToken}); err != nil {
			return err
		}

		if err := writer.SaveRSVP(meetings.RSVP{MeetingID: meetingID, UserID: "private-guest", Answer: meetings.Going}); err != nil {
			return err
		}

		_, err := writer.AppendEntry(meetings.FeedEntry{
			ID: "entry", MeetingID: meetingID, ActorID: "private-guest",
			ActorName: "private-name", Payload: json.RawMessage(`{"text":"private-message"}`),
		})

		return err
	})
	if err != nil {
		t.Fatal(err)
	}

	return store
}

type capturedResponse struct {
	Path    string          `json:"path"`
	Method  string          `json:"method"`
	Status  int             `json:"status"`
	Headers http.Header     `json:"headers"`
	Body    json.RawMessage `json:"body"`
}

// TestOpenAPIResponses exports real handler responses only when the contract
// check explicitly supplies a temporary path. The Node checker validates them
// against the same OpenAPI document used by all clients.
func TestOpenAPIResponses(t *testing.T) {
	var logs bytes.Buffer
	store := seededStore(t)
	handler := New(store, slog.New(slog.NewJSONHandler(&logs, nil)))
	cases := []struct {
		path, method, operationPath string
		status                      int
	}{
		{"/healthz", "GET", "/healthz", 200},
		{"/api/v1/invitations/" + invitationToken, "GET", "/api/v1/invitations/{token}", 200},
		{"/api/v1/invitations/invalid", "GET", "/api/v1/invitations/{token}", 404},
		{"/api/v1/invitations/" + base64.RawURLEncoding.EncodeToString(make([]byte, 32)), "GET", "/api/v1/invitations/{token}", 404},
		{"/api/v1/invitations/" + invitationToken + "?extra=secret", "GET", "/api/v1/invitations/{token}", 400},
		{"/api/v1/invitations/" + invitationToken, "POST", "/api/v1/invitations/{token}", 405},
	}
	var captures []capturedResponse
	ids := map[string]bool{}
	for _, tc := range cases {
		request := httptest.NewRequest(tc.method, tc.path, nil)
		request.Header.Set("Authorization", "Bearer private-session")
		request.Header.Set("Cookie", "__Host-somewhere_session=private-cookie")
		request.Header.Set("X-Request-ID", "injected-request-id")
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		if response.Code != tc.status {
			t.Fatalf("status %d, expected %d: %s", response.Code, tc.status, response.Body)
		}

		id := response.Header().Get("X-Request-ID")
		if len(id) != 36 || ids[id] || id == "injected-request-id" {
			t.Fatalf("invalid request ID %q", id)
		}

		ids[id] = true
		if response.Header().Get("Cache-Control") != "no-store" || response.Header().Get("Referrer-Policy") != "no-referrer" {
			t.Fatal("missing privacy headers")
		}

		if !strings.HasPrefix(response.Header().Get("Content-Type"), "application/json") {
			t.Fatal("non-JSON response")
		}

		if strings.Contains(response.Body.String(), "private-") {
			t.Fatal("private data in response")
		}

		captures = append(captures, capturedResponse{
			Path:    tc.operationPath,
			Method:  strings.ToLower(tc.method),
			Status:  response.Code,
			Headers: response.Header(),
			Body:    response.Body.Bytes(),
		})
	}

	if strings.Contains(logs.String(), invitationToken) || strings.Contains(logs.String(), "secret") || strings.Contains(logs.String(), "private-") {
		t.Fatal("sensitive data in logs")
	}

	if err := store.View(context.Background(), func(reader meetings.Reader) error {
		responses, err := reader.RSVPs(meetingID)
		if err != nil {
			return err
		}

		if len(responses) != 1 {
			t.Fatal("GET changed RSVP")
		}

		return nil
	}); err != nil {
		t.Fatal(err)
	}

	if output := os.Getenv("SOMEWHERE_CONTRACT_CAPTURE"); output != "" {
		data, err := json.Marshal(captures)
		if err != nil {
			t.Fatal(err)
		}

		if err := os.WriteFile(output, data, 0o600); err != nil {
			t.Fatal(err)
		}
	}
}

type brokenStore struct {
	meetings.Store
	panicValue bool
}

func (store brokenStore) View(context.Context, func(meetings.Reader) error) error {
	if store.panicValue {
		panic("private-panic-with-token")
	}

	return errors.New("private-storage-error-with-token")
}

func TestFailuresDoNotExposeDetails(t *testing.T) {
	for _, panics := range []bool{false, true} {
		var logs bytes.Buffer
		handler := New(brokenStore{panicValue: panics}, slog.New(slog.NewJSONHandler(&logs, nil)))
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, httptest.NewRequest("GET", "/api/v1/invitations/"+invitationToken, nil))
		if response.Code != 500 || strings.Contains(response.Body.String(), "private-") || strings.Contains(logs.String(), "private-") {
			t.Fatalf("unsafe failure: %s %s", response.Body, &logs)
		}

		var body errorBody
		if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
			t.Fatal(err)
		}

		if body.Error.Code != "internal_error" || body.Error.RequestID != response.Header().Get("X-Request-ID") {
			t.Fatal("inconsistent error")
		}
	}
}

func TestUnknownRoutesAndHead(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(&bytes.Buffer{}, nil))
	handler := New(seededStore(t), logger)
	for _, path := range []string{"/unknown", "/api//v1/invitations/secret", "/api/v1/invitations/../secret"} {
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, httptest.NewRequest("GET", path, nil))
		if response.Code != 404 || !json.Valid(response.Body.Bytes()) {
			t.Fatalf("%s: %d %s", path, response.Code, response.Body)
		}
	}

	response := httptest.NewRecorder()
	handler.ServeHTTP(response, httptest.NewRequest("HEAD", "/healthz", nil))
	if response.Code != 200 || response.Body.Len() != 0 {
		t.Fatal("HEAD returned a body")
	}
}
