package httpapi

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestIndependentReadHTTPBoundaryAndLifecycle(t *testing.T) {
	h := newMeetingHTTPTest(t, meetings.WithChatSyncKey([]byte(strings.Repeat("q", 32))), meetings.WithChatReadState(true))
	ac, bc, cc := h.client(true), h.client(true), h.client(true)
	a := h.login(ac, "owner", map[string]string{"kind": "home"})
	b := h.login(bc, "guest", map[string]string{"kind": "home"})
	c := h.login(cc, "other", map[string]string{"kind": "home"})
	raw, _ := h.request(ac, "POST", "/api/v1/meetings", map[string]string{"title": "Independent read probe", "starts_on": time.Unix(h.clock.Load(), 0).Add(24 * time.Hour).Format(time.DateOnly), "timezone": "UTC"}, headersFor(h, a, testKey("17000")), 201)
	created := decodeMeetingTest[createdMeetingResponse](t, raw)
	id := created.Meeting.ID
	base := "/api/v1/meetings/" + id
	u, _ := url.Parse(created.InvitationURL)
	invite := "/api/v1/invitations/" + strings.TrimPrefix(u.Path, "/i/")
	h.request(bc, "PUT", invite+"/rsvp", map[string]string{"answer": "going", "expected_revision": "0"}, headersFor(h, b, testKey("17001")), 200)
	var own []feedEntryResponse
	for i := range 2 {
		k := testKey(fmt.Sprint(17002 + i))
		r, _ := h.request(ac, "POST", base+"/messages", map[string]string{"text": "author message", "client_request_id": k}, headersFor(h, a, k), 201)
		own = append(own, decodeMeetingTest[feedEntryResponse](t, r))
	}
	k := testKey("17004")
	raw, _ = h.request(bc, "POST", base+"/messages", map[string]string{"text": "guest own", "client_request_id": k}, headersFor(h, b, k), 201)
	foreign := decodeMeetingTest[feedEntryResponse](t, raw)
	raw, _ = h.request(bc, "GET", base+"/sync", nil, nil, 200)
	initial := decodeMeetingTest[chatSnapshotResponse](t, raw)
	if *initial.UnreadCount != "2" || *initial.MyReadState != "0" || *initial.FirstUnread != own[0].ID {
		t.Fatalf("unread excludes own: %s", raw)
	}
	read := func(client *http.Client, actor meResponse, sequence string, status int) readStateResponse {
		r, _ := h.request(client, "PUT", base+"/read-marker", map[string]string{"read_through_sequence": sequence}, headersFor(h, actor, ""), status)
		if status == 200 {
			return decodeMeetingTest[readStateResponse](t, r)
		}
		for _, p := range []string{"unread_count", "read_through_sequence\":\"", "readers"} {
			if strings.Contains(string(r), p) && p != "read_through_sequence\":\"" {
				t.Fatalf("error leaked projection %s", r)
			}
		}
		return readStateResponse{}
	}
	for _, bad := range []string{"0", "01", "+1", "-1", "1.0", "18446744073709551616", "18446744073709551615"} {
		read(bc, b, bad, 422)
	}
	read(cc, c, own[1].Sequence, 403)
	state := read(bc, b, own[0].Sequence, 200)
	if state.UnreadCount != "1" || state.FirstUnread == nil || *state.FirstUnread != own[1].ID {
		t.Fatal(state)
	}
	state = read(bc, b, own[1].Sequence, 200)
	if state.UnreadCount != "0" || state.FirstUnread != nil {
		t.Fatal(state)
	}
	late := read(bc, b, own[0].Sequence, 200)
	if late != state {
		t.Fatalf("late marker changed %+v -> %+v", state, late)
	}
	raw, _ = h.request(bc, "GET", base+"/sync?cursor="+url.QueryEscape(initial.ChangeCursor), nil, nil, 200)
	if !strings.Contains(string(raw), `"first_unread":null`) || !strings.Contains(string(raw), `"my_read_state":"`+own[1].Sequence+`"`) {
		t.Fatalf("sync stale %s", raw)
	}
	query := func(ids []string, status int) []byte {
		r, _ := h.request(ac, "POST", base+"/read-receipts/query", map[string]any{"entry_ids": ids}, headersFor(h, a, ""), status)
		return r
	}
	query(nil, 422)
	query([]string{own[0].ID, own[0].ID}, 422)
	raw = query([]string{own[0].ID, foreign.ID}, 403)
	if strings.Contains(string(raw), "receipts") {
		t.Fatalf("partial forbidden batch %s", raw)
	}
	ids := []string{own[0].ID, own[1].ID}
	if err := h.store.Update(t.Context(), func(w meetings.Writer) error {
		for i := range 98 {
			entryID := testKey(fmt.Sprint(18000 + i))
			_, err := w.AppendEntry(meetings.FeedEntry{ID: entryID, MeetingID: id, ActorID: a.User.ID, Kind: "message", Payload: []byte(`{"text":"batch fixture"}`)})
			if err != nil {
				return err
			}
			ids = append(ids, entryID)
		}
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	raw = query(ids, 200)
	receipts := decodeMeetingTest[readReceiptsResponse](t, raw)
	if len(receipts.Receipts) != 100 || receipts.Receipts[0].ReaderCount != "1" || receipts.Receipts[99].ReaderCount != "0" {
		t.Fatal(receipts)
	}
	query(append(ids, testKey("18999")), 422)
	// New join's baseline does not create receipts for the 100 old messages.
	h.request(cc, "PUT", invite+"/rsvp", map[string]string{"answer": "going", "expected_revision": "0"}, headersFor(h, c, testKey("17005")), 200)
	raw = query([]string{own[1].ID}, 200)
	if decodeMeetingTest[readReceiptsResponse](t, raw).Receipts[0].ReaderCount != "1" {
		t.Fatal("baseline fabricated receipt")
	}
	read(cc, c, own[1].Sequence, 200)
	path := base + "/messages/" + own[1].ID + "/readers?limit=1"
	raw, _ = h.request(ac, "GET", path, nil, nil, 200)
	page := decodeMeetingTest[messageReadersResponse](t, raw)
	if page.ReaderCount != "2" || len(page.Readers) != 1 || page.NextCursor == nil {
		t.Fatal(page)
	}
	for _, private := range []string{"email", "phone", "read_through", "updated_at"} {
		if strings.Contains(string(raw), private) {
			t.Fatalf("private readers %s", raw)
		}
	}
	h.request(bc, "GET", path+"&cursor="+url.QueryEscape(*page.NextCursor), nil, nil, 403)
	h.request(ac, "GET", path+"&cursor=forged", nil, nil, 400)
	// Withdraw/rejoin retains B's original actual, while A's later messages stay unread.
	h.request(bc, "PUT", base+"/rsvp", map[string]string{"answer": "not_going", "expected_revision": "1"}, headersFor(h, b, testKey("17006")), 200)
	read(bc, b, own[1].Sequence, 403)
	h.request(bc, "PUT", invite+"/rsvp", map[string]string{"answer": "going", "expected_revision": "2"}, headersFor(h, b, testKey("17007")), 200)
	state = read(bc, b, own[0].Sequence, 200)
	if state.ReadThrough != own[1].Sequence || state.UnreadCount != "98" || state.FirstUnread == nil || *state.FirstUnread != ids[2] {
		t.Fatalf("rejoin reset %+v", state)
	}
	raw, _ = h.request(bc, "GET", "/api/v1/meetings", nil, nil, 200)
	list := decodeMeetingTest[meetingsPageResponse](t, raw)
	if len(list.Meetings) != 1 || *list.Meetings[0].UnreadCount != "98" {
		t.Fatalf("list stale %s", raw)
	}
	// Delete C through the actual account endpoint; old reader cursor cannot expose C.
	headers := headersFor(h, c, "")
	headers["X-Deletion-Token"] = base64.RawURLEncoding.EncodeToString(make([]byte, 32))
	h.request(cc, "DELETE", "/api/v1/me", nil, headers, 204)
	raw, _ = h.request(ac, "GET", path+"&cursor="+url.QueryEscape(*page.NextCursor), nil, nil, 200)
	after := decodeMeetingTest[messageReadersResponse](t, raw)
	if after.ReaderCount != "1" || strings.Contains(string(raw), c.User.ID) {
		t.Fatalf("removed reader survived %s", raw)
	}
	read(cc, c, own[1].Sequence, 401)
	for _, field := range []string{"reader_count", "read_through_sequence", "unread_baseline_sequence"} {
		if strings.Contains(h.logs.String(), field) {
			t.Fatal("private read field logged", field)
		}
	}
	n, _ := strconv.Atoi(own[1].Sequence)
	t.Logf("HTTPS: marker %d max/noop; unread2->1->0; 100 IDs accepted,101/mixed/duplicate rejected; rejoin unread98; deleted reader excluded on saved cursor", n)
}
