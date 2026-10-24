package httpapi

import (
	"encoding/json"
	"net/http"
	"net/url"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

const (
	sessionCookie       = "__Host-somewhere_session"
	bindingCookiePrefix = "__Host-somewhere_auth_"
)

type authHandlers struct{ service *identity.Service }

type authStartRequest struct {
	ClientKind    string          `json:"client_kind"`
	ReturnContext json.RawMessage `json:"return_context"`
	AppChallenge  json.RawMessage `json:"app_challenge"`
}
type authStartedResponse struct {
	AttemptID        string    `json:"attempt_id"`
	AuthorizationURL string    `json:"authorization_url"`
	ExpiresAt        time.Time `json:"expires_at"`
}
type authContextResponse struct {
	Kind  string `json:"kind"`
	Token string `json:"token,omitempty"`
}

func registerAuth(mux *http.ServeMux, service *identity.Service) {
	handlers := authHandlers{service: service}
	mux.HandleFunc("/api/v1/auth/yandex/start", handlers.start)
	mux.HandleFunc("/api/v1/auth/yandex/callback", handlers.callback)
	mux.HandleFunc("/api/v1/auth/mobile/exchange", handlers.exchange)
	mux.HandleFunc("/api/v1/auth/mobile/sdk/exchange", handlers.exchangeSDK)
	mux.HandleFunc("/api/v1/me", handlers.me)
	mux.HandleFunc("/api/v1/auth/logout", handlers.logout)
}

func (h authHandlers) start(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodPost) {
		return
	}

	if h.service == nil {
		writeError(w, 503, "auth_unavailable", nil)
		return
	}

	var input authStartRequest
	if !decodeJSON(w, r, &input) {
		return
	}

	context, ok := parseAuthContext(input.ReturnContext)
	if !ok {
		writeError(w, 400, "invalid_json", nil)
		return
	}

	// The web branch forbids app_challenge even when explicitly empty/null.
	if input.ClientKind == "web" && len(input.AppChallenge) > 0 {
		writeError(w, 422, "validation_failed", map[string]string{"app_challenge": "not_allowed"})
		return
	}

	appChallenge := ""
	if len(input.AppChallenge) > 0 {
		if json.Unmarshal(input.AppChallenge, &appChallenge) != nil {
			writeError(w, 422, "validation_failed", map[string]string{"app_challenge": "invalid"})
			return
		}
	}

	result, err := h.service.Start(r.Context(), identity.StartInput{ClientKind: input.ClientKind, Context: context, AppChallenge: appChallenge}, singleHeader(r, "Origin"))
	if err != nil {
		writeAuthError(w, err)
		return
	}

	if result.BindingSecret != "" {
		setSecureCookie(w, bindingCookiePrefix+result.AttemptID, result.BindingSecret, result.ExpiresAt, 600)
	}

	writeJSON(w, 200, authStartedResponse{result.AttemptID, result.AuthorizationURL, result.ExpiresAt})
}

func parseAuthContext(data json.RawMessage) (identity.ReturnContext, bool) {
	var kind struct {
		Kind string `json:"kind"`
	}
	if json.Unmarshal(data, &kind) != nil {
		return identity.ReturnContext{}, false
	}

	if kind.Kind == "home" {
		if validateJSONNames(data, &kind) != nil {
			return identity.ReturnContext{}, false
		}

		return identity.ReturnContext{Kind: "home"}, true
	}

	var invitation struct {
		Kind  string `json:"kind"`
		Token string `json:"token"`
	}
	if kind.Kind != "invitation" || validateJSONNames(data, &invitation) != nil || json.Unmarshal(data, &invitation) != nil {
		return identity.ReturnContext{}, false
	}

	return identity.ReturnContext{Kind: "invitation", Token: invitation.Token}, true
}

func (h authHandlers) callback(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	if h.service == nil {
		writeError(w, 503, "auth_unavailable", nil)
		return
	}

	query, err := parseCallbackQuery(r)
	if err != nil {
		writeError(w, 400, "auth_invalid", nil)
		return
	}

	binding, _ := uniqueCookie(r, bindingCookiePrefix+identity.AttemptID(query.State))
	query.Binding = binding
	result, err := h.service.Callback(r.Context(), query)
	if err != nil {
		writeAuthError(w, err)
		return
	}

	if result.ClientKind == "web" {
		setSecureCookie(w, bindingCookiePrefix+result.AttemptID, "", time.Unix(1, 0), -1)
		if result.SessionSecret != "" {
			setSecureCookie(w, sessionCookie, result.SessionSecret, result.ExpiresAt, result.SessionMaxAge)
		}
	}

	// Empty 303 body avoids reflecting provider parameters or handoff codes in HTML.
	w.Header().Set("Location", result.RedirectURL)
	w.WriteHeader(http.StatusSeeOther)
}

func setSecureCookie(w http.ResponseWriter, name, value string, expires time.Time, maxAge int) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Expires:  expires,
		MaxAge:   maxAge,
	})
}

func requireMethod(w http.ResponseWriter, r *http.Request, method string) bool {
	if r.Method == method {
		return true
	}

	w.Header().Set("Allow", method)
	writeError(w, 405, "method_not_allowed", nil)

	return false
}

func singleHeader(r *http.Request, name string) string {
	values := r.Header.Values(name)
	if len(values) != 1 {
		return ""
	}

	return values[0]
}

func uniqueCookie(r *http.Request, name string) (string, bool) {
	value := ""
	found := false
	for _, cookie := range r.Cookies() {
		if cookie.Name == name {
			if found {
				return "", false
			}

			found = true
			value = cookie.Value
		}
	}

	return value, found
}

// OAuth extensions (including Yandex's cid) are ignored per RFC 6749 section 4.1.2.
// Malformed encoding and duplicate parameters remain invalid.
func parseCallbackQuery(r *http.Request) (identity.CallbackInput, error) {
	values, err := url.ParseQuery(r.URL.RawQuery)
	if err != nil {
		return identity.CallbackInput{}, identity.ErrInvalidAttempt
	}

	for _, items := range values {
		if len(items) != 1 {
			err = identity.ErrInvalidAttempt
		}
	}

	return identity.CallbackInput{
		State:         values.Get("state"),
		Code:          values.Get("code"),
		ProviderError: values.Get("error"),
	}, err
}
