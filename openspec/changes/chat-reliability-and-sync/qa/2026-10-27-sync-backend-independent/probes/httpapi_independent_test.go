package httpapi

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestIndependentHTTPDeletionReplayAndTerminalRetention(t *testing.T) {
	h := newMeetingHTTPTest(t, meetings.WithChatSyncKey([]byte(strings.Repeat("deletion-key-", 3))))
	ownerClient, guestClient, maybeClient := h.client(true), h.client(true), h.client(true)
	owner := h.login(ownerClient, "owner", map[string]string{"kind": "home"})
	guest := h.login(guestClient, "guest", map[string]string{"kind": "home"})
	maybe := h.login(maybeClient, "other", map[string]string{"kind": "home"})
	create := func(key string) createdMeetingResponse {
		data, _ := h.request(ownerClient, "POST", "/api/v1/meetings", map[string]string{"title": "Independent deletion", "starts_on": "2099-01-01", "timezone": "UTC"}, headersFor(h, owner, testKey(key)), 201)
		return decodeMeetingTest[createdMeetingResponse](t, data)
	}
	shared, solo := create("8600"), create("8601")
	sharedInvite, _ := url.Parse(shared.InvitationURL)
	soloInvite, _ := url.Parse(solo.InvitationURL)
	h.request(guestClient, "PUT", "/api/v1/invitations/"+strings.TrimPrefix(sharedInvite.Path, "/i/")+"/rsvp", map[string]string{"answer": "going", "expected_revision": "0"}, headersFor(h, guest, testKey("8602")), 200)
	h.request(maybeClient, "PUT", "/api/v1/invitations/"+strings.TrimPrefix(soloInvite.Path, "/i/")+"/rsvp", map[string]string{"answer": "maybe", "expected_revision": "0"}, headersFor(h, maybe, testKey("8603")), 200)
	base := "/api/v1/meetings/" + shared.Meeting.ID
	data, _ := h.request(guestClient, "GET", base+"/sync?limit=1", nil, nil, 200)
	initial := decodeMeetingTest[chatSnapshotResponse](t, data)
	data, _ = h.request(ownerClient, "POST", base+"/messages", map[string]string{"text": "retained-independent-body", "client_request_id": testKey("8604")}, headersFor(h, owner, testKey("8604")), 201)
	entry := decodeMeetingTest[feedEntryResponse](t, data)
	headers := headersFor(h, owner, "")
	headers["X-Deletion-Token"] = base64.RawURLEncoding.EncodeToString(make([]byte, 32))
	h.request(ownerClient, "DELETE", "/api/v1/me", nil, headers, 204)
	h.request(ownerClient, "GET", base+"/sync", nil, nil, 401)
	data, _ = h.request(guestClient, "GET", base+"/sync?cursor="+url.QueryEscape(initial.ChangeCursor), nil, nil, 200)
	page := decodeMeetingTest[chatChangesResponse](t, data)
	invalidated, anonymized := false, false
	for _, change := range page.Changes {
		invalidated = invalidated || change.Kind == "history_invalidated"
		if change.Projection != nil && change.Projection.Entry != nil && change.Projection.Entry.ID == entry.ID {
			actor := change.Projection.Entry.Actor
			anonymized = actor.DisplayName == meetings.RemovedAccountName && actor.AvatarURL == nil
		}
	}
	if !invalidated || !anonymized || page.Meeting.OrganizerID != guest.User.ID {
		t.Fatalf("deletion replay missing current data: invalidated=%v anonymized=%v", invalidated, anonymized)
	}
	data, _ = h.request(guestClient, "GET", base+"/sync?around_entry_id="+entry.ID+"&limit=1", nil, nil, 200)
	current := decodeMeetingTest[chatSnapshotResponse](t, data)
	if len(current.Entries) != 1 || current.Entries[0].Actor.DisplayName != meetings.RemovedAccountName || current.Entries[0].Actor.AvatarURL != nil {
		t.Fatal("fresh snapshot restored deleted identity")
	}
	checkHints := func() {
		t.Helper()
		err := h.store.View(t.Context(), func(r meetings.Reader) error {
			if _, err := r.ChatStream(solo.Meeting.ID); !errors.Is(err, meetings.ErrNotFound) {
				t.Fatal("deleted meeting stream survived", err)
			}
			hints, err := r.PendingChatHints(time.Unix(h.clock.Load(), 0), 100)
			if err != nil {
				return err
			}
			terminal := false
			for _, hint := range hints {
				if hint.Target == "user" && hint.TargetID == owner.User.ID {
					t.Fatal("deleted user's pending recipient survived")
				}
				terminal = terminal || (hint.Target == "user" && hint.TargetID == maybe.User.ID && hint.MeetingID == solo.Meeting.ID && hint.Terminal)
			}
			if !terminal {
				t.Fatal("terminal private invalidation missing")
			}
			raw, err := json.Marshal(hints)
			if err != nil {
				return err
			}
			if strings.Contains(string(raw), "retained-independent-body") || strings.Contains(string(raw), owner.User.DisplayName) {
				t.Fatal("private body/name copied into hints")
			}
			return nil
		})
		if err != nil {
			t.Fatal(err)
		}
	}
	checkHints()
	h.clock.Add(int64(8 * 24 * time.Hour / time.Second))
	if err := h.app.MaintainChat(t.Context()); err != nil {
		t.Fatal(err)
	}
	checkHints()
	t.Log("HTTP account deletion: former session 401; shared history retained with anonymized name/no avatar; replay invalidates old ranges; solo stream removed; terminal recipient survives retention; removed recipient/body/name absent in hints")
}

func TestIndependentHTTPSyncBarrierAccessAndReset(t *testing.T) {
	h := newMeetingHTTPTest(t, meetings.WithChatSyncKey([]byte(strings.Repeat("independent-key-", 3))))
	client, guestClient := h.client(true), h.client(true)
	owner := h.login(client, "owner", map[string]string{"kind": "home"})
	guest := h.login(guestClient, "guest", map[string]string{"kind": "home"})
	data, _ := h.request(client, "POST", "/api/v1/meetings", map[string]string{"title": "Independent sync probe", "starts_on": "2099-01-01", "timezone": "UTC"}, headersFor(h, owner, testKey("8100")), 201)
	created := decodeMeetingTest[createdMeetingResponse](t, data)
	base := "/api/v1/meetings/" + created.Meeting.ID
	inviteURL, err := url.Parse(created.InvitationURL)
	if err != nil {
		t.Fatal(err)
	}
	invite := "/api/v1/invitations/" + strings.TrimPrefix(inviteURL.Path, "/i/")
	h.request(guestClient, "PUT", invite+"/rsvp", map[string]string{"answer": "going", "expected_revision": "0"}, headersFor(h, guest, testKey("8101")), 200)
	data, _ = h.request(client, "GET", base+"/sync?limit=2", nil, nil, 200)
	initial := decodeMeetingTest[chatSnapshotResponse](t, data)
	expected := map[string]bool{}
	for i := 0; i < 105; i++ {
		id := testKey(fmt.Sprint(8200 + i))
		data, _ = h.request(client, "POST", base+"/messages", map[string]string{"text": "independent-private-marker", "client_request_id": id}, headersFor(h, owner, id), 201)
		expected[decodeMeetingTest[feedEntryResponse](t, data).ID] = true
	}
	data, _ = h.request(client, "GET", base+"/sync?limit=40&cursor="+url.QueryEscape(initial.ChangeCursor), nil, nil, 200)
	page := decodeMeetingTest[chatChangesResponse](t, data)
	if !page.HasMore || len(page.Changes) != 40 {
		t.Fatalf("first page: more=%v count=%d", page.HasMore, len(page.Changes))
	}
	firstNext, barrier := page.NextCursor, page.ThroughCursor
	id := testKey("8400")
	data, _ = h.request(client, "POST", base+"/messages", map[string]string{"text": "after-barrier", "client_request_id": id}, headersFor(h, owner, id), 201)
	afterID := decodeMeetingTest[feedEntryResponse](t, data).ID
	seen := map[string]bool{}
	pages := 0
	for {
		pages++
		if page.ThroughCursor != barrier {
			t.Fatal("through cursor moved")
		}
		for _, item := range page.Changes {
			if item.EntryID == nil || !expected[*item.EntryID] || seen[*item.EntryID] {
				t.Fatal("duplicate, missing, or next-cycle event in fixed cycle")
			}
			if item.Projection == nil || item.Projection.Entry == nil || item.Projection.Entry.ID != *item.EntryID {
				t.Fatal("projection identity mismatch")
			}
			seen[*item.EntryID] = true
		}
		if !page.HasMore {
			break
		}
		data, _ = h.request(client, "GET", base+"/sync?limit=40&cursor="+url.QueryEscape(page.NextCursor), nil, nil, 200)
		page = decodeMeetingTest[chatChangesResponse](t, data)
		if pages > 5 {
			t.Fatal("cycle failed to terminate")
		}
	}
	if len(seen) != 105 || pages != 3 {
		t.Fatalf("expected 105 in 3 pages, got %d/%d", len(seen), pages)
	}
	data, _ = h.request(client, "GET", base+"/sync?limit=40&cursor="+url.QueryEscape(page.NextCursor), nil, nil, 200)
	next := decodeMeetingTest[chatChangesResponse](t, data)
	if len(next.Changes) != 1 || next.Changes[0].EntryID == nil || *next.Changes[0].EntryID != afterID || next.HasMore {
		t.Fatal("next cycle lost concurrent append")
	}
	data, _ = h.request(client, "GET", base+"/sync?limit=40&cursor="+url.QueryEscape(firstNext), nil, nil, 200)
	replay := decodeMeetingTest[chatChangesResponse](t, data)
	if replay.ThroughCursor != barrier || len(replay.Changes) != 40 {
		t.Fatal("bounded replay changed event range")
	}
	t.Log("HTTP fixed barrier: 105 changes in 3 pages; concurrent 106th appears next cycle; first continuation replay remains bounded")

	h.request(guestClient, "GET", base+"/sync?cursor="+url.QueryEscape(initial.ChangeCursor), nil, nil, 400)
	data, _ = h.request(guestClient, "GET", base+"/sync?limit=1", nil, nil, 200)
	guestCursor := decodeMeetingTest[chatSnapshotResponse](t, data).ChangeCursor
	h.request(guestClient, "PUT", base+"/rsvp", map[string]string{"answer": "not_going", "expected_revision": "1"}, headersFor(h, guest, testKey("8500")), 200)
	for _, cursor := range []string{guestCursor, "forged"} {
		data, _ = h.request(guestClient, "GET", base+"/sync?cursor="+url.QueryEscape(cursor), nil, nil, 403)
		if strings.Contains(string(data), "independent-private-marker") {
			t.Fatal("private data in denial")
		}
	}
	for _, query := range []string{"limit=0", "limit=101", "cursor=", "around_entry_id=", "cursor=x&around_entry_id=y", "cursor=x&cursor=y", "limit=1&surprise=1"} {
		h.request(client, "GET", base+"/sync?"+query, nil, nil, 400)
	}
	h.request(client, "GET", base+"/sync?around_entry_id="+testKey("9999"), nil, nil, 404)
	t.Log("HTTP scope: different actor cursor 400; revoked actor valid/forged cursors 403; malformed combinations 400; absent anchor 404")

	err = h.store.Update(t.Context(), func(w meetings.Writer) error {
		_, err := w.TrimChatStream(created.Meeting.ID, time.Unix(h.clock.Load(), 0).Add(time.Second), 100000)
		return err
	})
	if err != nil {
		t.Fatal(err)
	}
	data, _ = h.request(client, "GET", base+"/sync?cursor="+url.QueryEscape(initial.ChangeCursor), nil, nil, 410)
	failure := decodeMeetingTest[errorBody](t, data)
	if failure.Error.Code != "sync_reset_required" || failure.Error.RequestID == "" {
		t.Fatal("wrong reset envelope")
	}
	data, _ = h.request(client, "GET", base+"/sync?around_entry_id="+afterID+"&limit=1", nil, nil, 200)
	fresh := decodeMeetingTest[chatSnapshotResponse](t, data)
	if len(fresh.Entries) != 1 || fresh.Entries[0].ID != afterID {
		t.Fatal("retention erased feed or anchor")
	}
	if strings.Contains(h.logs.String(), "independent-private-marker") || strings.Contains(h.logs.String(), initial.ChangeCursor) {
		t.Fatal("payload or cursor logged")
	}
	t.Log("HTTP retention: old cursor 410 with request_id; fresh around snapshot preserves history; captured diagnostics exclude message/cursor")
}
