package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (h meetingHandlers) writePlacePoll(w http.ResponseWriter, view meetings.PlacePollView, err error, status int) {
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	writeJSON(w, status, placePollDTO(view))
}

func (h meetingHandlers) createPlacePoll(w http.ResponseWriter, r *http.Request) {
	call, ok := h.pollContext(w, r, http.MethodPost, false)
	if !ok {
		return
	}

	var input struct {
		Place       string          `json:"place"`
		Explanation json.RawMessage `json:"explanation"`
		ClosesAt    string          `json:"closes_at"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}

	explanation, ok := patchField(input.Explanation, false)
	if !ok {
		writeError(w, 422, "validation_failed", map[string]string{"explanation": "invalid"})
		return
	}

	view, err := h.app.CreatePlacePoll(r.Context(), call.Actor, call.MeetingID, meetings.CreatePlacePollInput{Place: input.Place, ClosesAt: input.ClosesAt, Explanation: explanation.Value}, call.Key)
	h.writePlacePoll(w, view, err, 201)
}

func (h meetingHandlers) readPlacePoll(w http.ResponseWriter, r *http.Request) {
	call, ok := h.pollContext(w, r, http.MethodGet, true)
	if !ok {
		return
	}

	view, err := h.app.ReadPlacePoll(r.Context(), call.Actor, call.MeetingID, call.PollID)
	h.writePlacePoll(w, view, err, 200)
}

func (h meetingHandlers) votePlacePoll(w http.ResponseWriter, r *http.Request) {
	call, ok := h.pollContext(w, r, http.MethodPut, true)
	if !ok {
		return
	}

	var input struct {
		Answer           meetings.PlaceVote `json:"answer"`
		ExpectedRevision string             `json:"expected_revision"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}

	revision, ok := parsePollRevision(w, input.ExpectedRevision)
	if !ok {
		return
	}

	view, err := h.app.VotePlacePoll(r.Context(), call.Actor, call.MeetingID, call.PollID, meetings.PlaceVoteInput{Answer: input.Answer, ExpectedRevision: revision}, call.Key)
	h.writePlacePoll(w, view, err, 200)
}
