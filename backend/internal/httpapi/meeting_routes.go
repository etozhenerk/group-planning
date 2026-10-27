package httpapi

import (
	"errors"
	"net/http"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type meetingHandlers struct {
	realtime bool
	app      *meetings.Service
	identity *identity.Service
	auth     authHandlers
}

func registerMeetings(mux *http.ServeMux, app *meetings.Service, service *identity.Service, realtime ...bool) {
	h := meetingHandlers{app: app, identity: service, auth: authHandlers{service: service}}
	if len(realtime) > 0 {
		h.realtime = realtime[0]
	}

	mux.HandleFunc("/api/v1/meetings/{id}/media/limits", h.mediaLimits)
	mux.HandleFunc("/api/v1/meetings/{id}/media/uploads", h.prepareMedia)
	mux.HandleFunc("/api/v1/meetings/{id}/media/{media_id}/content", h.mediaContent)
	mux.HandleFunc("/api/v1/meetings/{id}/media/{media_id}/publish", h.publishMedia)
	mux.HandleFunc("/api/v1/meetings/{id}/memories", h.memories)
	mux.HandleFunc("/api/v1/meetings/{id}/cover", h.readCover)
	mux.HandleFunc("/api/v1/invitations/{token}/cover", h.readInvitationCover)
	mux.HandleFunc("/api/v1/meetings", h.collection)
	mux.HandleFunc("/api/v1/meetings/{id}", h.details)
	mux.HandleFunc("/api/v1/meetings/{id}/invitation", h.invitation)
	mux.HandleFunc("/api/v1/meetings/{id}/participants", h.participants)
	mux.HandleFunc("/api/v1/meetings/{id}/rsvp", h.respond)
	mux.HandleFunc("/api/v1/meetings/{id}/feed", h.feed)
	mux.HandleFunc("/api/v1/meetings/{id}/sync", h.sync)
	mux.HandleFunc("/api/v1/meetings/{id}/read-marker", h.readMarker)
	mux.HandleFunc("/api/v1/meetings/{id}/read-receipts/query", h.readReceipts)
	mux.HandleFunc("/api/v1/meetings/{id}/messages/{entry_id}/readers", h.messageReaders)
	mux.HandleFunc("/api/v1/chat-capabilities", h.chatCapabilities)
	mux.HandleFunc("/api/v1/meetings/{id}/messages", h.message)
	mux.HandleFunc("/api/v1/meetings/{id}/reactions", h.reactions)
	mux.HandleFunc("/api/v1/meetings/{id}/messages/{entry_id}/reactions", h.setReaction)
	mux.HandleFunc("/api/v1/meetings/{id}/date-polls", h.createDatePoll)
	mux.HandleFunc("/api/v1/meetings/{id}/date-polls/{poll_id}", h.readDatePoll)
	mux.HandleFunc("/api/v1/meetings/{id}/date-polls/{poll_id}/vote", h.voteDatePoll)
	mux.HandleFunc("/api/v1/meetings/{id}/date-polls/{poll_id}/options", h.addDateOption)
	mux.HandleFunc("/api/v1/meetings/{id}/date-polls/{poll_id}/resolve", h.resolveDatePoll)
	mux.HandleFunc("/api/v1/meetings/{id}/place-polls", h.createPlacePoll)
	mux.HandleFunc("/api/v1/meetings/{id}/place-polls/{poll_id}", h.readPlacePoll)
	mux.HandleFunc("/api/v1/meetings/{id}/place-polls/{poll_id}/vote", h.votePlacePoll)
	mux.HandleFunc("/api/v1/meetings/{id}/preparation-tasks", h.createPreparationTask)
	mux.HandleFunc("/api/v1/meetings/{id}/preparation-tasks/{task_id}", h.readPreparationTask)
	mux.HandleFunc("/api/v1/meetings/{id}/preparation-tasks/{task_id}/{action}", h.actOnPreparationTask)
	mux.HandleFunc("/api/v1/invitations", h.savedInvitations)
	mux.HandleFunc("/api/v1/invitations/{token}", h.preview)
	mux.HandleFunc("/api/v1/invitations/{token}/rsvp", h.respond)
}

func (h meetingHandlers) actor(w http.ResponseWriter, r *http.Request, mutation bool) (meetings.Actor, bool) {
	principal, _, err := h.auth.authenticate(r)
	if err == nil && mutation {
		err = h.identity.AuthorizeMutation(principal, singleHeader(r, "Origin"), singleHeader(r, "X-CSRF-Token"))
	}

	if err != nil {
		writeAuthError(w, err)
		return meetings.Actor{}, false
	}

	return meetings.Actor{ID: principal.User.ID, Name: principal.User.DisplayName}, true
}

func (h meetingHandlers) link(token string) string {
	return h.identity.PublicOrigin() + "/i/" + token
}

func parseMeetingID(w http.ResponseWriter, r *http.Request) (string, bool) {
	id, err := meetings.ParseUUID(r.PathValue("id"))
	if err != nil {
		writeError(w, 404, "not_found", nil)
		return "", false
	}

	return id, true
}

func requestKey(w http.ResponseWriter, r *http.Request) (string, bool) {
	key, err := meetings.ParseUUID(singleHeader(r, "Idempotency-Key"))
	if err != nil {
		writeError(w, 422, "validation_failed", map[string]string{"idempotency_key": "invalid"})
		return "", false
	}

	return key, true
}

func allowMethods(w http.ResponseWriter, r *http.Request, methods ...string) bool {
	for _, method := range methods {
		if r.Method == method || (r.Method == http.MethodHead && method == http.MethodGet) {
			return true
		}
	}

	value := ""
	for _, method := range methods {
		if value != "" {
			value += ", "
		}

		value += method
		if method == http.MethodGet {
			value += ", HEAD"
		}
	}

	w.Header().Set("Allow", value)
	writeError(w, 405, "method_not_allowed", nil)

	return false
}

func (h meetingHandlers) writeMeetingError(w http.ResponseWriter, err error) {
	var validation meetings.ValidationError
	var conflict *meetings.Conflict
	switch {
	case errors.Is(err, meetings.ErrSyncCursorInvalid):
		writeError(w, 400, "invalid_sync_cursor", nil)
	case errors.Is(err, meetings.ErrSyncResetRequired):
		writeError(w, 410, "sync_reset_required", nil)
	case errors.As(err, &validation):
		writeError(w, 422, "validation_failed", validation.Fields)
	case errors.As(err, &conflict):
		detail := errorDetail{
			Code:        conflict.Code,
			FieldErrors: map[string]string{},
			RequestID:   w.Header().Get("X-Request-ID"),
		}
		if conflict.Current != nil {
			value := h.meetingDTO(*conflict.Current)
			detail.CurrentMeeting = &value
		}

		if conflict.Response != nil {
			value := rsvpDTO(*conflict.Response)
			detail.CurrentResponse = &value
		}

		writeJSON(w, 409, errorBody{detail})
	case errors.Is(err, meetings.ErrMediaUnavailable):
		writeError(w, 503, "media_unavailable", nil)
	case errors.Is(err, meetings.ErrIdempotencyConflict):
		writeError(w, 409, "idempotency_key_reused", nil)
	case errors.Is(err, meetings.ErrNotFound):
		writeError(w, 404, "not_found", nil)
	case errors.Is(err, meetings.ErrForbidden):
		writeError(w, 403, "forbidden", nil)
	case errors.Is(err, meetings.ErrUnauthenticated):
		writeError(w, 401, "unauthenticated", nil)
	default:
		writeError(w, 500, "internal_error", nil)
	}
}
