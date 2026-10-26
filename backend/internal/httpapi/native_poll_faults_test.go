package httpapi

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

type nativePollFaults struct {
	mu       sync.Mutex
	key      string
	body     string
	attempts int
	exact    bool
}

func (f *nativePollFaults) handler(api http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Somewhere-Test-Scenario") != "poll-owner" ||
			r.Method != http.MethodPost || !strings.HasSuffix(r.URL.Path, "/date-polls") {
			api.ServeHTTP(w, r)
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "fixture body read failed", http.StatusInternalServerError)
			return
		}

		r.Body = io.NopCloser(bytes.NewReader(body))
		f.mu.Lock()
		first := f.attempts == 0
		if first {
			f.key, f.body, f.exact = r.Header.Get("Idempotency-Key"), string(body), true
		}

		f.attempts++
		f.exact = f.exact && f.key != "" && f.key == r.Header.Get("Idempotency-Key") && f.body == string(body)
		f.mu.Unlock()
		if first {
			// Commit the real operation, but lose its response. The client must reuse its request.
			api.ServeHTTP(httptest.NewRecorder(), r)
			http.Error(w, "fixture response lost after poll commit", http.StatusServiceUnavailable)

			return
		}

		api.ServeHTTP(w, r)
	})
}

func (f *nativePollFaults) verify(t *testing.T) {
	t.Helper()
	f.mu.Lock()
	defer f.mu.Unlock()

	if f.attempts != 2 || !f.exact {
		t.Errorf("date poll did not repeat the original body/key: attempts=%d exact=%v", f.attempts, f.exact)
	}
}

func TestNativePollFaultCommitsBeforeLosingResponse(t *testing.T) {
	faults := &nativePollFaults{}
	commits := 0
	handler := faults.handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(r.Body)
		if err != nil || string(body) != `{"options":["2026-10-26","2026-10-27"]}` {
			t.Fatalf("handler received changed body: %s, %v", body, err)
		}

		commits++
		w.WriteHeader(http.StatusCreated)
	}))
	for index, status := range []int{http.StatusServiceUnavailable, http.StatusCreated} {
		request := httptest.NewRequest(http.MethodPost, "/api/v1/meetings/example/date-polls",
			strings.NewReader(`{"options":["2026-10-26","2026-10-27"]}`))
		request.Header.Set("X-Somewhere-Test-Scenario", "poll-owner")
		request.Header.Set("Idempotency-Key", "stable-poll-key")
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		if response.Code != status || commits != index+1 {
			t.Fatalf("attempt %d: status=%d downstream calls=%d", index, response.Code, commits)
		}
	}

	faults.verify(t)
}
