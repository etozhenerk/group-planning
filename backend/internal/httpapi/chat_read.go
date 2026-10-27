package httpapi

import (
	"net/http"
	"strconv"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type readStateResponse struct {
	ReadThrough       string  `json:"read_through_sequence"`
	Baseline          string  `json:"unread_baseline_sequence"`
	UnreadCount       string  `json:"unread_count"`
	FirstUnread       *string `json:"first_unread"`
	ProjectionVersion string  `json:"projection_version"`
}
type (
	readReceiptResponse struct {
		EntryID     string `json:"entry_id"`
		ReaderCount string `json:"reader_count"`
	}
	readReceiptsResponse struct {
		Receipts          []readReceiptResponse `json:"receipts"`
		ProjectionVersion string                `json:"projection_version"`
	}
	messageReadersResponse struct {
		Readers           []userResponse `json:"readers"`
		ReaderCount       string         `json:"reader_count"`
		NextCursor        *string        `json:"next_cursor"`
		ProjectionVersion string         `json:"projection_version"`
	}
)

func readStateDTO(state meetings.ReadState) readStateResponse {
	return readStateResponse{decimal(state.ReadThrough), decimal(state.Baseline), decimal(state.UnreadCount), optionalString(state.FirstUnread), decimal(state.ProjectionVersion)}
}

func (h meetingHandlers) readEnabled(w http.ResponseWriter) bool {
	if !h.app.ChatReadStateEnabled() {
		writeError(w, 404, "not_found", nil)
		return false
	}

	return true
}

func (h meetingHandlers) readMarker(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodPut) {
		return
	}

	actor, ok := h.actor(w, r, true)
	if !ok || !h.readEnabled(w) {
		return
	}

	id, ok := parseMeetingID(w, r)
	if !ok {
		return
	}

	if _, ok := closedQuery(w, r); !ok {
		return
	}

	var input struct {
		ReadThrough string `json:"read_through_sequence"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}

	sequence, err := strconv.ParseUint(input.ReadThrough, 10, 64)
	if err != nil || decimal(sequence) != input.ReadThrough || sequence == 0 {
		writeError(w, 422, "validation_failed", map[string]string{"read_through_sequence": "invalid"})
		return
	}

	state, err := h.app.MarkRead(r.Context(), actor, id, sequence)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	writeJSON(w, 200, readStateDTO(state))
}

func (h meetingHandlers) readReceipts(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodPost) {
		return
	}

	actor, ok := h.actor(w, r, true)
	if !ok || !h.readEnabled(w) {
		return
	}

	id, ok := parseMeetingID(w, r)
	if !ok {
		return
	}

	if _, ok := closedQuery(w, r); !ok {
		return
	}

	var input struct {
		EntryIDs []string `json:"entry_ids"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}

	result, err := h.app.QueryReadReceipts(r.Context(), actor, id, input.EntryIDs)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	response := readReceiptsResponse{Receipts: []readReceiptResponse{}, ProjectionVersion: decimal(result.ProjectionVersion)}
	for _, receipt := range result.Receipts {
		response.Receipts = append(response.Receipts, readReceiptResponse{receipt.EntryID, decimal(receipt.ReaderCount)})
	}

	writeJSON(w, 200, response)
}

func (h meetingHandlers) messageReaders(w http.ResponseWriter, r *http.Request) {
	if !getOnly(w, r) {
		return
	}

	actor, ok := h.actor(w, r, false)
	if !ok || !h.readEnabled(w) {
		return
	}

	id, ok := parseMeetingID(w, r)
	if !ok {
		return
	}

	values, ok := closedQuery(w, r, "cursor", "limit")
	if !ok {
		return
	}

	limit, ok := pageLimit(w, values)
	if !ok {
		return
	}

	if values.Has("cursor") && values.Get("cursor") == "" {
		writeError(w, 400, "invalid_query", nil)
		return
	}

	entryID, err := meetings.ParseUUID(r.PathValue("entry_id"))
	if err != nil {
		writeError(w, 404, "not_found", nil)
		return
	}

	result, err := h.app.MessageReaders(r.Context(), actor, id, entryID, values.Get("cursor"), limit)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	users, err := h.identity.Users(r.Context(), result.UserIDs)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	confirmed, err := h.app.MessageReaders(r.Context(), actor, id, entryID, values.Get("cursor"), limit)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	if confirmed.ProjectionVersion != result.ProjectionVersion {
		h.writeMeetingError(w, meetings.ErrSyncResetRequired)
		return
	}

	response := messageReadersResponse{Readers: []userResponse{}, ReaderCount: decimal(result.ReaderCount), NextCursor: optionalString(result.NextCursor), ProjectionVersion: decimal(result.ProjectionVersion)}
	for _, userID := range result.UserIDs {
		response.Readers = append(response.Readers, publicUserDTO(users[userID]))
	}

	writeJSON(w, 200, response)
}
