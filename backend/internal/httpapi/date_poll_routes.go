package httpapi

import (
	"net/http"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type pollCall struct {
	Actor                  meetings.Actor
	MeetingID, PollID, Key string
}

func (h meetingHandlers) pollContext(w http.ResponseWriter, r *http.Request, method string, existing bool) (pollCall, bool) {
	if !allowMethods(w, r, method) {
		return pollCall{}, false
	}

	actor, ok := h.actor(w, r, method != http.MethodGet)
	if !ok {
		return pollCall{}, false
	}

	if _, ok := closedQuery(w, r); !ok {
		return pollCall{}, false
	}

	id, ok := parseMeetingID(w, r)
	if !ok {
		return pollCall{}, false
	}

	result := pollCall{Actor: actor, MeetingID: id}
	if existing {
		var err error
		result.PollID, err = meetings.ParseUUID(r.PathValue("poll_id"))
		if err != nil {
			writeError(w, 404, "not_found", nil)
			return pollCall{}, false
		}
	}

	if method != http.MethodGet {
		result.Key, ok = requestKey(w, r)
		if !ok {
			return pollCall{}, false
		}
	}

	return result, true
}

func writeDatePoll(w http.ResponseWriter, view meetings.DatePollView, err error, status int) {
	if err != nil {
		writeMeetingError(w, err)
		return
	}

	writeJSON(w, status, datePollDTO(view))
}

func (h meetingHandlers) readDatePoll(w http.ResponseWriter, r *http.Request) {
	call, ok := h.pollContext(w, r, http.MethodGet, true)
	if !ok {
		return
	}

	view, err := h.app.ReadDatePoll(r.Context(), call.Actor, call.MeetingID, call.PollID)
	writeDatePoll(w, view, err, 200)
}

func parsePollRevision(w http.ResponseWriter, value string) (uint64, bool) {
	revision, err := meetings.ParseRevision(value)
	if err != nil {
		writeError(w, 422, "validation_failed", map[string]string{"expected_revision": "invalid"})
		return 0, false
	}

	return revision, true
}
