package httpapi

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

type exchangeRequest struct {
	AttemptID   string `json:"attempt_id"`
	HandoffCode string `json:"handoff_code"`
	AppVerifier string `json:"app_verifier"`
}
type exchangeResponse struct {
	SessionToken  string              `json:"session_token"`
	ExpiresAt     time.Time           `json:"expires_at"`
	ReturnContext authContextResponse `json:"return_context"`
}
type userResponse struct {
	ID          string `json:"id"`
	DisplayName string `json:"display_name"`
}
type meResponse struct {
	User      userResponse `json:"user"`
	ExpiresAt time.Time    `json:"expires_at"`
	CSRFToken *string      `json:"csrf_token"`
}

func (h authHandlers) exchange(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodPost) {
		return
	}

	if h.service == nil {
		writeError(w, 503, "auth_unavailable", nil)
		return
	}

	var input exchangeRequest
	if !decodeJSON(w, r, &input) {
		return
	}

	result, err := h.service.Exchange(r.Context(), input.AttemptID, input.HandoffCode, input.AppVerifier)
	if err != nil {
		writeAuthError(w, err)
		return
	}

	writeJSON(w, 200, exchangeResponse{result.Secret, result.ExpiresAt, authContextResponse{result.Context.Kind, result.Context.Token}})
}

func (h authHandlers) me(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodDelete {
		h.deleteAccount(w, r)
		return
	}

	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD, DELETE")
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", nil)

		return
	}

	principal, _, err := h.authenticate(r)
	if err != nil {
		writeAuthError(w, err)
		return
	}

	var csrf *string
	if principal.ClientKind == "web" {
		csrf = &principal.CSRF
	}

	writeJSON(w, 200, meResponse{userResponse{principal.User.ID, principal.User.DisplayName}, principal.ExpiresAt, csrf})
}

func (h authHandlers) logout(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodPost) {
		return
	}

	principal, token, err := h.authenticate(r)
	if err == nil {
		err = h.service.AuthorizeMutation(principal, singleHeader(r, "Origin"), singleHeader(r, "X-CSRF-Token"))
	}

	if err == nil {
		err = h.service.Logout(r.Context(), token)
	}

	if err != nil {
		writeAuthError(w, err)
		return
	}

	if principal.ClientKind == "web" {
		setSecureCookie(w, sessionCookie, "", time.Unix(1, 0), -1)
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h authHandlers) authenticate(r *http.Request) (identity.Principal, string, error) {
	if h.service == nil {
		return identity.Principal{}, "", identity.ErrUnauthenticated
	}

	token, web, err := sessionCredentials(r)
	if err != nil {
		return identity.Principal{}, "", err
	}

	principal, err := h.service.Authenticate(r.Context(), token, web)

	return principal, token, err
}

func writeAuthError(w http.ResponseWriter, err error) {
	var invalid identity.ValidationError
	switch {
	case errors.As(err, &invalid):
		writeError(w, 422, "validation_failed", map[string]string{invalid.Field: "invalid"})
	case errors.Is(err, identity.ErrInvalidAttempt):
		writeError(w, 400, "auth_invalid", nil)
	case errors.Is(err, identity.ErrUnauthenticated):
		writeError(w, 401, "unauthenticated", nil)
	case errors.Is(err, identity.ErrForbidden):
		writeError(w, 403, "forbidden", nil)
	case errors.Is(err, identity.ErrUnavailable):
		writeError(w, 503, "auth_unavailable", nil)
	default:
		writeError(w, 500, "internal_error", nil)
	}
}

func sessionCredentials(r *http.Request) (string, bool, error) {
	cookie, hasCookie := uniqueCookie(r, sessionCookie)
	count := 0
	for _, c := range r.Cookies() {
		if c.Name == sessionCookie {
			count++
		}
	}

	if count > 1 {
		return "", true, identity.ErrUnauthenticated
	}

	auth := r.Header.Values("Authorization")
	if len(auth) > 0 && hasCookie {
		return "", true, identity.ErrUnauthenticated
	}

	token := cookie
	web := true
	if len(auth) > 0 {
		if len(auth) != 1 || !strings.HasPrefix(auth[0], "Bearer ") {
			return "", true, identity.ErrUnauthenticated
		}

		token = strings.TrimPrefix(auth[0], "Bearer ")
		web = false
	}

	return token, web, nil
}
