package httpapi

import (
	"net/http"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (h meetingHandlers) chatCapabilities(w http.ResponseWriter, r *http.Request) {
	if !getOnly(w, r) {
		return
	}

	if _, ok := h.actor(w, r, false); !ok {
		return
	}

	if _, ok := closedQuery(w, r); !ok {
		return
	}

	writeJSON(w, 200, chatCapabilitiesResponse{ProtocolVersion: 1, Sync: h.app.ChatSyncEnabled(), ReadState: h.app.ChatReadStateEnabled(), Realtime: h.realtime})
}

func (h meetingHandlers) sync(w http.ResponseWriter, r *http.Request) {
	if !getOnly(w, r) {
		return
	}

	actor, ok := h.actor(w, r, false)
	if !ok {
		return
	}

	if !h.app.ChatSyncEnabled() {
		writeError(w, 404, "not_found", nil)
		return
	}

	id, ok := parseMeetingID(w, r)
	if !ok {
		return
	}

	values, ok := closedQuery(w, r, "cursor", "around_entry_id", "limit")
	if !ok {
		return
	}

	limit, ok := pageLimit(w, values)
	if !ok {
		return
	}

	if values.Has("cursor") && values.Get("cursor") == "" || values.Has("around_entry_id") && values.Get("around_entry_id") == "" || values.Has("cursor") && values.Has("around_entry_id") {
		writeError(w, 400, "invalid_query", nil)
		return
	}

	result, err := h.app.Sync(r.Context(), actor, id, meetings.SyncQuery{Limit: limit, Cursor: values.Get("cursor"), AroundEntryID: values.Get("around_entry_id")})
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	if result.Mode == "snapshot" {
		response := chatSnapshotResponse{Mode: result.Mode, StreamEpoch: result.StreamEpoch, ChangeCursor: result.ChangeCursor, Entries: []feedEntryResponse{}, Projections: []chatProjectionResponse{}, Meeting: h.chatMeetingDTO(result.Details), ProjectionVersion: decimal(result.ProjectionVersion), LatestSequence: decimal(result.LatestSequence), Range: feedRangeDTO(result.Entries), HasOlder: result.HasOlder, HasNewer: result.HasNewer}
		if result.ReadState != nil {
			state := readStateDTO(*result.ReadState)
			response.MyReadState = &state.ReadThrough
			response.UnreadBaseline = &state.Baseline
			response.UnreadCount = &state.UnreadCount
			response.FirstUnread = state.FirstUnread
		}

		response.Entries, err = h.chatEntriesDTO(r.Context(), result.Entries)
		if err != nil {
			h.writeMeetingError(w, err)
			return
		}

		for _, p := range result.Projections {
			projection, err := h.chatProjectionDTO(r.Context(), p)
			if err != nil {
				h.writeMeetingError(w, err)
				return
			}

			response.Projections = append(response.Projections, projection)
		}

		writeJSON(w, 200, response)

		return
	}

	response := chatChangesResponse{Mode: result.Mode, StreamEpoch: result.StreamEpoch, NextCursor: result.NextCursor, ThroughCursor: result.ThroughCursor, HasMore: result.HasMore, Changes: []chatChangeResponse{}, Meeting: h.chatMeetingDTO(result.Details), ProjectionVersion: decimal(result.ProjectionVersion)}
	if result.ReadState != nil {
		state := readStateDTO(*result.ReadState)
		response.MyReadState = &state.ReadThrough
		response.UnreadBaseline = &state.Baseline
		response.UnreadCount = &state.UnreadCount
		response.FirstUnread = &state.FirstUnread
	}

	for _, item := range result.Changes {
		change := chatChangeResponse{Kind: item.Kind, EntryID: optionalString(item.EntryID), ResourceKind: optionalString(item.ResourceKind), ResourceID: optionalString(item.ResourceID), ProjectionVersion: decimal(result.ProjectionVersion)}
		if item.Projection != nil {
			projection, err := h.chatProjectionDTO(r.Context(), *item.Projection)
			if err != nil {
				h.writeMeetingError(w, err)
				return
			}

			change.Projection = &projection
		}

		response.Changes = append(response.Changes, change)
	}

	writeJSON(w, 200, response)
}
