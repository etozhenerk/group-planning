package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"image"
	"image/color"
	"io"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

const nativeCoverMeeting = "c0fe0000-0000-4000-8000-000000000100"

func seedNativeCoverFixture(t *testing.T, store *memory.Store, identityService *identity.Service) iosFixtureCredential {
	t.Helper()
	credential := iosCredential(t, identityService, "cover-edit")
	principal, err := identityService.Authenticate(context.Background(), credential.Token, false)
	if err != nil {
		t.Fatal(err)
	}

	now := time.Now().UTC()
	if err := store.Update(context.Background(), func(w meetings.Writer) error {
		return w.SaveMeeting(meetings.Meeting{ID: nativeCoverMeeting, OrganizerID: principal.User.ID, Title: "Встреча с фото", StartsOn: now.AddDate(0, 0, 2).Format("2006-01-02"), Timezone: "Europe/Moscow", Revision: 1, CreatedAt: now, Status: meetings.Upcoming, ScheduleVersion: 1})
	}); err != nil {
		t.Fatal(err)
	}

	cover := httpCover(t, color.RGBA{R: 200, A: 255})
	_, err = meetings.NewService(store, time.Now).Update(context.Background(), meetings.Actor{ID: principal.User.ID, Name: principal.User.DisplayName}, nativeCoverMeeting, meetings.UpdateInput{ExpectedRevision: 1, Cover: &meetings.CoverChange{Value: &meetings.CoverInput{MediaType: cover["media_type"], Data: cover["data"]}}}, "c0fe0000-0000-4000-8000-000000000101")
	if err != nil {
		t.Fatal(err)
	}

	return credential
}

type nativeCoverFaults struct {
	mu      sync.Mutex
	retry   *nativeTaskRetry
	created string
	edits   int
}

func (f *nativeCoverFaults) handler(api http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		scenario := r.Header.Get("X-Somewhere-Test-Scenario")
		create := scenario == "cover-create" && r.Method == "POST" && r.URL.Path == "/api/v1/meetings"
		edit := scenario == "cover-edit" && r.Method == "PATCH" && r.URL.Path == "/api/v1/meetings/"+nativeCoverMeeting
		if !create && !edit {
			api.ServeHTTP(w, r)
			return
		}

		data, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "fixture read failed", 500)
			return
		}

		r.Body = io.NopCloser(bytes.NewReader(data))
		reply := httptest.NewRecorder()
		api.ServeHTTP(reply, r)
		first := false
		f.mu.Lock()
		if create && reply.Code == 201 {
			if f.retry == nil {
				f.retry = &nativeTaskRetry{key: r.Header.Get("Idempotency-Key"), body: string(data), exact: true}
				first = true
			}

			f.retry.attempts++
			// Native encoders may reorder JSON object keys on process restoration.
			var previous, current any
			_ = json.Unmarshal([]byte(f.retry.body), &previous)
			_ = json.Unmarshal(data, &current)
			a, _ := json.Marshal(previous)
			b, _ := json.Marshal(current)
			f.retry.exact = f.retry.exact && f.retry.key != "" && f.retry.key == r.Header.Get("Idempotency-Key") && bytes.Equal(a, b)
			var result struct {
				Meeting struct {
					ID string `json:"id"`
				} `json:"meeting"`
			}
			_ = json.Unmarshal(reply.Body.Bytes(), &result)
			f.created = result.Meeting.ID
		}

		if edit && reply.Code == 200 {
			f.edits++
		}

		f.mu.Unlock()
		if first {
			http.Error(w, "fixture response lost after commit", 503)
			return
		}

		for name, values := range reply.Header() {
			w.Header()[name] = values
		}

		w.WriteHeader(reply.Code)
		_, _ = w.Write(reply.Body.Bytes())
	})
}

func (f *nativeCoverFaults) verify(t *testing.T, store *memory.Store) {
	t.Helper()
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.retry == nil || f.retry.attempts != 2 || !f.retry.exact || f.created == "" {
		t.Error("cover creation did not retry its saved body/key exactly once")
	}

	if f.edits != 2 {
		t.Errorf("cover replacement/removal: %d successful writes", f.edits)
	}

	if f.created == "" {
		return
	}

	if err := store.View(context.Background(), func(reader meetings.Reader) error {
		cover, err := reader.Cover(f.created)
		if err != nil {
			return err
		}

		if _, _, err := image.Decode(bytes.NewReader(cover.Data)); err != nil {
			return err
		}

		meeting, err := reader.Meeting(nativeCoverMeeting)
		if err != nil {
			return err
		}

		if meeting.CoverVersion != "" {
			t.Error("removed cover remains")
		}

		return nil
	}); err != nil {
		t.Fatal(err)
	}
}
