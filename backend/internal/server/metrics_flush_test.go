package server

import (
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

type independentPlainWriter struct {
	h    http.Header
	code int
}

func (w *independentPlainWriter) Header() http.Header { return w.h }
func (w *independentPlainWriter) WriteHeader(code int) {
	if w.code == 0 {
		w.code = code
	}
}
func (w *independentPlainWriter) Write(p []byte) (int, error) { return len(p), nil }

type independentFailFlushWriter struct {
	independentPlainWriter
	calls int
}

func (w *independentFailFlushWriter) FlushError() error { w.calls++; return io.ErrClosedPipe }

// Compare the documented ResponseController contract on exactly the same base writer.
func TestIndependentMetricsPreservesUnsupportedFlushError(t *testing.T) {
	base := &independentPlainWriter{h: make(http.Header)}
	originalErr := http.NewResponseController(base).Flush()
	wrappedErr := http.NewResponseController(&metricWriter{ResponseWriter: base}).Flush()
	t.Logf("base=%v wrapped=%v committed_status=%d", originalErr, wrappedErr, base.code)
	if !errors.Is(originalErr, http.ErrNotSupported) || !errors.Is(wrappedErr, http.ErrNotSupported) {
		t.Fatalf("Flush error compatibility changed: base=%v wrapped=%v", originalErr, wrappedErr)
	}
}

func TestIndependentMetricsPreservesRealFlushFailure(t *testing.T) {
	base := &independentFailFlushWriter{independentPlainWriter: independentPlainWriter{h: make(http.Header)}}
	originalErr := http.NewResponseController(base).Flush()
	wrappedErr := http.NewResponseController(&metricWriter{ResponseWriter: base}).Flush()
	t.Logf("base=%v wrapped=%v flush_calls=%d", originalErr, wrappedErr, base.calls)
	if !errors.Is(originalErr, io.ErrClosedPipe) || !errors.Is(wrappedErr, io.ErrClosedPipe) {
		t.Fatalf("underlying FlushError lost: base=%v wrapped=%v", originalErr, wrappedErr)
	}
}

// A failed flush must also enter server failures, not a successful response.
func TestHTTPMetricsFlushFailureBookkeeping(t *testing.T) {
	metrics := &httpMetrics{}
	base := &independentFailFlushWriter{independentPlainWriter: independentPlainWriter{h: make(http.Header)}}
	metrics.wrap(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := http.NewResponseController(w).Flush(); !errors.Is(err, io.ErrClosedPipe) {
			t.Error("flush failure not forwarded", err)
		}

		w.(http.Flusher).Flush() // Legacy callers cannot receive an error; keep observing it.
	})).ServeHTTP(base, httptest.NewRequest(http.MethodGet, "/api/v1/meetings", nil))
	if base.code != http.StatusOK || base.calls != 2 || metrics.data.Requests[1][4] != 1 || metrics.data.Inflight[0] != 0 {
		t.Fatal("flush implicit status, delegation or error accounting changed", base, metrics.data.Requests, metrics.data.Inflight)
	}
}
