package httpapi

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestAndroidPersistenceOutageDoesNotCommitUntilRetry(t *testing.T) {
	faults := &iosFeedFaults{rejectFirstBeforeCommit: true, scenario: "process-death", keys: map[string]bool{}, ids: map[string]bool{}}
	calls := 0
	handler := faults.handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			w.WriteHeader(http.StatusOK)
			return
		}

		calls++
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(`{"id":"canonical-message"}`))
	}))
	send := func(method, path string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(method, path, strings.NewReader(`{"body":"synthetic"}`))
		req.Header.Set("X-Somewhere-Test-Scenario", "process-death")
		req.Header.Set("Idempotency-Key", "same-persisted-intent")
		reply := httptest.NewRecorder()
		handler.ServeHTTP(reply, req)

		return reply
	}
	if reply := send(http.MethodPost, "/api/v1/meetings/fixture/messages"); reply.Code != http.StatusServiceUnavailable {
		t.Fatalf("first status=%d", reply.Code)
	}

	if calls != 0 || len(faults.ids) != 0 {
		t.Fatalf("outage committed: calls=%d ids=%d", calls, len(faults.ids))
	}

	if reply := send(http.MethodGet, "/api/v1/meetings/fixture/feed"); reply.Code != http.StatusOK {
		t.Fatalf("precommit feed=%d", reply.Code)
	}

	if calls != 0 {
		t.Fatal("reading canonical feed committed a message")
	}

	if reply := send(http.MethodPost, "/api/v1/meetings/fixture/messages"); reply.Code != http.StatusCreated {
		t.Fatalf("retry=%d", reply.Code)
	}

	if calls != 1 || faults.posts != 2 || len(faults.keys) != 1 || !faults.keys["same-persisted-intent"] || len(faults.ids) != 1 || !faults.ids["canonical-message"] {
		t.Fatalf("retry calls=%d posts=%d keys=%v ids=%v", calls, faults.posts, faults.keys, faults.ids)
	}
}

func TestIOSLostResponseStillCommitsBeforeFirstFailure(t *testing.T) {
	faults := &iosFeedFaults{keys: map[string]bool{}, ids: map[string]bool{}}
	calls := 0
	handler := faults.handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(`{"id":"committed-before-response-loss"}`))
	}))
	req := httptest.NewRequest(http.MethodPost, "/api/v1/meetings/fixture/messages", strings.NewReader(`{}`))
	req.Header.Set("X-Somewhere-Test-Scenario", "feed-owner")
	req.Header.Set("Idempotency-Key", "same-intent")
	reply := httptest.NewRecorder()
	handler.ServeHTTP(reply, req)
	if reply.Code != http.StatusServiceUnavailable || calls != 1 || !faults.ids["committed-before-response-loss"] {
		t.Fatalf("legacy loss status=%d calls=%d ids=%v", reply.Code, calls, faults.ids)
	}
}
