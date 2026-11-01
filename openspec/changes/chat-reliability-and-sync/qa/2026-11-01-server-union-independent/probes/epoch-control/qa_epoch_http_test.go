// External QA-only handlers and probe; not installed in product/runtime.
package httpapi

import (
	"encoding/json"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
	"net/http"
	"net/url"
	"strings"
	"testing"
	"time"
)

func qaEpochReviewHandler(store *memory.Store, token string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if token == "" || r.Header.Get("X-Somewhere-QA-Epoch-Control") != token {
			http.NotFound(w, r)
			return
		}
		var input struct {
			MeetingID     string `json:"meeting_id"`
			ExpectedEpoch string `json:"expected_epoch"`
			NextEpoch     string `json:"next_epoch"`
		}
		r.Body = http.MaxBytesReader(w, r.Body, 2048)
		dec := json.NewDecoder(r.Body)
		dec.DisallowUnknownFields()
		if dec.Decode(&input) != nil {
			w.WriteHeader(400)
			return
		}
		stream, err := store.QAOnlyRotateChatEpoch(r.Context(), input.MeetingID, input.ExpectedEpoch, input.NextEpoch)
		if err != nil {
			w.WriteHeader(409)
			return
		}
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{"meeting_id": stream.MeetingID, "old_epoch": input.ExpectedEpoch, "new_epoch": stream.Epoch, "latest_sequence": stream.LatestSequence, "retained_after": stream.RetainedAfter})
	})
}

func TestQAOnlyEpochBoundaryPreservesRealStoreAndAuthorizedHTTP(t *testing.T) {
	const token = "synthetic-regression-token"
	h := newMeetingHTTPTestWithHandler(t, func(api http.Handler, h *meetingHTTPTest) http.Handler {
		mux := http.NewServeMux()
		mux.Handle("/", api)
		mux.Handle("POST /__test/chat-epoch", qaEpochReviewHandler(h.store, token))
		return mux
	}, meetings.WithChatSyncKey([]byte(strings.Repeat("epoch-probe-", 3))))
	client := h.client(true)
	owner := h.login(client, "owner", map[string]string{"kind": "home"})
	input := map[string]any{"title": "QA own epoch proof", "starts_on": time.Unix(h.clock.Load(), 0).Add(24 * time.Hour).Format(time.DateOnly), "timezone": "UTC"}
	raw, _ := h.request(client, "POST", "/api/v1/meetings", input, headersFor(h, owner, testKey("9100")), 201)
	created := decodeMeetingTest[createdMeetingResponse](t, raw)
	base := "/api/v1/meetings/" + created.Meeting.ID
	raw, _ = h.request(client, "POST", base+"/messages", map[string]string{"text": "Synthetic retained text", "client_request_id": testKey("9101")}, headersFor(h, owner, testKey("9101")), 201)
	entry := decodeMeetingTest[feedEntryResponse](t, raw)
	raw, _ = h.request(client, "GET", base+"/sync", nil, nil, 200)
	before := decodeMeetingTest[chatSnapshotResponse](t, raw)
	rotation := map[string]string{"meeting_id": created.Meeting.ID, "expected_epoch": before.StreamEpoch, "next_epoch": "qa-next-epoch"}
	h.request(client, "POST", "/__test/chat-epoch", rotation, nil, 404)
	h.request(client, "POST", "/__test/chat-epoch", map[string]string{"meeting_id": created.Meeting.ID, "expected_epoch": "wrong", "next_epoch": "qa-next-epoch"}, map[string]string{"X-Somewhere-QA-Epoch-Control": token}, 409)
	h.request(client, "POST", "/__test/chat-epoch", rotation, map[string]string{"X-Somewhere-QA-Epoch-Control": token}, 200)
	raw, _ = h.request(client, "GET", base+"/sync?cursor="+url.QueryEscape(before.ChangeCursor), nil, nil, 410)
	if decodeMeetingTest[errorBody](t, raw).Error.Code != "sync_reset_required" {
		t.Fatal("not real reset")
	}
	raw, _ = h.request(client, "GET", base+"/sync?around_entry_id="+entry.ID, nil, nil, 200)
	after := decodeMeetingTest[chatSnapshotResponse](t, raw)
	if after.StreamEpoch == before.StreamEpoch || after.StreamEpoch != "qa-next-epoch" || after.LatestSequence != before.LatestSequence || len(after.Entries) != len(before.Entries) {
		t.Fatal("epoch boundary changed history/counters")
	}
	found := false
	for _, e := range after.Entries {
		found = found || e.ID == entry.ID
	}
	if !found {
		t.Fatal("anchor lost")
	}
	h.request(h.anonymous, "GET", base+"/sync", nil, nil, 401)
	t.Log("real memory.Store.Update rotated exactly one guarded stream; wrong token404/wrong epoch409; signed old cursor actual410; new authorized around snapshot next epoch, same entries/sequence, anchor retained; anonymous401")
}
