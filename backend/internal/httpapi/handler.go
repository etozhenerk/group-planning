package httpapi

import (
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type previewResponse struct {
	MeetingID      string     `json:"meeting_id"`
	Title          string     `json:"title"`
	StartsAt       *time.Time `json:"starts_at"`
	Timezone       string     `json:"timezone"`
	Place          *string    `json:"place"`
	CoverURL       *string    `json:"cover_url"`
	MyRSVP         *string    `json:"my_rsvp"`
	MyRSVPRevision string     `json:"my_rsvp_revision"`
}

// New builds public routes and disabled auth endpoints for standalone storage tests.
func New(store meetings.Store, logger *slog.Logger) http.Handler {
	return NewWithIdentity(store, nil, logger)
}

// NewWithIdentity binds verified identity to authentication routes. A nil service
// disables sign-in and never authorizes a user.
func NewWithIdentity(store meetings.Store, service *identity.Service, logger *slog.Logger) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		if !getOnly(w, r) {
			return
		}
		writeJSON(w, http.StatusOK, struct {
			Status string `json:"status"`
		}{"ok"})
	})
	mux.HandleFunc("/api/v1/invitations/{token}", func(w http.ResponseWriter, r *http.Request) {
		if !getOnly(w, r) {
			return
		}
		if r.URL.RawQuery != "" {
			writeError(w, http.StatusBadRequest, "invalid_query", nil)
			return
		}
		preview, err := meetings.Preview(r.Context(), store, r.PathValue("token"))
		if errors.Is(err, meetings.ErrNotFound) {
			writeError(w, http.StatusNotFound, "not_found", nil)
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", nil)
			return
		}
		var place *string
		if preview.Place != "" {
			place = &preview.Place
		}
		writeJSON(w, http.StatusOK, previewResponse{MeetingID: preview.MeetingID,
			Title: preview.Title, StartsAt: preview.StartsAt, Timezone: preview.Timezone,
			Place: place, MyRSVPRevision: "0"})
	})
	registerAuth(mux, service)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotFound, "not_found", nil)
	})
	return middleware(mux, logger)
}

func getOnly(w http.ResponseWriter, r *http.Request) bool {
	if r.Method == http.MethodGet || r.Method == http.MethodHead {
		return true
	}
	w.Header().Set("Allow", "GET, HEAD")
	writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", nil)
	return false
}
