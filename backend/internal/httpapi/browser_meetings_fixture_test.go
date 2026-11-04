package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"sync/atomic"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

// browserMeetingsClock exists only in the opt-in Go test server. Identity keeps
// its real clock: moving meeting time must not manufacture expired login cookies.
type browserMeetingsClock struct{ stamp atomic.Int64 }

func newBrowserMeetingsClock() *browserMeetingsClock {
	clock := &browserMeetingsClock{}
	clock.stamp.Store(time.Now().UnixMilli())

	return clock
}

func (c *browserMeetingsClock) now() time.Time {
	return time.UnixMilli(c.stamp.Load()).UTC()
}

func (c *browserMeetingsClock) mount(mux *http.ServeMux, app *meetings.Service) {
	mux.HandleFunc("GET /__test/meetings-clock", func(w http.ResponseWriter, r *http.Request) {
		fixtureJSON(w, map[string]any{"now": c.now(), "automatic_transitions": false})
	})
	mux.HandleFunc("POST /__test/meetings-clock", func(w http.ResponseWriter, r *http.Request) {
		var input struct {
			Now time.Time `json:"now"`
		}
		decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1024))
		decoder.DisallowUnknownFields()
		if decoder.Decode(&input) != nil || input.Now.IsZero() {
			http.Error(w, "expected RFC3339 now", http.StatusBadRequest)
			return
		}

		c.stamp.Store(input.Now.UnixMilli())
		fixtureJSON(w, map[string]any{"now": c.now(), "automatic_transitions": false})
	})
	mux.HandleFunc("POST /__test/run-transition", func(w http.ResponseWriter, r *http.Request) {
		job, err := app.ClaimTransition(r.Context(), meetings.DefaultTransitionOptions())
		if errors.Is(err, meetings.ErrNotFound) {
			fixtureJSON(w, map[string]bool{"processed": false})
			return
		}

		if err != nil {
			http.Error(w, "transition claim failed", http.StatusInternalServerError)
			return
		}

		if err := app.CompleteTransition(r.Context(), job); err != nil {
			http.Error(w, "transition completion failed", http.StatusInternalServerError)
			return
		}

		fixtureJSON(w, map[string]any{"processed": true, "meeting_id": job.MeetingID})
	})
}

func fixtureJSON(w http.ResponseWriter, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	_ = json.NewEncoder(w).Encode(value)
}

func seedBrowserLegacyMeeting(t *testing.T, store *memory.Store, auth *identity.Service, owner iosFixtureCredential) {
	t.Helper()
	const id = "c4444444-4444-4444-8444-444444444444"
	seedIOSInvitation(t, store, auth, owner, id, "YnJvd3Nlci11bmRhdGVkMQ", "Поход", "d"+id[1:], "e"+id[1:])
	principal, err := auth.Authenticate(t.Context(), owner.Token, false)
	if err != nil {
		t.Fatal(err)
	}

	err = store.Update(t.Context(), func(w meetings.Writer) error {
		return w.SaveMeeting(meetings.Meeting{
			ID: id, OrganizerID: principal.User.ID, Title: "Поход", Timezone: "Europe/Moscow",
			Place: "У друзей", Status: meetings.Undated, ScheduleVersion: 1, Revision: 1,
			CreatedAt: time.Now().UTC(),
		})
	})
	if err != nil {
		t.Fatal(err)
	}
}
