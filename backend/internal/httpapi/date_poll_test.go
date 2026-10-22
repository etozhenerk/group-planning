package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestDatePollOpenAPIResponses(t *testing.T) {
	h := newMeetingHTTPTest(t)
	h.clock.Store(time.Date(2026, 10, 20, 0, 0, 0, 0, time.UTC).Unix())
	ownerClient, guestClient, otherClient := h.client(true), h.client(true), h.client(true)
	owner := h.login(ownerClient, "owner", map[string]string{"kind": "home"})
	guest := h.login(guestClient, "guest", map[string]string{"kind": "home"})
	other := h.login(otherClient, "other", map[string]string{"kind": "home"})
	data, _ := h.request(ownerClient, "POST", "/api/v1/meetings", map[string]any{"title": "Настолки", "starts_on": "2026-10-24", "starts_at": nil, "timezone": "Europe/Moscow"}, headersFor(h, owner, testKey("901")), 201)
	meeting := decodeMeetingTest[createdMeetingResponse](t, data)
	if meeting.Meeting.StartsOn == nil || *meeting.Meeting.StartsOn != "2026-10-24" || meeting.Meeting.StartsAt != nil {
		t.Fatal("date-only response fabricated a time")
	}

	base := "/api/v1/meetings/" + meeting.Meeting.ID
	address, _ := url.Parse(meeting.InvitationURL)
	token := strings.TrimPrefix(address.Path, "/i/")
	invite := "/api/v1/invitations/" + token
	data, _ = h.request(h.anonymous, "GET", invite, nil, nil, 200)
	preview := decodeMeetingTest[previewResponse](t, data)
	if preview.StartsOn == nil || preview.StartsAt != nil {
		t.Fatal("public date-only preview is wrong")
	}

	h.request(ownerClient, "GET", "/api/v1/meetings?period=upcoming&from=2026-10-24&to=2026-10-25", nil, nil, 200)
	h.request(guestClient, "PUT", invite+"/rsvp", map[string]string{"answer": "going", "expected_revision": "0"}, headersFor(h, guest, testKey("902")), 200)
	polls := base + "/date-polls"
	input := map[string]any{"dates": []string{"2026-10-26", "2026-10-25"}, "closes_at": "2026-10-20T00:01:00Z", "settings": map[string]bool{"hide_results": true, "anonymous": true}}
	h.request(h.anonymous, "POST", polls, input, nil, 401)
	h.request(ownerClient, "POST", polls, input, map[string]string{"Origin": h.server.URL, "Idempotency-Key": testKey("903")}, 403)
	h.request(otherClient, "POST", polls, input, headersFor(h, other, testKey("903")), 403)
	data, _ = h.request(guestClient, "POST", polls, input, headersFor(h, guest, testKey("903")), 201)
	poll := decodeMeetingTest[datePollResponse](t, data)
	if !poll.Settings.MultipleAnswers || !poll.Settings.AllowRevoting || !poll.Settings.AllowNewOptions {
		t.Fatal("default settings lost")
	}

	path := polls + "/" + poll.ID
	h.request(ownerClient, "POST", polls, input, headersFor(h, owner, testKey("904")), 409)
	h.request(h.anonymous, "GET", path, nil, nil, 401)
	h.request(otherClient, "GET", path, nil, nil, 403)
	data, _ = h.request(ownerClient, "POST", path+"/options", map[string]string{"date": "2026-10-23", "expected_revision": poll.Revision}, headersFor(h, owner, testKey("905")), 200)
	added := decodeMeetingTest[datePollResponse](t, data)
	if added.Options[0].Date != "2026-10-23" {
		t.Fatal("added date not sorted")
	}

	h.request(ownerClient, "POST", path+"/options", map[string]string{"date": "2026-10-23", "expected_revision": added.Revision}, headersFor(h, owner, testKey("906")), 422)
	h.request(ownerClient, "POST", path+"/options", map[string]string{"date": "2026-10-27", "expected_revision": poll.Revision}, headersFor(h, owner, testKey("907")), 409)
	h.request(ownerClient, "PUT", path+"/vote", map[string]string{"expected_revision": "0"}, headersFor(h, owner, testKey("930")), 422)
	h.request(ownerClient, "PUT", path+"/vote", map[string]any{"option_ids": nil, "expected_revision": "0"}, headersFor(h, owner, testKey("931")), 422)
	vote := map[string]any{"option_ids": []string{poll.Options[0].ID, poll.Options[1].ID}, "expected_revision": "0"}
	h.request(ownerClient, "PUT", path+"/vote", vote, headersFor(h, owner, testKey("908")), 200)
	h.request(guestClient, "PUT", path+"/vote", vote, headersFor(h, guest, testKey("909")), 200)
	data, _ = h.request(ownerClient, "GET", path, nil, nil, 200)
	hidden := decodeMeetingTest[datePollResponse](t, data)
	for _, option := range hidden.Options {
		if option.Votes != nil || option.Voters != nil {
			t.Fatal("hidden ballots disclosed")
		}
	}

	if hidden.Revision != added.Revision || hidden.State != meetings.PollOpen || len(hidden.LeaderOptionIDs) != 0 {
		t.Fatal("hidden interim result leaked")
	}

	data, _ = h.request(ownerClient, "GET", base+"/feed", nil, nil, 200)
	entries := decodeMeetingTest[feedPageResponse](t, data).Entries
	unspecified := false
	for _, entry := range entries {
		if entry.Kind == "date_poll_applied" || entry.Kind == "date_poll_choice_required" {
			t.Fatal("hidden result leaked in feed")
		}

		if entry.Kind == "meeting_time_unspecified" {
			unspecified = entry.Sender == nil
		}
	}

	if !unspecified {
		t.Fatal("time reminder must remain a system event")
	}

	h.clock.Add(60)
	if err := h.app.CloseDatePoll(context.Background(), poll.ID); err != nil {
		t.Fatal(err)
	}

	data, _ = h.request(ownerClient, "GET", path, nil, nil, 200)
	closed := decodeMeetingTest[datePollResponse](t, data)
	if closed.State != meetings.PollAwaitingChoice || !closed.CanResolve || len(closed.LeaderOptionIDs) != 2 {
		t.Fatal("tie did not wait for organizer")
	}

	for _, option := range closed.Options {
		if option.Votes == nil || option.Voters != nil {
			t.Fatal("anonymous results disclosed voters")
		}
	}

	resolve := map[string]string{"option_id": poll.Options[1].ID, "expected_revision": closed.Revision}
	h.request(guestClient, "POST", path+"/resolve", resolve, headersFor(h, guest, testKey("910")), 403)
	data, _ = h.request(ownerClient, "POST", path+"/resolve", resolve, headersFor(h, owner, testKey("911")), 200)
	if decodeMeetingTest[datePollResponse](t, data).State != meetings.PollApplied {
		t.Fatal("resolution did not apply")
	}

	h.request(ownerClient, "POST", path+"/resolve", resolve, headersFor(h, owner, testKey("911")), 200)
	h.request(guestClient, "PUT", path+"/vote", vote, headersFor(h, guest, testKey("912")), 409)
	data, _ = h.request(ownerClient, "GET", base, nil, nil, 200)
	updated := decodeMeetingTest[meetingResponse](t, data)
	if updated.StartsOn == nil || *updated.StartsOn != "2026-10-26" || updated.StartsAt != nil {
		t.Fatal("poll invented time or lost date")
	}

	h.request(guestClient, "PUT", base+"/rsvp", map[string]string{"answer": "maybe", "expected_revision": "1"}, headersFor(h, guest, testKey("913")), 200)
	h.request(guestClient, "GET", path, nil, nil, 403)
	h.request(guestClient, "PUT", path+"/vote", vote, headersFor(h, guest, testKey("909")), 403)
	data, _ = h.request(ownerClient, "GET", base+"/feed", nil, nil, 200)
	if !bytes.Contains(data, []byte(`"date_poll_applied"`)) {
		t.Fatal("result missing in feed")
	}

	if output := os.Getenv("SOMEWHERE_CONTRACT_CAPTURE"); output != "" {
		captures, err := json.Marshal(h.captures)
		if err != nil {
			t.Fatal(err)
		}

		if err := os.WriteFile(output+".polls", captures, 0o600); err != nil {
			t.Fatal(err)
		}
	}
}
