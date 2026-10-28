package httpapi

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/accounts"
	"github.com/etozhenerk/group-planning/backend/internal/albumexport"
	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/support"
)

type previewResponse struct {
	Organizer          *userResponse `json:"organizer,omitempty"`
	MeetingID          string        `json:"meeting_id"`
	Title              string        `json:"title"`
	Description        *string       `json:"description"`
	StartsOn           *string       `json:"starts_on"`
	StartsAt           *time.Time    `json:"starts_at"`
	Timezone           string        `json:"timezone"`
	Place              *string       `json:"place"`
	CoverURL           *string       `json:"cover_url"`
	MyRSVP             *string       `json:"my_rsvp"`
	MyRSVPRevision     string        `json:"my_rsvp_revision"`
	JoinClosesAt       *time.Time    `json:"join_closes_at"`
	CanJoin            bool          `json:"can_join"`
	JoinDisabledReason *string       `json:"join_disabled_reason"`
}

// New binds meeting operations to public routes with authentication disabled.
func New(app *meetings.Service, logger *slog.Logger) http.Handler {
	return NewWithIdentity(app, nil, logger)
}

// NewWithIdentity binds verified identity to authentication routes. A nil service
// disables sign-in and never authorizes a user.
func NewWithIdentity(app *meetings.Service, service *identity.Service, logger *slog.Logger, deletion ...*accounts.Service) http.Handler {
	return NewWithSupport(app, service, nil, logger, deletion...)
}

// NewWithSupport exposes feedback only when an acceptance store is configured.
func NewWithSupport(app *meetings.Service, service *identity.Service, feedback *support.Service, logger *slog.Logger, deletion ...*accounts.Service) http.Handler {
	return NewWithRealtime(app, service, feedback, logger, nil, deletion...)
}

// NewWithRealtime enables the optional authenticated WebSocket adapter.
func NewWithRealtime(app *meetings.Service, service *identity.Service, feedback *support.Service, logger *slog.Logger, stream RealtimeHandler, deletion ...*accounts.Service) http.Handler {
	return NewWithExports(app, service, feedback, logger, stream, nil, deletion...)
}

// NewWithExports adds a lifecycle-managed private album export adapter.
func NewWithExports(app *meetings.Service, service *identity.Service, feedback *support.Service, logger *slog.Logger, stream RealtimeHandler, exports *albumexport.Manager, deletion ...*accounts.Service) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		if !getOnly(w, r) {
			return
		}

		writeJSON(w, http.StatusOK, struct {
			Status string `json:"status"`
		}{"ok"})
	})
	registerMeetings(mux, app, service, stream != nil)
	registerAlbumExports(mux, app, service, exports)
	if stream != nil && service != nil {
		mux.HandleFunc("/api/v1/realtime", realtimeRoute(service, stream))
	}

	registerAuth(mux, service, deletion...)
	registerSupport(mux, feedback)
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
