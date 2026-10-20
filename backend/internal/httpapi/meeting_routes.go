package httpapi

import (
	"errors"
	"net/http"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type meetingHandlers struct {
	app      *meetings.Service
	identity *identity.Service
	auth     authHandlers
}

func registerMeetings(mux *http.ServeMux, store meetings.Store, service *identity.Service) {
	h := meetingHandlers{meetings.NewService(store, time.Now), service, authHandlers{service}}
	mux.HandleFunc("/api/v1/meetings", h.collection)
	mux.HandleFunc("/api/v1/meetings/{id}", h.details)
	mux.HandleFunc("/api/v1/meetings/{id}/invitation", h.invitation)
	mux.HandleFunc("/api/v1/meetings/{id}/participants", h.participants)
	mux.HandleFunc("/api/v1/meetings/{id}/rsvp", h.respond)
	mux.HandleFunc("/api/v1/meetings/{id}/feed", h.feed)
	mux.HandleFunc("/api/v1/meetings/{id}/messages", h.message)
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
	return h.identity.PublicOrigin() + "/invitations/" + token
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

func writeMeetingError(w http.ResponseWriter, err error) {
	var validation meetings.ValidationError
	var conflict *meetings.Conflict
	switch {
	case errors.As(err, &validation):
		writeError(w, 422, "validation_failed", validation.Fields)
	case errors.As(err, &conflict):
		detail := errorDetail{
			Code:        conflict.Code,
			FieldErrors: map[string]string{},
			RequestID:   w.Header().Get("X-Request-ID"),
		}
		if conflict.Current != nil {
			value := meetingDTO(*conflict.Current)
			detail.CurrentMeeting = &value
		}

		if conflict.Response != nil {
			value := rsvpDTO(*conflict.Response)
			detail.CurrentResponse = &value
		}

		writeJSON(w, 409, errorBody{detail})
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
