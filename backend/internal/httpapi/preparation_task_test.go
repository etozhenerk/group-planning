package httpapi

import (
	"encoding/json"
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestPreparationTaskOpenAPIResponses(t *testing.T) {
	h := newMeetingHTTPTest(t)
	ownerClient, guestClient, otherClient := h.client(true), h.client(true), h.client(true)
	owner := h.login(ownerClient, "owner", map[string]string{"kind": "home"})
	guest := h.login(guestClient, "guest", map[string]string{"kind": "home"})
	other := h.login(otherClient, "other", map[string]string{"kind": "home"})
	data, _ := h.request(ownerClient, "POST", "/api/v1/meetings", map[string]any{"title": "Настолки", "starts_on": "2026-10-26", "timezone": "Europe/Moscow"}, headersFor(h, owner, testKey("2001")), 201)
	meeting := decodeMeetingTest[createdMeetingResponse](t, data)
	invitationURL, err := url.Parse(meeting.InvitationURL)
	if err != nil {
		t.Fatal(err)
	}

	invitation := "/api/v1/invitations/" + strings.TrimPrefix(invitationURL.Path, "/i/")
	base := "/api/v1/meetings/" + meeting.Meeting.ID
	tasks := base + "/preparation-tasks"
	input := map[string]any{"title": "Заказать пиццу", "recipient_id": guest.User.ID}
	h.request(h.anonymous, "POST", tasks, input, nil, 401)
	h.request(ownerClient, "POST", tasks, input, map[string]string{"Origin": h.server.URL, "Idempotency-Key": testKey("2002")}, 403)
	h.request(otherClient, "POST", tasks, input, headersFor(h, other, testKey("2002")), 403)
	h.request(ownerClient, "POST", tasks, input, headersFor(h, owner, testKey("2003")), 422)
	h.request(guestClient, "PUT", invitation+"/rsvp", map[string]string{"answer": "going", "expected_revision": "0"}, headersFor(h, guest, testKey("2004")), 200)
	for i, invalid := range []map[string]any{{"title": " ", "recipient_id": nil}, {"title": "Задача"}, {"title": "Задача", "recipient_id": ""}, {"title": "Задача", "recipient_id": 123}} {
		h.request(ownerClient, "POST", tasks, invalid, headersFor(h, owner, testKey(string(rune('5'+i))+"000")), 422)
	}

	data, _ = h.request(ownerClient, "POST", tasks, input, headersFor(h, owner, testKey("2010")), 201)
	offered := decodeMeetingTest[preparationTaskResponse](t, data)
	if offered.State != meetings.TaskOffered || offered.Assignee != nil || offered.Recipient == nil || offered.Recipient.ID != guest.User.ID || offered.CanAccept || !offered.CanCancel {
		t.Fatal("wrong proposal")
	}

	path := tasks + "/" + offered.ID
	data, _ = h.request(ownerClient, "POST", tasks, input, headersFor(h, owner, testKey("2010")), 201)
	if decodeMeetingTest[preparationTaskResponse](t, data).ID != offered.ID {
		t.Fatal("duplicate proposal")
	}

	h.request(ownerClient, "POST", tasks, map[string]any{"title": "Другая задача", "recipient_id": nil}, headersFor(h, owner, testKey("2010")), 409)
	h.request(h.anonymous, "GET", path, nil, nil, 401)
	h.request(otherClient, "GET", path, nil, nil, 403)
	h.request(ownerClient, "GET", path+"?extra=1", nil, nil, 400)
	h.request(ownerClient, "PATCH", path, nil, headersFor(h, owner, testKey("2011")), 405)
	h.request(ownerClient, "POST", path+"/accept", map[string]string{"expected_revision": "1"}, headersFor(h, owner, testKey("2012")), 403)
	h.request(guestClient, "POST", path+"/accept", map[string]string{"expected_revision": "bad"}, headersFor(h, guest, testKey("2013")), 422)
	data, _ = h.request(guestClient, "GET", path, nil, nil, 200)
	if !decodeMeetingTest[preparationTaskResponse](t, data).CanAccept {
		t.Fatal("recipient cannot consent")
	}

	data, _ = h.request(guestClient, "POST", path+"/accept", map[string]string{"expected_revision": "1"}, headersFor(h, guest, testKey("2014")), 200)
	accepted := decodeMeetingTest[preparationTaskResponse](t, data)
	if accepted.Assignee == nil || accepted.Assignee.ID != guest.User.ID || !accepted.CanComplete {
		t.Fatal("acceptance missing")
	}

	h.request(guestClient, "POST", path+"/complete", map[string]string{"expected_revision": "1"}, headersFor(h, guest, testKey("2015")), 409)
	h.request(ownerClient, "POST", path+"/complete", map[string]string{"expected_revision": "2"}, headersFor(h, owner, testKey("2016")), 403)
	data, _ = h.request(guestClient, "POST", path+"/complete", map[string]string{"expected_revision": "2"}, headersFor(h, guest, testKey("2017")), 200)
	if decodeMeetingTest[preparationTaskResponse](t, data).State != meetings.TaskCompleted {
		t.Fatal("completion missing")
	}

	data, _ = h.request(guestClient, "POST", path+"/accept", map[string]string{"expected_revision": "1"}, headersFor(h, guest, testKey("2014")), 200)
	if decodeMeetingTest[preparationTaskResponse](t, data).State != meetings.TaskCompleted {
		t.Fatal("late repeat rolled back task")
	}

	h.request(ownerClient, "POST", path+"/cancel", map[string]string{"expected_revision": "3"}, headersFor(h, owner, testKey("2018")), 409)
	data, _ = h.request(ownerClient, "POST", tasks, input, headersFor(h, owner, testKey("2020")), 201)
	declined := decodeMeetingTest[preparationTaskResponse](t, data)
	h.request(guestClient, "POST", tasks+"/"+declined.ID+"/decline", map[string]string{"expected_revision": "1"}, headersFor(h, guest, testKey("2021")), 200)
	data, _ = h.request(guestClient, "POST", tasks, map[string]any{"title": "Взять настолки", "recipient_id": nil}, headersFor(h, guest, testKey("2022")), 201)
	general := decodeMeetingTest[preparationTaskResponse](t, data)
	h.request(ownerClient, "POST", tasks+"/"+general.ID+"/accept", map[string]string{"expected_revision": "1"}, headersFor(h, owner, testKey("2023")), 200)
	h.request(guestClient, "POST", tasks+"/"+general.ID+"/cancel", map[string]string{"expected_revision": "2"}, headersFor(h, guest, testKey("2024")), 200)
	h.request(guestClient, "PUT", base+"/rsvp", map[string]string{"answer": "maybe", "expected_revision": "1"}, headersFor(h, guest, testKey("2025")), 200)
	h.request(guestClient, "GET", path, nil, nil, 403)
	h.request(guestClient, "POST", path+"/accept", map[string]string{"expected_revision": "1"}, headersFor(h, guest, testKey("2014")), 403)
	h.request(ownerClient, "GET", base+"/feed", nil, nil, 200)
	if output := os.Getenv("SOMEWHERE_CONTRACT_CAPTURE"); output != "" {
		data, err := json.Marshal(h.captures)
		if err != nil {
			t.Fatal(err)
		}

		if err := os.WriteFile(output+".preparation-tasks", data, 0o600); err != nil {
			t.Fatal(err)
		}
	}
}
