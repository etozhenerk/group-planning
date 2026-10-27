package httpapi

import (
	"net/http"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

// RealtimeHandler receives the existing authenticated HTTP session, never client IDs.
type RealtimeHandler func(http.ResponseWriter, *http.Request, identity.Principal, string, bool)

func realtimeRoute(auth *identity.Service, stream RealtimeHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.Header().Set("Allow", "GET")
			writeError(w, 405, "method_not_allowed", nil)

			return
		}

		if r.URL.RawQuery != "" || r.URL.ForceQuery {
			writeError(w, 400, "invalid_query", nil)
			return
		}

		token, web, err := sessionCredentials(r)
		if err != nil || token == "" {
			writeAuthError(w, identity.ErrUnauthenticated)
			return
		}

		if len(r.Header.Values("Origin")) > 1 || (web && r.Header.Get("Origin") != auth.PublicOrigin()) || (!web && r.Header.Get("Origin") != "" && r.Header.Get("Origin") != auth.PublicOrigin()) {
			writeAuthError(w, identity.ErrForbidden)
			return
		}

		p, err := auth.Authenticate(r.Context(), token, web)
		if err != nil {
			writeAuthError(w, err)
			return
		}

		stream(w, r, p, token, web)
	}
}
