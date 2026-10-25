package httpapi

import (
	"errors"
	"net"
	"net/http"

	"github.com/etozhenerk/group-planning/backend/internal/support"
)

type feedbackReceipt struct {
	ID        string `json:"id"`
	Reference string `json:"reference"`
	Status    string `json:"status"`
}

func registerSupport(mux *http.ServeMux, service *support.Service) {
	mux.HandleFunc("/api/v1/support/feedback", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		if r.Method != http.MethodPost {
			w.Header().Set("Allow", "POST")
			writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", nil)

			return
		}

		if service == nil {
			writeError(w, http.StatusServiceUnavailable, "support_unavailable", nil)
			return
		}

		var input support.Input
		if !decodeJSONLimit(w, r, &input, 7<<20) {
			return
		}

		source, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			source = "unknown"
		}

		receipt, err := service.Submit(r.Context(), input, r.Header.Get("Idempotency-Key"), source)
		if err != nil {
			var invalid support.ValidationError
			switch {
			case errors.As(err, &invalid):
				writeError(w, http.StatusUnprocessableEntity, "validation_failed", invalid.Fields)
			case errors.Is(err, support.ErrRateLimited):
				w.Header().Set("Retry-After", "600")
				writeError(w, http.StatusTooManyRequests, "rate_limited", nil)
			case errors.Is(err, support.ErrIdempotencyConflict):
				writeError(w, http.StatusConflict, "idempotency_conflict", nil)
			default:
				writeError(w, http.StatusServiceUnavailable, "support_unavailable", nil)
			}

			return
		}

		writeJSON(w, http.StatusCreated, feedbackReceipt{ID: receipt.ID, Reference: receipt.Reference, Status: "accepted"})
	})
}
