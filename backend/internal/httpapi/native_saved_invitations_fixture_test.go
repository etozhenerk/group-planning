package httpapi

import (
	"context"
	"net/http"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func seedNativeSavedInvitation(t *testing.T, store *memory.Store, identityService *identity.Service, name string) iosFixtureCredential {
	t.Helper()
	credential := iosCredential(t, identityService, name)
	principal, err := identityService.Authenticate(context.Background(), credential.Token, false)
	if err != nil {
		t.Fatal(err)
	}

	service := meetings.NewService(store, time.Now)
	_, err = service.Respond(context.Background(), meetings.Actor{ID: principal.User.ID, Name: principal.User.DisplayName}, "", iosInvitationToken, meetings.Maybe, 0, "b1000000-0000-4000-8000-000000000001")
	if err != nil {
		t.Fatal(err)
	}

	return credential
}

type nativeSavedInvitationFaults struct {
	mu             sync.Mutex
	listFailed     bool
	responseFailed bool
}

func (f *nativeSavedInvitationFaults) handler(api http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		scenario := r.Header.Get("X-Somewhere-Test-Scenario")
		f.mu.Lock()
		fail := false
		if scenario == "saved-error" && r.Method == http.MethodGet && r.URL.Path == "/api/v1/invitations" && !f.listFailed {
			f.listFailed, fail = true, true
		}

		if scenario == "saved-invitations" && r.Method == http.MethodPut && !f.responseFailed {
			f.responseFailed, fail = true, true
		}

		f.mu.Unlock()
		if fail {
			http.Error(w, "fixture unavailable before commit", http.StatusServiceUnavailable)
			return
		}

		api.ServeHTTP(w, r)
	})
}
