package server

import (
	"bufio"
	"context"
	"errors"
	"io"
	"net"
	"net/http"
	"path"
	"strings"
	"time"
)

func metricRoute(r *http.Request) (operation, group, scope int) {
	operation, group, scope = 7, 3, 1
	cleaned := path.Clean(r.URL.Path)
	if strings.HasPrefix(cleaned, "/assets/") {
		return operation, group, 2
	}

	if cleaned == "/healthz" || cleaned == "/readyz" {
		return 6, group, scope
	}

	if !strings.HasPrefix(cleaned, "/api/") {
		return operation, group, scope
	}

	scope, group = 0, 1
	if r.Method == http.MethodGet || r.Method == http.MethodHead {
		group = 0
	}

	parts := strings.Split(cleaned, "/")
	if len(parts) < 4 || parts[2] != "v1" {
		return operation, group, scope
	}

	switch parts[3] {
	case "auth":
		operation, group = 0, 2
	case "me", "users", "profile":
		operation = 5
	case "invitations":
		operation = 4
	case "meetings":
		operation = 1
		if len(parts) > 5 {
			switch parts[5] {
			case "feed", "messages", "reactions", "sync", "read-marker", "read-receipts":
				operation = 2
			case "date-polls", "place-polls":
				operation = 3
			case "invitation":
				operation = 4
			}
		}
	}

	return operation, group, scope
}

func metricSource(r *http.Request) int {
	// No verified_bot or synthetic claim is possible without trusted source config.
	// UA and forwarding headers are client-controlled, including behind localhost Caddy.
	ua := r.UserAgent()
	if len(ua) > 512 {
		ua = ua[:512]
	}

	ua = strings.ToLower(ua)
	invitation := strings.HasPrefix(r.URL.Path, "/i/") || strings.HasPrefix(r.URL.Path, "/invitations/") || strings.HasPrefix(r.URL.Path, "/api/v1/invitations/")
	for _, preview := range []string{"telegrambot", "whatsapp", "discordbot", "twitterbot", "facebookexternalhit", "slackbot"} {
		if strings.Contains(ua, preview) {
			if invitation {
				return 2 // A presumed preview, not a verified source.
			}

			return 1
		}
	}

	for _, hint := range []string{"bot", "crawler", "spider"} {
		if strings.Contains(ua, hint) {
			return 1
		}
	}

	return 4
}

func metricOutcome(status int, requestErr error, aborted, failedWrite bool) int {
	switch {
	case aborted:
		return 4
	case status == http.StatusGatewayTimeout || errors.Is(requestErr, context.DeadlineExceeded):
		return 5
	case status >= 500:
		return 4
	case errors.Is(requestErr, context.Canceled):
		return 6
	case failedWrite:
		return 4
	case status >= 400:
		if status == http.StatusTooManyRequests {
			return 3
		}

		return 2
	case status >= 300:
		return 1
	case status >= 200:
		return 0
	default:
		return 7
	}
}

func (m *httpMetrics) wrap(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		operation, group, scope := metricRoute(r)
		source := metricSource(r)
		started := time.Now()
		response := &metricWriter{ResponseWriter: w}
		var body *metricBody
		if r.Body != nil && r.Body != http.NoBody {
			body = &metricBody{ReadCloser: r.Body}
			r = r.Clone(r.Context())
			r.Body = body
		}

		m.begin(group)
		defer func() {
			recovered := recover()
			status := response.status
			if status == 0 {
				status = http.StatusOK
			}

			var read uint64
			if body != nil {
				read = body.read
			}

			outcome := metricOutcome(status, r.Context().Err(), recovered != nil, response.failed)
			m.finish(operation, group, scope, source, outcome, time.Since(started).Seconds(), read, response.written)
			if recovered != nil {
				panic(recovered)
			}
		}()
		next.ServeHTTP(response, r)
	})
}

type metricBody struct {
	io.ReadCloser
	read uint64
}

func (b *metricBody) Read(data []byte) (int, error) {
	n, err := b.ReadCloser.Read(data)
	b.read += uint64(n)

	return n, err
}

type metricWriter struct {
	http.ResponseWriter
	status  int
	written uint64
	failed  bool
}

func (w *metricWriter) Unwrap() http.ResponseWriter { return w.ResponseWriter }

func (w *metricWriter) WriteHeader(status int) {
	if w.status != 0 {
		return
	}

	// Informational responses do not commit the final status, except an upgrade.
	if status >= 200 || status == http.StatusSwitchingProtocols {
		w.status = status
	}

	w.ResponseWriter.WriteHeader(status)
}

func (w *metricWriter) Write(data []byte) (int, error) {
	if w.status == 0 {
		w.WriteHeader(http.StatusOK)
	}

	n, err := w.ResponseWriter.Write(data)
	w.written += uint64(n)
	w.failed = w.failed || err != nil

	return n, err
}

func (w *metricWriter) Flush() { _ = w.FlushError() }

func (w *metricWriter) FlushError() error {
	if w.status == 0 {
		w.WriteHeader(http.StatusOK)
	}

	err := http.NewResponseController(w.ResponseWriter).Flush()
	if err != nil {
		w.failed = true
	}

	return err
}

func (w *metricWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	conn, buffer, err := http.NewResponseController(w.ResponseWriter).Hijack()
	if err == nil && w.status == 0 {
		w.status = http.StatusSwitchingProtocols
	}

	return conn, buffer, err
}
