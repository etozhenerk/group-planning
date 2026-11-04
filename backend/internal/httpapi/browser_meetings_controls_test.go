package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestBrowserMeetingsClockRequiresExplicitWorker(t *testing.T) {
	clock := newBrowserMeetingsClock()
	clock.stamp.Store(time.Date(2026, 11, 6, 12, 0, 0, 0, time.UTC).UnixMilli())
	app := meetings.NewService(memory.New(), clock.now)
	actor := meetings.Actor{ID: "11111111-1111-4111-8111-111111111111", Name: "Участник"}
	created, err := app.Create(t.Context(), actor, meetings.CreateInput{Title: "Полночь", StartsOn: "2026-11-06", Timezone: "Europe/Moscow"}, "22222222-2222-4222-8222-222222222222")
	if err != nil {
		t.Fatal(err)
	}

	mux := http.NewServeMux()
	clock.mount(mux, app)
	request := func(method, path, body string) *httptest.ResponseRecorder {
		t.Helper()
		response := httptest.NewRecorder()
		mux.ServeHTTP(response, httptest.NewRequest(method, path, strings.NewReader(body)))

		return response
	}
	for _, body := range []string{`{}`, `{"now":"invalid"}`, `{"now":"2026-11-07T00:00:00Z","extra":true}`} {
		if got := request("POST", "/__test/meetings-clock", body).Code; got != 400 {
			t.Fatalf("invalid clock: %d", got)
		}
	}

	if got := request("POST", "/__test/run-transition", ""); !strings.Contains(got.Body.String(), `"processed":false`) {
		t.Fatal(got.Body.String())
	}

	if got := request("POST", "/__test/meetings-clock", `{"now":"2026-11-06T21:00:00Z"}`).Code; got != 200 {
		t.Fatal(got)
	}

	before, err := app.Details(t.Context(), actor, created.Details.Meeting.ID)
	if err != nil || before.Meeting.Status != meetings.Upcoming {
		t.Fatal("clock alone changed persisted period", err)
	}

	if got := request("POST", "/__test/run-transition", ""); got.Code != 200 || !strings.Contains(got.Body.String(), `"processed":true`) {
		t.Fatal(got.Body.String())
	}

	after, err := app.Details(t.Context(), actor, created.Details.Meeting.ID)
	if err != nil || after.Meeting.Status != meetings.Past {
		t.Fatal("real worker did not change persisted period", err)
	}

	if got := request("POST", "/__test/run-transition", ""); !strings.Contains(got.Body.String(), `"processed":false`) {
		t.Fatal("job executed twice")
	}

	var state struct {
		Now       time.Time `json:"now"`
		Automatic bool      `json:"automatic_transitions"`
	}
	if err := json.Unmarshal(request("GET", "/__test/meetings-clock", "").Body.Bytes(), &state); err != nil || state.Automatic || !state.Now.Equal(clock.now()) {
		t.Fatal("untruthful fixture clock state", err)
	}
}

func TestBrowserLegacyMeetingIsActuallyUndated(t *testing.T) {
	store, identities := memory.New(), memory.NewIdentity()
	auth, err := identity.New(identity.Config{PublicOrigin: "https://fixture.test", SessionTTL: time.Hour, NativeCallbacks: map[string]string{"ios": "group-planning-ios://auth/callback"}}, identities, iosFixtureProvider{}, time.Now, func(_ context.Context, _ string) (bool, error) { return false, nil })
	if err != nil {
		t.Fatal(err)
	}

	app := meetings.NewService(store, time.Now, meetings.WithMediaContent(memory.NewMediaContent()))
	owner := seedNativeDesignFixture(t, store, identities, auth, app)
	seedBrowserLegacyMeeting(t, store, auth, owner)
	principal, err := auth.Authenticate(t.Context(), owner.Token, false)
	if err != nil {
		t.Fatal(err)
	}

	details, err := app.Details(t.Context(), meetings.Actor{ID: principal.User.ID, Name: principal.User.DisplayName}, "c4444444-4444-4444-8444-444444444444")
	if err != nil || details.Meeting.StartsAt != nil || details.Meeting.StartsOn != "" || details.Meeting.Status != meetings.Undated {
		t.Fatal("not a real legacy undated meeting", err)
	}
}

func TestBrowserMeetingsControlsAreAbsentFromApplication(t *testing.T) {
	h := newMeetingHTTPTest(t)
	for _, path := range []string{"/__test/meetings-clock", "/__test/run-transition"} {
		response, err := h.anonymous.Get(h.server.URL + path)
		if err != nil {
			t.Fatal(err)
		}

		response.Body.Close()
		if response.StatusCode != http.StatusNotFound {
			t.Fatalf("test controls exposed by application: %s status=%d", path, response.StatusCode)
		}
	}

	profile, err := (browserProvider{}).Verify(t.Context(), "long-organizer", "fixture-verifier")
	if err != nil || profile.DisplayName != "Александра Константинопольская" {
		t.Fatal("long organizer does not match the approved fixture", err)
	}
}
