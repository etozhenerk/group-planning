package httpapi

import (
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestChatReadHTTP(t *testing.T) { chatReadHTTPChecks(t) }
func chatReadHTTPChecks(t *testing.T) []capturedResponse {
	h := newMeetingHTTPTest(t, meetings.WithChatSyncKey([]byte(strings.Repeat("r", 32))), meetings.WithChatReadState(true))
	client, guestClient := h.client(true), h.client(true)
	owner := h.login(client, "owner", map[string]string{"kind": "home"})
	guest := h.login(guestClient, "guest", map[string]string{"kind": "home"})
	raw, _ := h.request(client, "POST", "/api/v1/meetings", map[string]string{"title": "Read state", "starts_on": time.Unix(h.clock.Load(), 0).Add(24 * time.Hour).Format(time.DateOnly), "timezone": "UTC"}, headersFor(h, owner, testKey("2300")), 201)
	created := decodeMeetingTest[createdMeetingResponse](t, raw)
	base := "/api/v1/meetings/" + created.Meeting.ID
	invite, _ := url.Parse(created.InvitationURL)
	h.request(guestClient, "PUT", "/api/v1/invitations/"+strings.TrimPrefix(invite.Path, "/i/")+"/rsvp", map[string]string{"answer": "going", "expected_revision": "0"}, headersFor(h, guest, testKey("2301")), 200)
	raw, _ = h.request(client, "GET", "/api/v1/chat-capabilities", nil, nil, 200)
	flags := decodeMeetingTest[chatCapabilitiesResponse](t, raw)
	if !flags.ReadState || !flags.Realtime || !flags.Sync {
		t.Fatal("read flag missing")
	}

	raw, _ = h.request(guestClient, "GET", base+"/sync", nil, nil, 200)
	initial := decodeMeetingTest[chatSnapshotResponse](t, raw)
	if initial.MyReadState == nil || *initial.MyReadState != "0" || initial.UnreadCount == nil || *initial.UnreadCount != "0" {
		t.Fatal("baseline is not actual", string(raw))
	}

	raw, _ = h.request(client, "POST", base+"/messages", map[string]string{"text": "visible to guest", "client_request_id": testKey("2302")}, headersFor(h, owner, testKey("2302")), 201)
	message := decodeMeetingTest[feedEntryResponse](t, raw)
	raw, _ = h.request(guestClient, "GET", base+"/sync?cursor="+url.QueryEscape(initial.ChangeCursor), nil, nil, 200)
	changes := decodeMeetingTest[chatChangesResponse](t, raw)
	if changes.UnreadCount == nil || *changes.UnreadCount != "1" || changes.FirstUnread == nil || *changes.FirstUnread == nil || **changes.FirstUnread != message.ID {
		t.Fatal("unread changes", string(raw))
	}

	input := map[string]string{"read_through_sequence": message.Sequence}
	h.request(guestClient, "PUT", base+"/read-marker", input, nil, 403)
	raw, _ = h.request(guestClient, "PUT", base+"/read-marker", input, headersFor(h, guest, ""), 200)
	state := decodeMeetingTest[readStateResponse](t, raw)
	if state.ReadThrough != message.Sequence || state.UnreadCount != "0" || state.FirstUnread != nil {
		t.Fatal("read max", state)
	}

	raw, _ = h.request(guestClient, "GET", base+"/sync?cursor="+url.QueryEscape(changes.NextCursor), nil, nil, 200)
	if !strings.Contains(string(raw), `"first_unread":null`) || !strings.Contains(string(raw), `"unread_count":"0"`) {
		t.Fatal("read changes did not explicitly clear the previous anchor", string(raw))
	}

	h.request(guestClient, "PUT", base+"/read-marker", map[string]string{"read_through_sequence": "18446744073709551616"}, headersFor(h, guest, ""), 422)
	h.request(guestClient, "PUT", base+"/read-marker", map[string]any{"read_through_sequence": 1}, headersFor(h, guest, ""), 400)
	query := map[string]any{"entry_ids": []string{message.ID}}
	h.request(guestClient, "POST", base+"/read-receipts/query", query, headersFor(h, guest, ""), 403)
	h.request(client, "POST", base+"/read-receipts/query", query, nil, 403)
	raw, _ = h.request(client, "POST", base+"/read-receipts/query", query, headersFor(h, owner, ""), 200)
	counts := decodeMeetingTest[readReceiptsResponse](t, raw)
	if len(counts.Receipts) != 1 || counts.Receipts[0].ReaderCount != "1" {
		t.Fatal("receipt count", counts)
	}

	upperQuery := map[string]any{"entry_ids": []string{strings.ToUpper(message.ID)}}
	raw, _ = h.request(client, "POST", base+"/read-receipts/query", upperQuery, headersFor(h, owner, ""), 200)
	canonical := decodeMeetingTest[readReceiptsResponse](t, raw)
	if len(canonical.Receipts) != 1 || canonical.Receipts[0].EntryID != message.ID || canonical.Receipts[0].ReaderCount != "1" {
		t.Fatal("UUID case changed message identity", canonical)
	}

	duplicateQuery := map[string]any{"entry_ids": []string{message.ID, strings.ToUpper(message.ID)}}
	h.request(client, "POST", base+"/read-receipts/query", duplicateQuery, headersFor(h, owner, ""), 422)

	raw, _ = h.request(client, "GET", base+"/messages/"+message.ID+"/readers?limit=1", nil, nil, 200)
	readers := decodeMeetingTest[messageReadersResponse](t, raw)
	if readers.ReaderCount != "1" || len(readers.Readers) != 1 || readers.Readers[0].ID != guest.User.ID {
		t.Fatal("reader projection", readers)
	}

	for _, secret := range []string{"read_through_sequence", "email", "phone", "updated_at"} {
		if strings.Contains(string(raw), secret) {
			t.Fatal("private reader data", secret)
		}
	}

	h.request(guestClient, "GET", base+"/messages/"+message.ID+"/readers", nil, nil, 403)
	h.request(client, "GET", base+"/messages/"+message.ID+"/readers?cursor=forged", nil, nil, 400)
	raw, _ = h.request(guestClient, "GET", "/api/v1/meetings", nil, nil, 200)
	list := decodeMeetingTest[meetingsPageResponse](t, raw)
	if len(list.Meetings) != 1 || list.Meetings[0].UnreadCount == nil || *list.Meetings[0].UnreadCount != "0" {
		t.Fatal("list unread", string(raw))
	}

	off := newMeetingHTTPTest(t, meetings.WithChatSyncKey([]byte(strings.Repeat("s", 32))))
	offClient := off.client(true)
	offOwner := off.login(offClient, "owner", map[string]string{"kind": "home"})
	off.request(offClient, "PUT", base+"/read-marker", input, headersFor(off, offOwner, ""), 404)
	off.request(offClient, "POST", base+"/read-receipts/query", query, headersFor(off, offOwner, ""), 404)
	off.request(offClient, "GET", base+"/messages/"+message.ID+"/readers", nil, nil, 404)

	return append(h.captures, off.captures...)
}
