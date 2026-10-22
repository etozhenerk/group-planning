package httpapi

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type previewResponse struct {
	MeetingID      string     `json:"meeting_id"`
	Title          string     `json:"title"`
	Description    *string    `json:"description"`
	StartsAt       *time.Time `json:"starts_at"`
	Timezone       string     `json:"timezone"`
	Place          *string    `json:"place"`
	CoverURL       *string    `json:"cover_url"`
	MyRSVP         *string    `json:"my_rsvp"`
	MyRSVPRevision string     `json:"my_rsvp_revision"`
}

// New binds meeting operations to public routes with authentication disabled.
func New(app *meetings.Service, logger *slog.Logger) http.Handler {
	return NewWithIdentity(app, nil, logger)
}

// NewWithIdentity binds verified identity to authentication routes. A nil service
// disables sign-in and never authorizes a user.
func NewWithIdentity(app *meetings.Service, service *identity.Service, logger *slog.Logger) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		if !getOnly(w, r) {
			return
		}

		writeJSON(w, http.StatusOK, struct {
			Status string `json:"status"`
		}{"ok"})
	})
	registerMeetings(mux, app, service)
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
