package httpapi

import (
	"context"
	"encoding/json"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestPlacePollOpenAPIResponses(t *testing.T) {
	h := newMeetingHTTPTest(t)
	h.clock.Store(time.Date(2026, 10, 20, 0, 0, 0, 0, time.UTC).Unix())
	ownerClient, guestClient, otherClient := h.client(true), h.client(true), h.client(true)
	owner := h.login(ownerClient, "owner", map[string]string{"kind": "home"})
	guest := h.login(guestClient, "guest", map[string]string{"kind": "home"})
	other := h.login(otherClient, "other", map[string]string{"kind": "home"})
	data, _ := h.request(ownerClient, "POST", "/api/v1/meetings", map[string]any{"title": "Настолки", "starts_on": "2026-10-24", "timezone": "Europe/Moscow", "place": "Кафе"}, headersFor(h, owner, testKey("1001")), 201)
	meeting := decodeMeetingTest[createdMeetingResponse](t, data)
	invitationURL, err := url.Parse(meeting.InvitationURL)
	if err != nil {
		t.Fatal(err)
	}

	invitation := "/api/v1/invitations/" + strings.TrimPrefix(invitationURL.Path, "/i/")
	base := "/api/v1/meetings/" + meeting.Meeting.ID
	polls := base + "/place-polls"
	input := map[string]string{"place": "У Саши дома", "closes_at": "2026-10-20T00:01:00Z"}
	h.request(h.anonymous, "POST", polls, input, nil, 401)
	h.request(ownerClient, "POST", polls, input, map[string]string{"Origin": h.server.URL, "Idempotency-Key": testKey("1002")}, 403)
	h.request(otherClient, "POST", polls, input, headersFor(h, other, testKey("1002")), 403)
	h.request(ownerClient, "POST", polls, map[string]string{"place": " ", "closes_at": input["closes_at"]}, headersFor(h, owner, testKey("1003")), 422)
	h.request(ownerClient, "POST", polls, map[string]string{"place": "Новое", "closes_at": "2026-10-19T01:00:00Z"}, headersFor(h, owner, testKey("1004")), 422)
	h.request(ownerClient, "POST", polls, map[string]string{"place": "Кафе", "closes_at": input["closes_at"]}, headersFor(h, owner, testKey("1005")), 422)
	h.request(guestClient, "PUT", invitation+"/rsvp", map[string]string{"answer": "going", "expected_revision": "0"}, headersFor(h, guest, testKey("1006")), 200)
	data, _ = h.request(guestClient, "POST", polls, input, headersFor(h, guest, testKey("1007")), 201)
	poll := decodeMeetingTest[placePollResponse](t, data)
	if poll.State != meetings.PlacePollOpen || poll.MyVote != nil || poll.VotesFor != 0 || !poll.CanVote || poll.PreviousPlace == nil || *poll.PreviousPlace != "Кафе" {
		t.Fatal("wrong initial poll projection")
	}

	data, _ = h.request(guestClient, "POST", polls, input, headersFor(h, guest, testKey("1007")), 201)
	if decodeMeetingTest[placePollResponse](t, data).ID != poll.ID {
		t.Fatal("create retry duplicated poll")
	}

	h.request(ownerClient, "POST", polls, input, headersFor(h, owner, testKey("1008")), 409)
	path := polls + "/" + poll.ID
	h.request(h.anonymous, "GET", path, nil, nil, 401)
	h.request(otherClient, "GET", path, nil, nil, 403)
	h.request(ownerClient, "GET", path+"?extra=1", nil, nil, 400)
	h.request(ownerClient, "PATCH", path, nil, headersFor(h, owner, testKey("1009")), 405)
	h.request(ownerClient, "PUT", path+"/vote", map[string]string{"answer": "unknown", "expected_revision": "0"}, headersFor(h, owner, testKey("1010")), 422)
	h.request(ownerClient, "PUT", path+"/vote", map[string]string{"answer": "for"}, headersFor(h, owner, testKey("1011")), 422)
	first := map[string]string{"answer": "for", "expected_revision": "0"}
	h.request(ownerClient, "PUT", path+"/vote", first, headersFor(h, owner, testKey("1012")), 200)
	h.request(guestClient, "PUT", path+"/vote", map[string]string{"answer": "against", "expected_revision": "0"}, headersFor(h, guest, testKey("1013")), 200)
	h.request(ownerClient, "PUT", path+"/vote", map[string]string{"answer": "against", "expected_revision": "0"}, headersFor(h, owner, testKey("1014")), 409)
	h.request(ownerClient, "PUT", path+"/vote", map[string]string{"answer": "against", "expected_revision": "1"}, headersFor(h, owner, testKey("1015")), 200)
	data, _ = h.request(ownerClient, "PUT", path+"/vote", first, headersFor(h, owner, testKey("1012")), 200)
	retried := decodeMeetingTest[placePollResponse](t, data)
	if retried.MyVote == nil || *retried.MyVote != "against" || retried.MyVoteRevision != "2" || retried.VotesAgainst != 2 {
		t.Fatal("old request rolled back newer ballot")
	}

	h.request(ownerClient, "PUT", path+"/vote", map[string]string{"answer": "for", "expected_revision": "2"}, headersFor(h, owner, testKey("1016")), 200)
	h.request(guestClient, "PUT", base+"/rsvp", map[string]string{"answer": "maybe", "expected_revision": "1"}, headersFor(h, guest, testKey("1017")), 200)
	h.request(guestClient, "GET", path, nil, nil, 403)
	data, _ = h.request(ownerClient, "GET", base, nil, nil, 200)
	if place := decodeMeetingTest[meetingResponse](t, data).Place; place == nil || *place != "Кафе" {
		t.Fatal("early transfer")
	}

	h.clock.Add(60)
	if err := h.app.ClosePlacePoll(context.Background(), poll.ID); err != nil {
		t.Fatal(err)
	}

	data, _ = h.request(ownerClient, "GET", path, nil, nil, 200)
	final := decodeMeetingTest[placePollResponse](t, data)
	if final.State != meetings.PlacePollApplied || final.CanVote || final.VotesFor != 1 || final.VotesAgainst != 0 {
		t.Fatal("wrong result after departure")
	}

	h.request(ownerClient, "PUT", path+"/vote", map[string]string{"answer": "against", "expected_revision": "3"}, headersFor(h, owner, testKey("1018")), 409)
	data, _ = h.request(ownerClient, "GET", base, nil, nil, 200)
	updated := decodeMeetingTest[meetingResponse](t, data)
	if updated.Place == nil || *updated.Place != input["place"] {
		t.Fatal("result did not update meeting")
	}

	nextInput := map[string]string{"place": "Парк", "closes_at": "2026-10-20T02:00:00Z"}
	data, _ = h.request(ownerClient, "POST", polls, nextInput, headersFor(h, owner, testKey("1019")), 201)
	next := decodeMeetingTest[placePollResponse](t, data)
	h.request(ownerClient, "PATCH", base, map[string]string{"place": "У Лены", "expected_revision": updated.Revision}, headersFor(h, owner, testKey("1020")), 200)
	data, _ = h.request(ownerClient, "GET", polls+"/"+next.ID, nil, nil, 200)
	if decodeMeetingTest[placePollResponse](t, data).State != meetings.PlacePollCancelled {
		t.Fatal("manual change did not cancel")
	}

	h.request(ownerClient, "GET", base+"/feed", nil, nil, 200)
	if output := os.Getenv("SOMEWHERE_CONTRACT_CAPTURE"); output != "" {
		data, err := json.Marshal(h.captures)
		if err != nil {
			t.Fatal(err)
		}

		if err := os.WriteFile(output+".place-polls", data, 0o600); err != nil {
			t.Fatal(err)
		}
	}
}
