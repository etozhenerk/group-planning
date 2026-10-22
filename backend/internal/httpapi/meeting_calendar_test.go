package httpapi

import (
	"encoding/json"
	"net/url"
	"os"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestCalendarOpenAPIResponses(t *testing.T) {
	h := newMeetingHTTPTest(t)
	h.clock.Store(time.Date(2026, 10, 20, 0, 0, 0, 0, time.UTC).Unix())
	client := h.client(true)
	owner := h.login(client, "owner", map[string]string{"kind": "home"})
	h.request(h.anonymous, "GET", "/api/v1/meetings?period=upcoming", nil, nil, 401)
	h.request(client, "GET", "/api/v1/meetings?period=upcoming", nil, nil, 200)
	for _, query := range []string{"period=", "period=unknown", "from=2026-10-24&to=2026-10-25", "period=upcoming&from=2026-10-24", "period=upcoming&to=2026-10-25", "period=undated&from=2026-10-24&to=2026-10-25", "period=upcoming&from=&to=", "period=upcoming&from=2026-02-30&to=2026-03-02", "period=upcoming&from=2026-10-01&to=2026-11-13", "period=past&period=past", "period=past&limit=101", "period=past&cursor="} {
		h.request(client, "GET", "/api/v1/meetings?"+query, nil, nil, 400)
	}

	input := map[string]any{"title": "Настолки", "starts_at": "2026-10-24T19:00:00+03:00", "timezone": "Europe/Moscow"}
	for _, n := range []string{"700", "701"} {
		h.request(client, "POST", "/api/v1/meetings", input, headersFor(h, owner, testKey(n)), 201)
	}

	data, _ := h.request(client, "GET", "/api/v1/meetings?period=upcoming&from=2026-10-24&to=2026-10-25&limit=1", nil, nil, 200)
	first := decodeMeetingTest[calendarPageResponse](t, data)
	if first.NextCursor == nil || len(first.Meetings) != 1 || len(first.Days) != 1 || first.Days[0].Count != 2 || first.Counts.Upcoming != 2 || first.RefreshAfterSeconds != 5 {
		t.Fatalf("invalid calendar: %+v", first)
	}

	next := "/api/v1/meetings?period=upcoming&from=2026-10-24&to=2026-10-25&limit=1&cursor=" + url.QueryEscape(*first.NextCursor)
	h.request(client, "GET", next, nil, nil, 200)
	h.request(client, "GET", "/api/v1/meetings?period=past&cursor="+url.QueryEscape(*first.NextCursor), nil, nil, 422)
	h.request(client, "GET", "/api/v1/meetings?period=upcoming&cursor=c2.invalid", nil, nil, 422)
	h.request(client, "GET", "/api/v1/meetings?cursor="+url.QueryEscape(*first.NextCursor), nil, nil, 422)
	h.request(client, "GET", "/api/v1/meetings?period=undated", nil, nil, 200)
	h.request(client, "GET", "/api/v1/meetings?period=past", nil, nil, 200)
	legacy, _ := h.request(client, "GET", "/api/v1/meetings?limit=1", nil, nil, 200)
	old := decodeMeetingTest[meetingsPageResponse](t, legacy)
	var legacyFields map[string]json.RawMessage
	if json.Unmarshal(legacy, &legacyFields) != nil || len(legacyFields) != 2 {
		t.Fatal("legacy shape changed")
	}

	h.clock.Store(first.NextTransitionAt.Unix())
	job, err := h.app.ClaimTransition(t.Context(), meetings.DefaultTransitionOptions())
	if err != nil {
		t.Fatal(err)
	}

	if err := h.app.CompleteTransition(t.Context(), job); err != nil {
		t.Fatal(err)
	}

	h.login(client, "owner", map[string]string{"kind": "home"})
	h.request(client, "GET", next, nil, nil, 409)
	h.request(client, "GET", "/api/v1/meetings?period=past", nil, nil, 200)
	h.request(client, "GET", "/api/v1/meetings?limit=1&cursor="+url.QueryEscape(*old.NextCursor), nil, nil, 200)
	if output := os.Getenv("SOMEWHERE_CONTRACT_CAPTURE"); output != "" {
		data, err := json.Marshal(h.captures)
		if err != nil {
			t.Fatal(err)
		}

		if err := os.WriteFile(output+".calendar", data, 0o600); err != nil {
			t.Fatal(err)
		}
	}
}
