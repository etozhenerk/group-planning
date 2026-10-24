// Package probe measures one fixed HTTPS readiness endpoint; events cannot choose URLs.
package probe

import (
	"context"
	"crypto/tls"
	"errors"
	"io"
	"net"
	"net/http"
	"net/http/httptrace"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"
)

// Config is deployment configuration, never trigger input.
type Config struct {
	FolderID string `json:"folder_id"`
	Origin   string `json:"origin"`
}

// Validate rejects paths, credentials and literal/local IP targets.
func (c Config) Validate() error {
	target, err := url.Parse(c.Origin)
	if err != nil || target.Scheme != "https" || target.Host == "" || target.User != nil || target.Path != "" || target.RawQuery != "" || target.Fragment != "" || target.Port() != "" {
		return errors.New("probe needs an HTTPS origin without path or port")
	}

	if !regexp.MustCompile(`^[a-zA-Z0-9]{1,50}$`).MatchString(c.FolderID) || net.ParseIP(target.Hostname()) != nil || !strings.Contains(target.Hostname(), ".") || strings.HasSuffix(target.Hostname(), ".localhost") {
		return errors.New("invalid probe configuration")
	}

	return nil
}

// NewClient disables redirects, proxies and keep-alive so each run measures a fresh connection.
func NewClient() *http.Client {
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = nil
	transport.DisableKeepAlives = true

	return &http.Client{Timeout: 10 * time.Second, Transport: transport, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}
}

// Run always emits success, duration, status and freshness, including network failures.
// Missing DNS/TCP/TLS stages are absent rather than falsely reporting zero latency.
func Run(ctx context.Context, client *http.Client, origin string, now time.Time) map[string]float64 {
	start := time.Now()
	values := map[string]float64{"somewhere_probe_success": 0, "somewhere_probe_status_code": 0, "somewhere_probe_last_run_timestamp_seconds": float64(now.Unix())}
	var lock sync.Mutex
	starts := make(map[string]time.Time)
	begin := func(stage string) { lock.Lock(); defer lock.Unlock(); starts[stage] = time.Now() }
	finish := func(stage string, err error) {
		lock.Lock()
		defer lock.Unlock()
		if instant, exists := starts[stage]; exists && err == nil {
			values["somewhere_probe_"+stage+"_seconds"] = time.Since(instant).Seconds()
		}
	}
	trace := &httptrace.ClientTrace{
		DNSStart:     func(httptrace.DNSStartInfo) { begin("dns") },
		DNSDone:      func(info httptrace.DNSDoneInfo) { finish("dns", info.Err) },
		ConnectStart: func(network, address string) { begin("tcp:" + network + ":" + address) },
		ConnectDone: func(network, address string, err error) {
			lock.Lock()
			defer lock.Unlock()
			if instant, exists := starts["tcp:"+network+":"+address]; exists && err == nil {
				values["somewhere_probe_tcp_seconds"] = time.Since(instant).Seconds()
			}
		},
		TLSHandshakeStart: func() { begin("tls") },
		TLSHandshakeDone:  func(_ tls.ConnectionState, err error) { finish("tls", err) },
		GotFirstResponseByte: func() {
			lock.Lock()
			defer lock.Unlock()
			values["somewhere_probe_ttfb_seconds"] = time.Since(start).Seconds()
		},
	}
	req, err := http.NewRequestWithContext(httptrace.WithClientTrace(ctx, trace), http.MethodGet, origin+"/readyz", nil)
	if err == nil {
		req.Header.Set("User-Agent", "somewhere-monitor/1.0")
		response, requestErr := client.Do(req)
		if requestErr == nil {
			// Bound body consumption; never log, return or upload response content.
			body, readErr := io.ReadAll(io.LimitReader(response.Body, 16385))
			response.Body.Close()
			lock.Lock()
			values["somewhere_probe_status_code"] = float64(response.StatusCode)
			if response.StatusCode == http.StatusOK && readErr == nil && len(body) <= 16384 {
				values["somewhere_probe_success"] = 1
			}

			if response.TLS != nil && len(response.TLS.PeerCertificates) > 0 {
				values["somewhere_probe_certificate_days"] = response.TLS.PeerCertificates[0].NotAfter.Sub(now).Hours() / 24
			}

			lock.Unlock()
		}
	}

	lock.Lock()
	defer lock.Unlock()
	values["somewhere_probe_duration_seconds"] = time.Since(start).Seconds()
	// HTTP callbacks may finish after cancellation. Return an independent snapshot.
	result := make(map[string]float64, len(values))
	for key, value := range values {
		result[key] = value
	}

	return result
}
