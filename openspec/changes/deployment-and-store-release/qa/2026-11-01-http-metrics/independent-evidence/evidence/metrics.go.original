package server

import (
	"fmt"
	"net/http"
	"strings"
	"sync"
)

var (
	durationBounds = [...]float64{.01, .025, .05, .1, .25, .5, .75, 1, 2.5, 5}
	operationNames = [...]string{"auth", "meetings", "feed", "poll", "invites", "profile", "health", "other"}
	outcomeNames   = [...]string{"ok", "redirect", "client_error", "limited", "server_error", "timeout", "cancelled", "informational"}
	durationNames  = [...]string{"read", "write", "auth", "public"}
	trafficNames   = [...]string{"verified_bot", "suspected_bot", "link_preview", "synthetic", "unknown"}
	scopeNames     = [...]string{"api", "public", "assets"}
)

type requestHistogram struct {
	Count   uint64
	Sum     float64
	Buckets [10]uint64
}

type httpTraffic struct {
	Requests uint64
	Read     uint64
	Written  uint64
}

type httpMetricData struct {
	Requests  [8][8]uint64
	Durations [4][2]requestHistogram
	Inflight  [4]int64
	Started   [4]bool
	Traffic   [5][3]httpTraffic
}

// httpMetrics owns bounded, process-local HTTP aggregates; no request values are stored.
// Maximum samples: 64 outcomes + 104 histogram samples + 4 gauges + 45 traffic = 217.
type httpMetrics struct {
	mu   sync.Mutex
	data httpMetricData
}

func (m *httpMetrics) begin(group int) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data.Inflight[group]++
	m.data.Started[group] = true
}

func (m *httpMetrics) finish(operation, group, scope, source, outcome int, seconds float64, read, written uint64) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data.Inflight[group]--
	if scope == 0 {
		m.data.Requests[operation][outcome]++
	}

	result := 0
	if outcome != 0 && outcome != 1 && outcome != 7 {
		result = 1
	}

	histogram := &m.data.Durations[group][result]
	histogram.Count++
	histogram.Sum += seconds
	for index, bound := range durationBounds {
		if seconds <= bound {
			histogram.Buckets[index]++
		}
	}

	traffic := &m.data.Traffic[source][scope]
	traffic.Requests++
	traffic.Read += read
	traffic.Written += written
}

func (m *httpMetrics) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	if r.URL.Path != "/metrics" {
		http.NotFound(w, r)
		return
	}

	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		w.WriteHeader(http.StatusMethodNotAllowed)

		return
	}

	w.Header().Set("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
	if r.Method == http.MethodHead {
		return
	}

	m.mu.Lock()
	snapshot := m.data
	m.mu.Unlock()
	var output strings.Builder
	output.WriteString("# HELP somewhere_api_requests_total Completed application API requests, excluding health and assets.\n# TYPE somewhere_api_requests_total counter\n")
	for operation, outcomes := range snapshot.Requests {
		for outcome, value := range outcomes {
			if value != 0 {
				fmt.Fprintf(&output, "somewhere_api_requests_total{operation=%q,outcome=%q} %d\n", operationNames[operation], outcomeNames[outcome], value)
			}
		}
	}

	output.WriteString("# HELP somewhere_http_duration_seconds Handler duration in seconds; quantiles require sufficient count.\n# TYPE somewhere_http_duration_seconds histogram\n")
	for group, results := range snapshot.Durations {
		for result, histogram := range results {
			if histogram.Count == 0 {
				continue
			}

			name := "success"
			if result == 1 {
				name = "error"
			}

			labels := fmt.Sprintf("group=%q,result=%q", durationNames[group], name)
			for bucket, bound := range durationBounds {
				fmt.Fprintf(&output, "somewhere_http_duration_seconds_bucket{%s,le=%q} %d\n", labels, fmt.Sprint(bound), histogram.Buckets[bucket])
			}

			fmt.Fprintf(&output, "somewhere_http_duration_seconds_bucket{%s,le=\"+Inf\"} %d\n", labels, histogram.Count)
			fmt.Fprintf(&output, "somewhere_http_duration_seconds_sum{%s} %g\n", labels, histogram.Sum)
			fmt.Fprintf(&output, "somewhere_http_duration_seconds_count{%s} %d\n", labels, histogram.Count)
		}
	}

	output.WriteString("# HELP somewhere_http_inflight Requests currently inside the handler, including public and health.\n# TYPE somewhere_http_inflight gauge\n")
	for group, value := range snapshot.Inflight {
		if snapshot.Started[group] {
			fmt.Fprintf(&output, "somewhere_http_inflight{group=%q} %d\n", durationNames[group], value)
		}
	}

	families := [...]string{"somewhere_http_requests_total", "somewhere_http_request_bytes_total", "somewhere_http_response_bytes_total"}
	for family, name := range families {
		fmt.Fprintf(&output, "# HELP %s Application HTTP requests or body bytes; proxy and WebSocket frames are separate sources.\n# TYPE %s counter\n", name, name)
		for source, scopes := range snapshot.Traffic {
			for scope, traffic := range scopes {
				if traffic.Requests == 0 {
					continue
				}

				values := [...]uint64{traffic.Requests, traffic.Read, traffic.Written}
				fmt.Fprintf(&output, "%s{source=%q,scope=%q} %d\n", name, trafficNames[source], scopeNames[scope], values[family])
			}
		}
	}

	_, _ = fmt.Fprint(w, output.String())
}
