package httpapi

import (
	"crypto/rand"
	"encoding/hex"
	"log/slog"
	"net/http"
	"path"
	"time"
)

type responseWriter struct {
	http.ResponseWriter
	status int
	head   bool
}

func (w *responseWriter) WriteHeader(status int) {
	if w.status != 0 {
		return
	}
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func (w *responseWriter) Write(data []byte) (int, error) {
	if w.status == 0 {
		w.WriteHeader(http.StatusOK)
	}
	if w.head {
		return len(data), nil
	}
	return w.ResponseWriter.Write(data)
}

func middleware(next http.Handler, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		id := requestID()
		w.Header().Set("X-Request-ID", id)
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		response := &responseWriter{ResponseWriter: w, head: r.Method == http.MethodHead}
		defer func() {
			if recover() != nil {
				// Panic values and request URLs may contain tokens or private text.
				// Only a safe code and generated correlation ID enter the log.
				if response.status != 0 {
					panic(http.ErrAbortHandler)
				}
				writeError(response, http.StatusInternalServerError, "internal_error", nil)
			}
			logger.Info("http_request", "request_id", id, "status", response.status,
				"duration_ms", time.Since(started).Milliseconds())
		}()
		if r.URL.Path != path.Clean(r.URL.Path) {
			writeError(response, http.StatusNotFound, "not_found", nil)
			return
		}
		next.ServeHTTP(response, r)
	})
}

func requestID() string {
	var data [16]byte
	_, _ = rand.Read(data[:]) // crypto/rand.Read does not return errors in Go 1.27.
	data[6] = data[6]&0x0f | 0x40
	data[8] = data[8]&0x3f | 0x80
	encoded := hex.EncodeToString(data[:])
	return encoded[:8] + "-" + encoded[8:12] + "-" + encoded[12:16] + "-" + encoded[16:20] + "-" + encoded[20:]
}
