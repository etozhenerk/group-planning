package httpapi

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"
)

func TestSavedInvitationsOpenAPIResponses(t *testing.T) {
	h := newMeetingHTTPTest(t)
	h.clock.Store(time.Date(2026, 10, 20, 0, 0, 0, 0, time.UTC).Unix())
	ownerClient, guestClient, otherClient := h.client(true), h.client(true), h.client(true)
	owner := h.login(ownerClient, "owner", map[string]string{"kind": "home"})
	guest := h.login(guestClient, "guest", map[string]string{"kind": "home"})
	h.login(otherClient, "other", map[string]string{"kind": "home"})
	h.request(h.anonymous, "GET", "/api/v1/invitations", nil, nil, http.StatusUnauthorized)
	var created []createdMeetingResponse
	for i := 1; i <= 4; i++ {
		data, _ := h.request(ownerClient, "POST", "/api/v1/meetings", map[string]string{
			"title": fmt.Sprintf("Приглашение %d", i), "starts_on": "2026-10-26",
			"timezone": "Europe/Moscow", "description": "Публичное описание",
		}, headersFor(h, owner, testKey(fmt.Sprint(i))), http.StatusCreated)
		meeting := decodeMeetingTest[createdMeetingResponse](t, data)
		created = append(created, meeting)
		if i == 4 {
			continue
		}

		link, err := url.Parse(meeting.InvitationURL)
		if err != nil {
			t.Fatal(err)
		}

		answer := "maybe"
		if i == 3 {
			answer = "not_going"
		}

		h.request(guestClient, "PUT", "/api/v1/invitations/"+strings.TrimPrefix(link.Path, "/i/")+"/rsvp", map[string]string{
			"answer": answer, "expected_revision": "0",
		}, headersFor(h, guest, testKey(fmt.Sprint(i+10))), http.StatusOK)
	}

	for _, client := range []*http.Client{ownerClient, otherClient} {
		data, _ := h.request(client, "GET", "/api/v1/invitations", nil, nil, http.StatusOK)
		if page := decodeMeetingTest[invitationsPageResponse](t, data); len(page.Invitations) != 0 || page.NextCursor != nil {
			t.Fatal("another account's responses leaked")
		}
	}

	data, _ := h.request(guestClient, "GET", "/api/v1/invitations?limit=1", nil, nil, http.StatusOK)
	first := decodeMeetingTest[invitationsPageResponse](t, data)
	if len(first.Invitations) != 1 || first.NextCursor == nil {
		t.Fatal("missing first page")
	}

	data, _ = h.request(guestClient, "GET", "/api/v1/invitations?limit=1&cursor="+*first.NextCursor, nil, nil, http.StatusOK)
	second := decodeMeetingTest[invitationsPageResponse](t, data)
	if len(second.Invitations) != 1 || second.NextCursor != nil || first.Invitations[0].Preview.MeetingID >= second.Invitations[0].Preview.MeetingID {
		t.Fatal("unstable pagination")
	}

	for _, item := range append(first.Invitations, second.Invitations...) {
		if item.Preview.MyRSVP == nil || *item.Preview.MyRSVP != "maybe" || item.Preview.MyRSVPRevision != "1" || item.Preview.StartsAt != nil {
			t.Fatal("invalid saved invitation snapshot")
		}

		base := "/api/v1/meetings/" + item.Preview.MeetingID
		h.request(guestClient, "GET", base+"/feed", nil, nil, http.StatusForbidden)
		h.request(guestClient, "GET", base+"/participants", nil, nil, http.StatusForbidden)
		h.request(guestClient, "GET", base+"/date-polls/"+testKey("99"), nil, nil, http.StatusForbidden)
	}

	base := "/api/v1/meetings/" + created[0].Meeting.ID
	for i, answer := range []string{"going", "maybe", "not_going"} {
		h.request(guestClient, "PUT", base+"/rsvp", map[string]string{
			"answer": answer, "expected_revision": fmt.Sprint(i + 1),
		}, headersFor(h, guest, testKey(fmt.Sprint(i+20))), http.StatusOK)
		data, _ = h.request(guestClient, "GET", "/api/v1/invitations", nil, nil, http.StatusOK)
		want := 1
		if answer == "maybe" {
			want = 2
		}

		if len(decodeMeetingTest[invitationsPageResponse](t, data).Invitations) != want {
			t.Fatal("RSVP did not move invitation")
		}
	}

	for query, status := range map[string]int{"limit=0": 400, "limit=101": 400, "cursor=invalid": 422, "user_id=other": 400} {
		h.request(guestClient, "GET", "/api/v1/invitations?"+query, nil, nil, status)
	}

	if output := os.Getenv("SOMEWHERE_CONTRACT_CAPTURE"); output != "" {
		data, err := json.Marshal(h.captures)
		if err != nil {
			t.Fatal(err)
		}

		if err := os.WriteFile(output+".invitations", data, 0o600); err != nil {
			t.Fatal(err)
		}
	}
}
