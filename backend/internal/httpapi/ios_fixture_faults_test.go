package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
)

type iosFixtureFaults struct {
	mu         sync.Mutex
	listFailed bool
	posts      int
	keys       map[string]bool
	ids        map[string]bool
}

func (f *iosFixtureFaults) handler(api http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		scenario := r.Header.Get("X-Somewhere-Test-Scenario")
		if scenario == "list-error" && r.Method == http.MethodGet && r.URL.Path == "/api/v1/meetings" {
			f.mu.Lock()
			fail := !f.listFailed
			f.listFailed = true
			f.mu.Unlock()
			if fail {
				http.Error(w, "fixture unavailable", http.StatusServiceUnavailable)
				return
			}
		}

		if scenario != "lost-create" || r.Method != http.MethodPost || r.URL.Path != "/api/v1/meetings" {
			api.ServeHTTP(w, r)
			return
		}

		reply := httptest.NewRecorder()
		api.ServeHTTP(reply, r)
		var body struct {
			Meeting struct {
				ID string `json:"id"`
			} `json:"meeting"`
		}
		if reply.Code == http.StatusCreated {
			_ = json.Unmarshal(reply.Body.Bytes(), &body)
		}

		f.mu.Lock()
		f.posts++
		first := f.posts == 1
		f.keys[r.Header.Get("Idempotency-Key")] = true
		if body.Meeting.ID != "" {
			f.ids[body.Meeting.ID] = true
		}

		f.mu.Unlock()
		if first && reply.Code == http.StatusCreated {
			http.Error(w, "fixture response lost after commit", http.StatusServiceUnavailable)
			return
		}

		for name, values := range reply.Header() {
			w.Header()[name] = values
		}

		w.WriteHeader(reply.Code)
		_, _ = w.Write(reply.Body.Bytes())
	})
}

func (f *iosFixtureFaults) verify(t *testing.T) {
	t.Helper()
	f.mu.Lock()
	defer f.mu.Unlock()
	if !f.listFailed {
		t.Error("UI did not exercise list error/retry")
	}

	if f.posts < 2 || len(f.keys) != 1 || f.keys[""] || len(f.ids) != 1 {
		t.Errorf("create retry: posts=%d, keys=%d, meeting IDs=%d", f.posts, len(f.keys), len(f.ids))
	}
}
