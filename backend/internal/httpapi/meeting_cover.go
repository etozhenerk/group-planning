package httpapi

import (
	"net/http"
	"strconv"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (h meetingHandlers) coverURL(path, version string) *string {
	if version == "" || h.identity == nil {
		return nil
	}

	return optionalString(h.identity.PublicOrigin() + "/api/v1/" + path + "/cover?v=" + version)
}

func (h meetingHandlers) readCover(w http.ResponseWriter, r *http.Request) {
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

	query, ok := closedQuery(w, r, "v")
	if !ok {
		return
	}

	cover, err := h.app.ReadCover(r.Context(), actor, id, query.Get("v"))
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	writeCover(w, r, cover)
}

func (h meetingHandlers) readInvitationCover(w http.ResponseWriter, r *http.Request) {
	if !getOnly(w, r) {
		return
	}

	query, ok := closedQuery(w, r, "v")
	if !ok {
		return
	}

	cover, err := h.app.ReadInvitationCover(r.Context(), r.PathValue("token"), query.Get("v"))
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	writeCover(w, r, cover)
}

func writeCover(w http.ResponseWriter, r *http.Request, cover meetings.Cover) {
	w.Header().Set("Content-Type", cover.MediaType)
	w.Header().Set("Content-Length", strconv.Itoa(len(cover.Data)))
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Cache-Control", "private, no-store")
	w.WriteHeader(http.StatusOK)
	if r.Method != http.MethodHead {
		_, _ = w.Write(cover.Data)
	}
}
