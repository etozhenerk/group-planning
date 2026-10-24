package probe

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestConfig(t *testing.T) {
	for _, origin := range []string{"http://example.com", "https://127.0.0.1", "https://example.com/path", "https://user:pass@example.com", "https://localhost", "https://example.com?x=y", "https://example.com:443"} {
		if (Config{FolderID: "folder", Origin: origin}).Validate() == nil {
			t.Fatalf("accepted %s", origin)
		}
	}

	if err := (Config{FolderID: "folder", Origin: "https://api.example.com"}).Validate(); err != nil {
		t.Fatal(err)
	}
}

func TestProbeResponses(t *testing.T) {
	for _, status := range []int{200, 302, 503} {
		t.Run(fmt.Sprint(status), func(t *testing.T) {
			server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path != "/readyz" || r.Header.Get("User-Agent") != "somewhere-monitor/1.0" {
					t.Error("unexpected request")
				}

				w.Header().Set("Location", "/should-not-follow")
				w.WriteHeader(status)
			}))
			defer server.Close()
			client := server.Client()
			client.CheckRedirect = NewClient().CheckRedirect
			now := time.Now()
			values := Run(context.Background(), client, server.URL, now)
			expected := float64(0)
			if status == 200 {
				expected = 1
			}

			if values["somewhere_probe_success"] != expected || values["somewhere_probe_status_code"] != float64(status) || values["somewhere_probe_last_run_timestamp_seconds"] != float64(now.Unix()) {
				t.Fatalf("unexpected values: %v", values)
			}

			if _, ok := values["somewhere_probe_tls_seconds"]; !ok {
				t.Fatal("missing TLS timing")
			}

			if _, ok := values["somewhere_probe_certificate_days"]; !ok {
				t.Fatal("missing expiry")
			}
		})
	}
}

func TestProbeFailureAndBodyLimit(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	values := Run(ctx, NewClient(), "https://example.invalid", time.Now())
	if values["somewhere_probe_success"] != 0 || values["somewhere_probe_status_code"] != 0 {
		t.Fatal(values)
	}

	if _, ok := values["somewhere_probe_tls_seconds"]; ok {
		t.Fatal("failed stage must be absent")
	}

	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { fmt.Fprint(w, strings.Repeat("x", 16385)) }))
	defer server.Close()
	if Run(context.Background(), server.Client(), server.URL, time.Now())["somewhere_probe_success"] != 0 {
		t.Fatal("oversized response accepted")
	}

	// A valid HTTPS endpoint with an untrusted certificate must fail closed.
	if Run(context.Background(), NewClient(), server.URL, time.Now())["somewhere_probe_success"] != 0 {
		t.Fatal("untrusted certificate accepted")
	}
}
