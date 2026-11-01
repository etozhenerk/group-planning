package server

import (
	"bufio"
	"errors"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type shortMetricWriter struct{ header http.Header }

func (w *shortMetricWriter) Header() http.Header       { return w.header }
func (w *shortMetricWriter) WriteHeader(int)           {}
func (w *shortMetricWriter) Write([]byte) (int, error) { return 3, io.ErrShortWrite }

func TestHTTPMetricsShortWriteCountsActualBytesAndFailure(t *testing.T) {
	metrics := &httpMetrics{}
	response := &shortMetricWriter{header: make(http.Header)}
	metrics.wrap(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		n, err := w.Write([]byte("long response"))
		if n != 3 || !errors.Is(err, io.ErrShortWrite) {
			t.Error("write result changed")
		}
	})).ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/v1/meetings", nil))
	if metrics.data.Requests[1][4] != 1 || metrics.data.Traffic[4][0].Written != 3 {
		t.Fatal("failed response treated as success or declared bytes used")
	}
}

func TestHTTPMetricsPreservesResponseControllerAndWebSocketUpgrade(t *testing.T) {
	metrics := &httpMetrics{}
	completed := make(chan struct{})
	server := httptest.NewServer(metrics.wrap(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer close(completed)
		controller := http.NewResponseController(w)
		if err := controller.SetWriteDeadline(time.Now().Add(time.Second)); err != nil {
			t.Error("write deadline lost", err)
			return
		}

		conn, buffer, err := controller.Hijack()
		if err != nil {
			t.Error("hijack lost", err)
			return
		}
		defer conn.Close()
		_, _ = buffer.WriteString("HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n")
		if err := buffer.Flush(); err != nil {
			t.Error(err)
		}
	})))
	defer server.Close()
	conn, err := net.DialTimeout("tcp", strings.TrimPrefix(server.URL, "http://"), time.Second)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	_ = conn.SetDeadline(time.Now().Add(time.Second))
	_, _ = io.WriteString(conn, "GET /api/v1/realtime HTTP/1.1\r\nHost: localhost\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n")
	response, err := http.ReadResponse(bufio.NewReader(conn), nil)
	if err != nil {
		t.Fatal(err)
	}

	response.Body.Close()
	if response.StatusCode != 101 {
		t.Fatal("upgrade changed", response.StatusCode)
	}

	<-completed
	// Scrape through the mutex because the metrics defer runs after handler return.
	deadline := time.Now().Add(time.Second)
	for {
		text := metricsText(t, metrics)
		if strings.Contains(text, `somewhere_api_requests_total{operation="other",outcome="informational"} 1`) {
			break
		}

		if time.Now().After(deadline) {
			t.Fatal("upgrade not observed", text)
		}
	}
}

func TestHTTPMetricsFlushCommitsStatus(t *testing.T) {
	metrics := &httpMetrics{}
	response := httptest.NewRecorder()
	metrics.wrap(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := http.NewResponseController(w).Flush(); err != nil {
			t.Error(err)
		}

		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte("streamed"))
	})).ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/v1/meetings", nil))
	if !response.Flushed || response.Code != 200 || metrics.data.Requests[1][0] != 1 {
		t.Fatal("flush or final status changed")
	}
}
