package server

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
	"github.com/prometheus/common/expfmt"
	"github.com/prometheus/common/model"
)

func metricsText(t *testing.T, metrics *httpMetrics) string {
	t.Helper()
	response := httptest.NewRecorder()
	metrics.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/metrics", nil))
	if response.Code != http.StatusOK {
		t.Fatal("scrape failed", response.Code)
	}

	text := response.Body.String()
	parser := expfmt.NewTextParser(model.LegacyValidation)
	if _, err := parser.TextToMetricFamilies(strings.NewReader(text)); err != nil {
		t.Fatal("invalid Prometheus exposition", err)
	}

	return text
}

func TestHTTPMetricsExplainEachCompletionExactlyOnce(t *testing.T) {
	tests := []struct {
		name            string
		status, outcome int
		contextErr      error
	}{
		{"implicit success", 0, 0, nil},
		{"success", 201, 0, nil},
		{"redirect", 303, 1, nil},
		{"unauthorized", 401, 2, nil},
		{"not found", 404, 2, nil},
		{"rate limit", 429, 3, nil},
		{"server failure", 500, 4, nil},
		{"gateway timeout", 504, 5, context.DeadlineExceeded},
		{"deadline without response", 0, 5, context.DeadlineExceeded},
		{"client cancelled", 0, 6, context.Canceled},
		{"upgrade", 101, 7, nil},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			metrics := &httpMetrics{}
			request := httptest.NewRequest(http.MethodPost, "/api/v1/meetings/private/messages?token=secret", strings.NewReader("request"))
			if test.contextErr == context.Canceled {
				ctx, cancel := context.WithCancel(request.Context())
				cancel()
				request = request.WithContext(ctx)
			}

			if test.contextErr == context.DeadlineExceeded {
				ctx, cancel := context.WithDeadline(request.Context(), time.Now().Add(-time.Second))
				defer cancel()
				request = request.WithContext(ctx)
			}

			response := httptest.NewRecorder()
			metrics.wrap(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				_, _ = io.Copy(io.Discard, r.Body)
				if test.status != 0 {
					w.WriteHeader(test.status)
					w.WriteHeader(500) // A second final response must not change the count.
				}

				if test.status != 101 {
					_, _ = w.Write([]byte("response"))
				}
			})).ServeHTTP(response, request)
			if metrics.data.Requests[2][test.outcome] != 1 {
				t.Fatal("wrong operation or outcome", metrics.data.Requests)
			}

			var total uint64
			for _, row := range metrics.data.Requests {
				for _, count := range row {
					total += count
				}
			}

			if total != 1 || metrics.data.Inflight[1] != 0 {
				t.Fatal("completion double counted or in-flight leaked")
			}

			traffic := metrics.data.Traffic[4][0]
			if traffic.Requests != 1 || traffic.Read != 7 || (test.status != 101 && traffic.Written != 8) {
				t.Fatal("body byte count changed", traffic)
			}

			metricsText(t, metrics)
		})
	}
}

func TestHTTPMetricsHistogramAndMissingObservations(t *testing.T) {
	metrics := &httpMetrics{}
	text := metricsText(t, metrics)
	for _, line := range strings.Split(text, "\n") {
		if line != "" && !strings.HasPrefix(line, "#") {
			t.Fatal("empty registry fabricated a measurement", line)
		}
	}

	for _, seconds := range []float64{.005, .5, 6} {
		metrics.begin(0)
		metrics.finish(1, 0, 0, 4, 0, seconds, 0, 0)
	}

	text = metricsText(t, metrics)
	for _, expected := range []string{
		`somewhere_http_duration_seconds_bucket{group="read",result="success",le="0.01"} 1`,
		`somewhere_http_duration_seconds_bucket{group="read",result="success",le="0.5"} 2`,
		`somewhere_http_duration_seconds_bucket{group="read",result="success",le="5"} 2`,
		`somewhere_http_duration_seconds_bucket{group="read",result="success",le="+Inf"} 3`,
		`somewhere_http_duration_seconds_count{group="read",result="success"} 3`,
		`somewhere_http_duration_seconds_sum{group="read",result="success"} 6.505`,
	} {
		if !strings.Contains(text, expected+"\n") {
			t.Fatal("incorrect cumulative histogram", expected, text)
		}
	}

	if strings.Contains(text, `result="error"`) {
		t.Fatal("unobserved error latency was fabricated")
	}

	if strings.Contains(metricsText(t, &httpMetrics{}), "} ") {
		t.Fatal("a new process retained old counters")
	}
}

func TestHTTPMetricsPrivacySourceAndScope(t *testing.T) {
	metrics := &httpMetrics{}
	handler := metrics.wrap(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(404) }))
	for index := 0; index < 1000; index++ {
		request := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/meetings/private-id-%d/feed?token=private-token", index), nil)
		request.Header.Set("User-Agent", fmt.Sprintf("private-user-agent-%d", index))
		request.Header.Set("Authorization", "Bearer private-session")
		request.Header.Set("X-Forwarded-For", "66.249.66.1")
		request.Header.Set("X-Somewhere-Probe", "true")
		handler.ServeHTTP(httptest.NewRecorder(), request)
	}

	if metrics.data.Traffic[4][0].Requests != 1000 || metrics.data.Traffic[0][0].Requests != 0 || metrics.data.Traffic[3][0].Requests != 0 {
		t.Fatal("untrusted client headers verified a source")
	}

	cases := []struct {
		path, ua      string
		source, scope int
	}{
		{"/i/private-invite", "TelegramBot", 2, 1},
		{"/api/v1/invitations/private-invite", "TelegramBot", 2, 0},
		{"/api/v1/meetings", "Googlebot", 1, 0},
		{"/assets/private-hash.js", "Mozilla/5.0", 4, 2},
		{"/healthz", "somewhere-probe", 4, 1},
		{"/readyz", "", 4, 1},
	}
	for _, test := range cases {
		request := httptest.NewRequest(http.MethodGet, test.path, nil)
		request.Header.Set("User-Agent", test.ua)
		if metricSource(request) != test.source {
			t.Fatal("incorrect source", test.path)
		}

		_, _, scope := metricRoute(request)
		if scope != test.scope {
			t.Fatal("incorrect scope", test.path)
		}

		handler.ServeHTTP(httptest.NewRecorder(), request)
	}

	text := metricsText(t, metrics)
	for _, secret := range []string{"private-", "Bearer", "66.249", "TelegramBot", "Googlebot", "token=", "User-Agent"} {
		if strings.Contains(text, secret) {
			t.Fatal("private request value leaked", secret)
		}
	}

	var api uint64
	for _, outcomes := range metrics.data.Requests {
		for _, count := range outcomes {
			api += count
		}
	}

	if api != 1002 {
		t.Fatal("health/assets/public requests entered API RPS", api)
	}
}

func TestHTTPMetricsConcurrentInFlightAndScrapes(t *testing.T) {
	metrics := &httpMetrics{}
	var entered, finished sync.WaitGroup
	const count = 64
	entered.Add(count)
	finished.Add(count)
	release := make(chan struct{})
	handler := metrics.wrap(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		entered.Done()
		<-release
		w.WriteHeader(204)
	}))
	for index := 0; index < count; index++ {
		go func() {
			defer finished.Done()
			handler.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/api/v1/meetings", nil))
		}()
	}

	entered.Wait()
	text := metricsText(t, metrics)
	if !strings.Contains(text, `somewhere_http_inflight{group="read"} 64`) || strings.Contains(text, "_seconds_count{") {
		t.Fatal("in-flight request was recorded as completed", text)
	}

	close(release)
	for index := 0; index < count; index++ {
		metricsText(t, metrics)
	}

	finished.Wait()
	if metrics.data.Inflight[0] != 0 || metrics.data.Requests[1][0] != count {
		t.Fatal("concurrent completion lost or gauge leaked")
	}
}

func TestHTTPMetricsCardinalityHasHardBound(t *testing.T) {
	metrics := &httpMetrics{}
	for operation := range operationNames {
		for outcome := range outcomeNames {
			for group := range durationNames {
				metrics.begin(group)
				metrics.finish(operation, group, 0, 0, outcome, .1, 1, 1)
			}
		}
	}

	for source := range trafficNames {
		for scope := range scopeNames {
			metrics.begin(3)
			metrics.finish(7, 3, scope, source, 0, .1, 1, 1)
		}
	}

	count := 0
	for _, line := range strings.Split(metricsText(t, metrics), "\n") {
		if line != "" && !strings.HasPrefix(line, "#") {
			count++
		}
	}

	if count != 217 {
		t.Fatal("cardinality contract changed", count)
	}
}

func TestHTTPMetricsPanicDoesNotLeakOrLeaveInflight(t *testing.T) {
	metrics := &httpMetrics{}
	func() {
		defer func() {
			if recover() != http.ErrAbortHandler {
				t.Error("panic contract changed")
			}
		}()
		metrics.wrap(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte("partial"))
			panic(http.ErrAbortHandler)
		})).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/api/v1/meetings", nil))
	}()
	if metrics.data.Inflight[0] != 0 || metrics.data.Requests[1][4] != 1 {
		t.Fatal("aborted response counted as success or leaked gauge")
	}
}

func TestHTTPMetricsListenerIsPrivateAndLifecycleBound(t *testing.T) {
	for _, address := range []string{"0.0.0.0:9109", ":9109", "example.com:9109", "192.168.1.1:9109", "[::]:9109", "127.0.0.1:0", "127.0.0.1:65536", "[::1%lo0]:9109"} {
		if _, err := LoadConfig(func(key string) string {
			if key == "SOMEWHERE_METRICS_ADDR" {
				return address
			}

			return ""
		}); err == nil {
			t.Fatal("unsafe metrics address accepted", address)
		}
	}

	for _, address := range []string{"", "127.0.0.1:9109", "[::1]:9109"} {
		if err := validateMetricsAddress(address); err != nil {
			t.Fatal(err)
		}
	}

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}

	stop := serveHTTPMetrics(listener, &httpMetrics{}, slog.New(slog.NewTextHandler(io.Discard, nil)))
	client := &http.Client{Timeout: time.Second}
	response, err := client.Get("http://" + listener.Addr().String() + "/metrics")
	if err != nil {
		stop()
		t.Fatal(err)
	}

	response.Body.Close()
	if response.StatusCode != 200 {
		stop()
		t.Fatal("private scrape rejected")
	}

	stop()
	if connection, err := net.DialTimeout("tcp", listener.Addr().String(), time.Second); err == nil {
		connection.Close()
		t.Fatal("metrics listener survived stop")
	}
}

func TestHTTPMetricsPublicOriginDoesNotExposeScrape(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}

	metricsListener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}

	address := metricsListener.Addr().String()
	metricsListener.Close()
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	done := make(chan error, 1)
	go func() {
		done <- Serve(ctx, listener, memory.New(), Config{ShutdownTimeout: time.Second, MetricsAddress: address}, slog.New(slog.NewTextHandler(io.Discard, nil)))
	}()
	client := &http.Client{Timeout: time.Second}
	response, err := client.Get("http://" + listener.Addr().String() + "/metrics")
	if err != nil {
		t.Fatal(err)
	}

	response.Body.Close()
	if response.StatusCode != 404 {
		t.Fatal("public metrics route exposed")
	}

	response, err = client.Get("http://" + address + "/metrics")
	if err != nil {
		t.Fatal(err)
	}

	body, err := io.ReadAll(response.Body)
	response.Body.Close()
	if err != nil || !strings.Contains(string(body), `somewhere_http_requests_total{source="unknown",scope="public"} 1`) {
		t.Fatal("outer runtime middleware was not connected", err, string(body))
	}

	cancel()
	if err := <-done; err != nil {
		t.Fatal(err)
	}

	if connection, err := net.DialTimeout("tcp", address, time.Second); err == nil {
		connection.Close()
		t.Fatal("runtime did not close metrics listener")
	}
}
