package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

type iosFeedFaults struct {
	mu      sync.Mutex
	posts   int
	keys    map[string]bool
	ids     map[string]bool
	changed bool
	patched bool
	history bool
}

func (f *iosFeedFaults) handler(api http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Somewhere-Test-Scenario") != "feed-owner" {
			api.ServeHTTP(w, r)
			return
		}

		if r.Method == http.MethodGet && strings.HasSuffix(r.URL.Path, "/feed") {
			f.mu.Lock()
			if r.URL.Query().Get("before_sequence") != "" {
				f.history = true
			}

			waiting := f.posts == 1
			f.mu.Unlock()
			if waiting {
				http.Error(w, "fixture lost response awaiting explicit retry", http.StatusServiceUnavailable)
				return
			}
		}

		if r.Method == http.MethodPost && strings.HasSuffix(r.URL.Path, "/messages") {
			reply := httptest.NewRecorder()
			api.ServeHTTP(reply, r)
			f.mu.Lock()
			f.posts++
			first := f.posts == 1
			f.keys[r.Header.Get("Idempotency-Key")] = true
			var body struct {
				ID string `json:"id"`
			}
			if reply.Code == http.StatusCreated && json.Unmarshal(reply.Body.Bytes(), &body) == nil {
				f.ids[body.ID] = true
			}

			f.mu.Unlock()
			if first && reply.Code == http.StatusCreated {
				http.Error(w, "fixture response lost after message commit", http.StatusServiceUnavailable)
				return
			}

			copyIOSReply(w, reply)

			return
		}

		if r.Method == http.MethodPatch {
			f.mu.Lock()
			first := !f.changed
			f.changed = true
			f.mu.Unlock()
			if first {
				// A real concurrent edit through the same authenticated API, before the stale form arrives.
				other := httptest.NewRequest(http.MethodPatch, r.URL.String(), strings.NewReader(`{"title":"Встреча с другого устройства","expected_revision":"1"}`))
				other.Header = r.Header.Clone()
				other.Header.Set("Idempotency-Key", "dddddddd-dddd-4ddd-8ddd-dddddddddddd")
				api.ServeHTTP(httptest.NewRecorder(), other)
			}

			reply := httptest.NewRecorder()
			api.ServeHTTP(reply, r)
			f.mu.Lock()
			if !first && reply.Code == http.StatusOK {
				f.patched = true
			}

			f.mu.Unlock()
			copyIOSReply(w, reply)

			return
		}

		api.ServeHTTP(w, r)
	})
}

func copyIOSReply(w http.ResponseWriter, reply *httptest.ResponseRecorder) {
	for name, values := range reply.Header() {
		w.Header()[name] = values
	}

	w.WriteHeader(reply.Code)
	_, _ = w.Write(reply.Body.Bytes())
}

func (f *iosFeedFaults) verify(t *testing.T) {
	t.Helper()
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.posts < 2 || len(f.keys) != 1 || f.keys[""] || len(f.ids) != 1 || f.ids[""] {
		t.Errorf("message retry: posts=%d keys=%d IDs=%d", f.posts, len(f.keys), len(f.ids))
	}

	if !f.changed || !f.patched || !f.history {
		t.Errorf("feed flow: conflict=%t saved=%t history=%t", f.changed, f.patched, f.history)
	}
}
