package httpapi

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
	"github.com/etozhenerk/group-planning/backend/internal/support"
)

func fixtureSupport() *support.Service { return support.New(memory.NewSupport(), nil, time.Now) }

func TestSupportOpenAPIResponses(t *testing.T) {
	h := newMeetingHTTPTest(t)
	body := map[string]any{"client_request_id": testKey("1801"), "kind": "problem", "description": "Не открывается встреча при нажатии", "screen": "meetings", "email": nil, "screenshot": nil, "diagnostics": nil}
	headers := map[string]string{"Idempotency-Key": testKey("1801")}
	first, _ := h.request(h.anonymous, "POST", "/api/v1/support/feedback", body, headers, 201)
	repeated, _ := h.request(h.anonymous, "POST", "/api/v1/support/feedback", body, headers, 201)
	if !bytes.Equal(first, repeated) {
		t.Fatal("retry returned another receipt")
	}

	receipt := decodeMeetingTest[feedbackReceipt](t, first)
	if receipt.Status != "accepted" || receipt.ID == "" || !strings.HasPrefix(receipt.Reference, "SW-") {
		t.Fatal("invalid receipt")
	}

	body["description"] = "Другое описание того же обращения"
	h.request(h.anonymous, "POST", "/api/v1/support/feedback", body, headers, 409)
	body["client_request_id"] = testKey("1802")
	headers["Idempotency-Key"] = testKey("1802")
	body["description"] = "коротко"
	h.request(h.anonymous, "POST", "/api/v1/support/feedback", body, headers, 422)
	body["description"] = "Достаточно подробное описание"
	body["session_token"] = "must-not-enter-feedback"
	h.request(h.anonymous, "POST", "/api/v1/support/feedback", body, headers, 400)
	delete(body, "session_token")
	for i := 2; i <= 5; i++ {
		key := testKey("180" + string(rune('0'+i)))
		body["client_request_id"] = key
		headers["Idempotency-Key"] = key
		h.request(h.anonymous, "POST", "/api/v1/support/feedback", body, headers, 201)
	}

	body["client_request_id"] = testKey("1806")
	headers["Idempotency-Key"] = testKey("1806")
	h.request(h.anonymous, "POST", "/api/v1/support/feedback", body, headers, 429)
	if strings.Contains(h.logs.String(), "Достаточно") || strings.Contains(h.logs.String(), "must-not-enter") {
		t.Fatal("feedback entered request logs")
	}

	// No public route exposes the accepted screenshot or submitted fields.
	response, err := h.anonymous.Get(h.server.URL + "/api/v1/support/feedback/" + receipt.ID)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != 404 {
		t.Fatal("feedback became publicly readable")
	}

	if output := os.Getenv("SOMEWHERE_CONTRACT_CAPTURE"); output != "" {
		encoded, err := json.Marshal(h.captures)
		if err != nil {
			t.Fatal(err)
		}

		if err := os.WriteFile(output+".support", encoded, 0o600); err != nil {
			t.Fatal(err)
		}
	}
}

func TestSupportRejectsOversizedBody(t *testing.T) {
	h := newMeetingHTTPTest(t)
	request, err := http.NewRequest("POST", h.server.URL+"/api/v1/support/feedback", strings.NewReader(strings.Repeat("x", 7<<20+1)))
	if err != nil {
		t.Fatal(err)
	}

	request.Header.Set("Content-Type", "application/json")
	response, err := h.anonymous.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	_, _ = io.Copy(io.Discard, response.Body)
	if response.StatusCode != 413 {
		t.Fatalf("unbounded request: %d", response.StatusCode)
	}
}
