package httpapi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestNativePlaceCloseFixtureReadPaths(t *testing.T) {
	for _, path := range []string{"legacy", "sync", "other-meeting", "write", "other-scenario"} {
		t.Run(path, func(t *testing.T) {
			store := memory.New()
			auth, err := identity.New(identity.Config{PublicOrigin: "https://fixture.example.test", SessionTTL: time.Hour, NativeCallbacks: map[string]string{"ios": "group-planning-ios://auth/callback"}}, memory.NewIdentity(), iosFixtureProvider{}, time.Now, func(context.Context, string) (bool, error) { return false, nil })
			if err != nil {
				t.Fatal(err)
			}

			seedNativePlaceFixture(t, store, auth, "close", 200)
			poll := nativePlaceClosePoll(t, store)
			faults := &nativePlaceFaults{service: meetings.NewService(store, time.Now), store: store}
			uri := "/api/v1/meetings/d3c60000-0000-4000-8000-000000000200/sync"
			method, scenario := http.MethodGet, "place-close"
			switch path {
			case "legacy":
				uri = "/api/v1/meetings/" + poll.MeetingID + "/place-polls/" + poll.ID
			case "other-meeting":
				uri = "/api/v1/meetings/d3c60000-0000-4000-8000-000000000100/sync"
			case "write":
				method = http.MethodPost
			case "other-scenario":
				scenario = "design"
			}

			request := httptest.NewRequest(method, uri, nil)
			request.Header.Set("X-Somewhere-Test-Scenario", scenario)
			reply := httptest.NewRecorder()
			faults.handler(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				if nativePlaceClosePoll(t, store).State != meetings.PlacePollOpen {
					t.Fatal("mock job ran before the first client response")
				}

				w.WriteHeader(http.StatusOK)
			})).ServeHTTP(reply, request)
			want := meetings.PlacePollOpen
			if path == "legacy" || path == "sync" {
				want = meetings.PlacePollApplied
			}

			if reply.Code != http.StatusOK || nativePlaceClosePoll(t, store).State != want {
				t.Fatalf("mock job read path %s: response=%d, state=%s", path, reply.Code, nativePlaceClosePoll(t, store).State)
			}
		})
	}
}

func nativePlaceClosePoll(t *testing.T, store *memory.Store) meetings.PlacePoll {
	t.Helper()
	var result meetings.PlacePoll
	if err := store.View(context.Background(), func(reader meetings.Reader) error {
		polls, err := reader.PlacePolls()
		if err != nil {
			return err
		}

		for _, poll := range polls {
			if poll.MeetingID == "d3c60000-0000-4000-8000-000000000200" {
				result = poll
			}
		}

		return nil
	}); err != nil {
		t.Fatal(err)
	}

	if result.ID == "" {
		t.Fatal("missing seeded overdue place poll")
	}

	return result
}
