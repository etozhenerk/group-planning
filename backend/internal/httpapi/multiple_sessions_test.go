package httpapi

import (
	"net/http"
	"net/url"
	"strings"
	"testing"
	"time"
)

func TestTwoSessionsShareRSVPAndCannotRestoreRevokedAccess(t *testing.T) {
	h := newMeetingHTTPTest(t)
	ownerClient := h.client(true)
	owner := h.login(ownerClient, "owner", map[string]string{"kind": "home"})
	data, _ := h.request(ownerClient, "POST", "/api/v1/meetings", map[string]string{
		"title": "Два устройства", "starts_at": "2026-10-26T19:00:00+03:00", "timezone": "Europe/Moscow",
	}, headersFor(h, owner, testKey("1")), http.StatusCreated)
	created := decodeMeetingTest[createdMeetingResponse](t, data)
	base := "/api/v1/meetings/" + created.Meeting.ID
	address, err := url.Parse(created.InvitationURL)
	if err != nil {
		t.Fatal(err)
	}

	token := strings.TrimPrefix(address.Path, "/i/")
	invite := "/api/v1/invitations/" + token
	firstClient, secondClient := h.client(true), h.client(true)
	entry := map[string]string{"kind": "invitation", "token": token}
	first := h.login(firstClient, "guest", entry)
	second := h.login(secondClient, "guest", entry)
	if first.User.ID != second.User.ID || *first.CSRFToken == *second.CSRFToken {
		t.Fatal("independent sessions must belong to one profile")
	}

	going := map[string]string{"answer": "going", "expected_revision": "0"}
	h.request(firstClient, "PUT", invite+"/rsvp", going, headersFor(h, first, testKey("2")), http.StatusOK)
	h.request(secondClient, "GET", base+"/feed", nil, nil, http.StatusOK)
	message := map[string]string{"text": "Ответ ещё не получен", "client_request_id": testKey("3")}
	data, _ = h.request(firstClient, "POST", base+"/messages", message, headersFor(h, first, testKey("3")), http.StatusCreated)
	sent := decodeMeetingTest[feedEntryResponse](t, data)
	h.request(secondClient, "PUT", base+"/rsvp", map[string]string{
		"answer": "maybe", "expected_revision": "1",
	}, headersFor(h, second, testKey("4")), http.StatusOK)
	data, _ = h.request(firstClient, "PUT", invite+"/rsvp", going, headersFor(h, first, testKey("2")), http.StatusOK)
	snapshot := decodeMeetingTest[rsvpResponse](t, data)
	if snapshot.CanAccessFeed || snapshot.RSVP == nil || *snapshot.RSVP != "maybe" {
		t.Fatal("stale reply restored access")
	}

	h.request(firstClient, "POST", base+"/messages", message, headersFor(h, first, testKey("3")), http.StatusForbidden)
	for _, client := range []*http.Client{firstClient, secondClient} {
		h.request(client, "GET", base+"/feed", nil, nil, http.StatusForbidden)
		h.request(client, "GET", base+"/participants", nil, nil, http.StatusForbidden)
	}

	data, _ = h.request(ownerClient, "GET", base+"/feed", nil, nil, http.StatusOK)
	feed := decodeMeetingTest[feedPageResponse](t, data)
	count := 0
	for _, entry := range feed.Entries {
		if entry.ID == sent.ID {
			count++
		}
	}

	if count != 1 {
		t.Fatal("message must remain exactly once in the organizer's history")
	}

	h.clock.Add(int64(2 * time.Hour / time.Second))
	for _, client := range []*http.Client{firstClient, secondClient} {
		h.request(client, "GET", "/api/v1/me", nil, nil, http.StatusUnauthorized)
		data, _ = h.request(client, "GET", invite, nil, nil, http.StatusOK)
		if decodeMeetingTest[previewResponse](t, data).MyRSVP != nil {
			t.Fatal("expired session disclosed private response")
		}
	}
}

func TestNewMockServerLosesMeetingsAndSessions(t *testing.T) {
	previous := newMeetingHTTPTest(t)
	client := previous.client(true)
	owner := previous.login(client, "owner", map[string]string{"kind": "home"})
	data, _ := previous.request(client, "POST", "/api/v1/meetings", map[string]string{
		"title": "Временная встреча", "starts_at": "2026-10-26T19:00:00+03:00", "timezone": "Europe/Moscow",
	}, headersFor(previous, owner, testKey("1")), http.StatusCreated)
	created := decodeMeetingTest[createdMeetingResponse](t, data)
	address, err := url.Parse(created.InvitationURL)
	if err != nil {
		t.Fatal(err)
	}

	previous.server.Close()
	next := newMeetingHTTPTest(t)
	next.request(client, "GET", "/api/v1/me", nil, nil, http.StatusUnauthorized)
	next.request(client, "GET", "/api/v1/invitations/"+strings.TrimPrefix(address.Path, "/i/"), nil, nil, http.StatusNotFound)
	next.login(client, "owner", map[string]string{"kind": "home"})
	data, _ = next.request(client, "GET", "/api/v1/meetings", nil, nil, http.StatusOK)
	if len(decodeMeetingTest[meetingsPageResponse](t, data).Meetings) != 0 {
		t.Fatal("new memory server unexpectedly retained meetings")
	}
}
