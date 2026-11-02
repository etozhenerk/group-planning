package httpapi

import (
	"crypto/sha256"
	"fmt"
	"net"
	"net/http"
	"testing"
)

// Browser projects share a fixture process, but anonymous support scenarios need
// independent clients. This adapter exists only in test binaries; each scope
// retains the real API quota and idempotency rules.
func browserFeedbackScope(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		scope := r.Header.Get("X-Somewhere-Test-Feedback-Scope")
		if r.Method != http.MethodPost || r.URL.Path != "/api/v1/support/feedback" || scope == "" || len(scope) > 128 {
			next.ServeHTTP(w, r)
			return
		}

		digest := sha256.Sum256([]byte(scope))
		ip := net.IP(append([]byte{0x20, 0x01, 0x0d, 0xb8}, digest[:12]...))
		scoped := r.Clone(r.Context())
		scoped.RemoteAddr = net.JoinHostPort(ip.String(), "1")
		next.ServeHTTP(w, scoped)
	})
}

func TestBrowserFeedbackScopeRetainsQuotaAndRetryWithinEachClient(t *testing.T) {
	h := newMeetingHTTPTestWithHandler(t, func(next http.Handler, _ *meetingHTTPTest) http.Handler {
		return browserFeedbackScope(next)
	})
	for group, scope := range []string{"support-retry-chromium", "support-retry-mobile-webkit"} {
		for attempt := 1; attempt <= 6; attempt++ {
			key := testKey(fmt.Sprintf("19%d%d", group, attempt))
			body := map[string]any{
				"client_request_id": key,
				"kind":              "question",
				"description":       "Изолированная проверка квоты обращения",
				"screen":            "other",
				"email":             nil,
				"screenshot":        nil,
				"diagnostics":       nil,
			}
			headers := map[string]string{
				"Idempotency-Key":                 key,
				"X-Somewhere-Test-Feedback-Scope": scope,
			}
			expected := http.StatusCreated
			if attempt == 6 {
				expected = http.StatusTooManyRequests
			}

			h.request(h.anonymous, "POST", "/api/v1/support/feedback", body, headers, expected)
		}

		key := testKey(fmt.Sprintf("19%d1", group))
		body := map[string]any{
			"client_request_id": key,
			"kind":              "question",
			"description":       "Изолированная проверка квоты обращения",
			"screen":            "other",
			"email":             nil,
			"screenshot":        nil,
			"diagnostics":       nil,
		}
		headers := map[string]string{
			"Idempotency-Key":                 key,
			"X-Somewhere-Test-Feedback-Scope": scope,
		}
		h.request(h.anonymous, "POST", "/api/v1/support/feedback", body, headers, http.StatusCreated)
	}
}
