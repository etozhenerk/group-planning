package httpapi

import (
	"net/http"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

func (h authHandlers) deleteAccount(w http.ResponseWriter, r *http.Request) {
	if h.deletion == nil {
		writeError(w, 503, "auth_unavailable", nil)
		return
	}

	token, web, err := sessionCredentials(r)
	if err == nil {
		err = h.deletion.Delete(r.Context(), identity.DeletionInput{
			SessionToken: token, Web: web,
			Token:  singleHeader(r, "X-Deletion-Token"),
			Origin: singleHeader(r, "Origin"), CSRF: singleHeader(r, "X-CSRF-Token"),
		})
	}

	if err != nil {
		writeAuthError(w, err)
		return
	}

	if web {
		setSecureCookie(w, sessionCookie, "", time.Unix(1, 0), -1)
	}

	w.WriteHeader(http.StatusNoContent)
}
