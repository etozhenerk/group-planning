package httpapi

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestIOSRSVPLostACKExcludesReadMarkersAndOtherPUTs(t *testing.T) {
	for _, path := range []string{"/api/v1/invitations/test-token/rsvp", "/api/v1/meetings/10000000-0000-4000-8000-000000000001/rsvp"} {
		t.Run(path, func(t *testing.T) {
			faults := &iosFixtureFaults{}
			commits := 0
			api := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Method == http.MethodPut && r.URL.Path == path {
					commits++
				}

				w.WriteHeader(http.StatusOK)
				_, _ = w.Write([]byte(`{"committed":true}`))
			})
			handler := faults.handler(api)
			request := func(method, target, key string, want int) {
				t.Helper()
				r := httptest.NewRequest(method, target, nil)
				r.Header.Set("X-Somewhere-Test-Scenario", "invite-error")
				if key != "" {
					r.Header.Set("Idempotency-Key", key)
				}

				reply := httptest.NewRecorder()
				handler.ServeHTTP(reply, r)
				if reply.Code != want {
					t.Fatalf("%s %s status=%d want=%d", method, target, reply.Code, want)
				}
			}
			marker := "/api/v1/meetings/10000000-0000-4000-8000-000000000001/read-marker"
			request(http.MethodPut, marker, "", http.StatusOK)
			request(http.MethodGet, path, "", http.StatusOK)
			request(http.MethodPut, "/api/v1/meetings/id/settings", "other-key", http.StatusOK)
			request(http.MethodPut, "/api/v1/unknown/id/rsvp", "other-key", http.StatusOK)
			request(http.MethodPut, "/api/v1/meetings/id/nested/rsvp", "other-key", http.StatusOK)
			request(http.MethodPut, path, "stable-rsvp-key", http.StatusServiceUnavailable)
			if commits != 1 {
				t.Fatal("lost response did not follow RSVP commit")
			}

			request(http.MethodPut, path, "stable-rsvp-key", http.StatusOK)
			request(http.MethodPut, marker, "", http.StatusOK)
			if commits != 2 || faults.rsvpPosts != 2 || len(faults.rsvpKeys) != 1 || !faults.rsvpKeys["stable-rsvp-key"] {
				t.Fatalf("unexpected RSVP-only counts commits=%d posts=%d keys=%v", commits, faults.rsvpPosts, faults.rsvpKeys)
			}

			faults.verify(t, "invitation")
		})
	}
}
