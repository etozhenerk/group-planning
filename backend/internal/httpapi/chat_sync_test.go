package httpapi

import (
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestChatSyncHTTP(t *testing.T) { chatSyncHTTPChecks(t) }

func chatSyncHTTPChecks(t *testing.T) []capturedResponse {
	h := newMeetingHTTPTest(t, meetings.WithChatSyncKey([]byte(strings.Repeat("test-sync-key-", 3))))
	client := h.client(true)
	owner := h.login(client, "owner", map[string]string{"kind": "home"})
	h.request(h.anonymous, "GET", "/api/v1/chat-capabilities", nil, nil, 401)
	raw, _ := h.request(client, "GET", "/api/v1/chat-capabilities", nil, nil, 200)
	flags := decodeMeetingTest[chatCapabilitiesResponse](t, raw)
	if !flags.Sync || flags.ReadState || flags.Realtime || flags.ProtocolVersion != 1 {
		t.Fatal("capabilities", flags)
	}

	input := map[string]any{"title": "Sync", "starts_on": time.Unix(h.clock.Load(), 0).Add(24 * time.Hour).Format(time.DateOnly), "timezone": "UTC"}
	raw, _ = h.request(client, "POST", "/api/v1/meetings", input, headersFor(h, owner, testKey("1200")), 201)
	created := decodeMeetingTest[createdMeetingResponse](t, raw)
	base := "/api/v1/meetings/" + created.Meeting.ID
	raw, _ = h.request(client, "GET", base+"/sync?limit=1", nil, nil, 200)
	snapshot := decodeMeetingTest[chatSnapshotResponse](t, raw)
	if snapshot.Mode != "snapshot" || len(snapshot.Entries) != 1 || snapshot.ChangeCursor == "" || snapshot.MyReadState != nil || snapshot.FirstUnread != nil {
		t.Fatal("snapshot", snapshot)
	}

	for _, id := range []string{"1201", "1202", "1203"} {
		h.request(client, "POST", base+"/messages", map[string]string{"text": "private sync text", "client_request_id": testKey(id)}, headersFor(h, owner, testKey(id)), 201)
	}

	raw, _ = h.request(client, "GET", base+"/sync?limit=2&cursor="+url.QueryEscape(snapshot.ChangeCursor), nil, nil, 200)
	first := decodeMeetingTest[chatChangesResponse](t, raw)
	if !first.HasMore || len(first.Changes) != 2 || first.Changes[0].Projection == nil || first.Changes[0].Projection.Entry == nil || first.Changes[0].Projection.Entry.Actor.AvatarURL == nil {
		t.Fatal("changes", first)
	}

	raw, _ = h.request(client, "GET", base+"/sync?limit=2&cursor="+url.QueryEscape(first.NextCursor), nil, nil, 200)
	last := decodeMeetingTest[chatChangesResponse](t, raw)
	if last.HasMore || len(last.Changes) != 1 || last.ThroughCursor != first.ThroughCursor {
		t.Fatal("barrier", last)
	}

	anchor := last.Changes[0].Projection.Entry.ID
	raw, _ = h.request(client, "GET", base+"/feed?limit=2&around_entry_id="+anchor, nil, nil, 200)
	var around struct {
		feedPageResponse
		Range    chatRangeResponse `json:"range"`
		HasOlder bool              `json:"has_older"`
		HasNewer bool              `json:"has_newer"`
	}
	around = decodeMeetingTest[struct {
		feedPageResponse
		Range    chatRangeResponse `json:"range"`
		HasOlder bool              `json:"has_older"`
		HasNewer bool              `json:"has_newer"`
	}](t, raw)
	if len(around.Entries) != 2 || !around.HasOlder || around.HasNewer || around.Range.LastSequence == nil {
		t.Fatal("around", around)
	}

	h.request(client, "GET", base+"/feed?around_entry_id="+anchor+"&before_sequence=3", nil, nil, 400)
	h.request(client, "GET", base+"/sync?cursor="+url.QueryEscape(snapshot.ChangeCursor)+"&around_entry_id="+anchor, nil, nil, 400)
	raw, _ = h.request(client, "GET", base+"/sync?cursor=forged", nil, nil, 400)
	if decodeMeetingTest[errorBody](t, raw).Error.Code != "invalid_sync_cursor" {
		t.Fatal("invalid cursor envelope")
	}

	err := h.store.Update(t.Context(), func(w meetings.Writer) error {
		_, err := w.TrimChatStream(created.Meeting.ID, time.Unix(h.clock.Load(), 0).Add(time.Second), 100000)
		return err
	})
	if err != nil {
		t.Fatal(err)
	}

	raw, _ = h.request(client, "GET", base+"/sync?cursor="+url.QueryEscape(snapshot.ChangeCursor), nil, nil, 410)
	failure := decodeMeetingTest[errorBody](t, raw)
	if failure.Error.Code != "sync_reset_required" || failure.Error.RequestID == "" {
		t.Fatal("reset envelope", failure)
	}

	raw, _ = h.request(client, "GET", base+"/sync?around_entry_id="+anchor, nil, nil, 200)
	if decodeMeetingTest[chatSnapshotResponse](t, raw).ChangeCursor == "" {
		t.Fatal("reset could not recover")
	}

	if strings.Contains(h.logs.String(), snapshot.ChangeCursor) || strings.Contains(h.logs.String(), "private sync text") {
		t.Fatal("sync data leaked in logs")
	}

	disabled := newMeetingHTTPTest(t)
	offClient := disabled.client(true)
	disabled.login(offClient, "owner", map[string]string{"kind": "home"})
	raw, _ = disabled.request(offClient, "GET", "/api/v1/chat-capabilities", nil, nil, 200)
	if decodeMeetingTest[chatCapabilitiesResponse](t, raw).Sync {
		t.Fatal("unconfigured signing key advertised sync")
	}

	disabled.request(offClient, "GET", base+"/sync", nil, nil, 404)

	return append(h.captures, disabled.captures...)
}
