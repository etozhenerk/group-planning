package httpapi

import (
	"encoding/json"
	"io"
	"mime"
	"net/http"
	"strconv"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (h meetingHandlers) mediaLimits(w http.ResponseWriter, r *http.Request) {
	if !getOnly(w, r) {
		return
	}

	actor, ok := h.actor(w, r, false)
	if !ok {
		return
	}

	id, ok := parseMeetingID(w, r)
	if !ok {
		return
	}

	if _, ok := closedQuery(w, r); !ok {
		return
	}

	if _, err := h.app.Details(r.Context(), actor, id); err != nil {
		h.writeMeetingError(w, err)
		return
	}

	writeJSON(w, 200, struct {
		MaxPhotoBytes int      `json:"max_photo_bytes"`
		MaxFileBytes  int      `json:"max_file_bytes"`
		MaxFiles      int      `json:"max_files"`
		PhotoTypes    []string `json:"photo_types"`
		FileTypes     []string `json:"file_types"`
	}{meetings.MaxPhotoBytes, meetings.MaxFileBytes, meetings.MaxMediaSelection, []string{"image/jpeg", "image/png", "image/webp"}, []string{"image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain", "application/zip"}})
}

func (h meetingHandlers) prepareMedia(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodPost) {
		return
	}

	actor, ok := h.actor(w, r, true)
	if !ok {
		return
	}

	id, ok := parseMeetingID(w, r)
	if !ok {
		return
	}

	if _, ok := closedQuery(w, r); !ok {
		return
	}

	key, ok := requestKey(w, r)
	if !ok {
		return
	}

	var input struct {
		ClientRequestID string `json:"client_request_id"`
		FileName        string `json:"file_name"`
		ContentType     string `json:"content_type"`
		SizeBytes       int    `json:"size_bytes"`
		Purpose         string `json:"purpose"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}

	item, err := h.app.PrepareMedia(r.Context(), actor, id, meetings.MediaInput{ClientRequestID: input.ClientRequestID, FileName: input.FileName, ContentType: input.ContentType, SizeBytes: input.SizeBytes, Purpose: input.Purpose}, key)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	writeJSON(w, 201, struct {
		Media mediaResponse `json:"media"`
	}{mediaDTO(item, nil)})
}

func (h meetingHandlers) mediaContent(w http.ResponseWriter, r *http.Request) {
	if !allowMethods(w, r, http.MethodGet, http.MethodPut) {
		return
	}

	actor, ok := h.actor(w, r, r.Method == http.MethodPut)
	if !ok {
		return
	}

	id, ok := parseMeetingID(w, r)
	if !ok {
		return
	}

	if _, ok := closedQuery(w, r); !ok {
		return
	}

	mediaID, err := meetings.ParseUUID(r.PathValue("media_id"))
	if err != nil {
		writeError(w, 404, "not_found", nil)
		return
	}

	if r.Method == http.MethodPut {
		if r.ContentLength > meetings.MaxFileBytes {
			writeError(w, 413, "payload_too_large", nil)
			return
		}

		data, err := io.ReadAll(http.MaxBytesReader(w, r.Body, meetings.MaxFileBytes))
		if err != nil {
			writeError(w, 413, "payload_too_large", nil)
			return
		}

		item, err := h.app.UploadMedia(r.Context(), actor, id, mediaID, singleHeader(r, "Content-Type"), data)
		if err != nil {
			h.writeMeetingError(w, err)
			return
		}

		writeJSON(w, 200, struct {
			Media mediaResponse `json:"media"`
		}{mediaDTO(item, nil)})

		return
	}

	item, data, err := h.app.MediaBytes(r.Context(), actor, id, mediaID)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	disposition := "attachment"
	if item.Kind == "photo" {
		disposition = "inline"
	}

	w.Header().Set("Content-Type", item.ContentType)
	w.Header().Set("Content-Length", strconv.Itoa(len(data)))
	w.Header().Set("Content-Disposition", mime.FormatMediaType(disposition, map[string]string{"filename": item.FileName}))
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Content-Security-Policy", "default-src 'none'; sandbox")
	w.WriteHeader(200)
	if r.Method != http.MethodHead {
		_, _ = w.Write(data)
	}
}

func (h meetingHandlers) publishMedia(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodPost) {
		return
	}

	actor, ok := h.actor(w, r, true)
	if !ok {
		return
	}

	id, ok := parseMeetingID(w, r)
	if !ok {
		return
	}

	if _, ok := closedQuery(w, r); !ok {
		return
	}

	key, ok := requestKey(w, r)
	if !ok {
		return
	}

	mediaID, err := meetings.ParseUUID(r.PathValue("media_id"))
	if err != nil {
		writeError(w, 404, "not_found", nil)
		return
	}

	var input struct {
		Caption json.RawMessage `json:"caption"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}

	caption, ok := patchField(input.Caption, false)
	if !ok {
		writeError(w, 422, "validation_failed", map[string]string{"caption": "invalid"})
		return
	}

	result, err := h.app.PublishMediaWithCaption(r.Context(), actor, id, mediaID, key, caption.Value)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	var entry *feedEntryResponse
	if result.Entry != nil {
		value := entryDTO(*result.Entry)
		entry = &value
	}

	writeJSON(w, 200, struct {
		Media mediaResponse      `json:"media"`
		Entry *feedEntryResponse `json:"entry"`
	}{mediaDTO(result.Media, nil), entry})
}

func (h meetingHandlers) memories(w http.ResponseWriter, r *http.Request) {
	if !getOnly(w, r) {
		return
	}

	actor, ok := h.actor(w, r, false)
	if !ok {
		return
	}

	id, ok := parseMeetingID(w, r)
	if !ok {
		return
	}

	values, ok := closedQuery(w, r, "limit", "cursor")
	if !ok {
		return
	}

	limit, ok := pageLimit(w, values)
	if !ok {
		return
	}

	page, err := h.app.Memories(r.Context(), actor, id, limit, values.Get("cursor"))
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	ids := []string{}
	for _, item := range page.Photos {
		ids = append(ids, item.UploadedBy.ID)
	}

	users, err := h.identity.Users(r.Context(), ids)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	photos := make([]mediaResponse, 0, len(page.Photos))
	for _, item := range page.Photos {
		photos = append(photos, mediaDTO(item, users))
	}

	writeJSON(w, 200, struct {
		Photos     []mediaResponse `json:"photos"`
		NextCursor *string         `json:"next_cursor"`
	}{photos, optionalString(page.NextCursor)})
}
