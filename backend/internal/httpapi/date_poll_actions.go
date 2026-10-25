package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (h meetingHandlers) voteDatePoll(w http.ResponseWriter, r *http.Request) {
	call, ok := h.pollContext(w, r, http.MethodPut, true)
	if !ok {
		return
	}

	var input struct {
		OptionIDs        *[]string `json:"option_ids"`
		ExpectedRevision string    `json:"expected_revision"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}

	if input.OptionIDs == nil {
		writeError(w, 422, "validation_failed", map[string]string{"option_ids": "required"})
		return
	}

	revision, ok := parsePollRevision(w, input.ExpectedRevision)
	if !ok {
		return
	}

	view, err := h.app.VoteDatePoll(r.Context(), call.Actor, call.MeetingID, call.PollID, meetings.DateVoteInput{OptionIDs: *input.OptionIDs, ExpectedRevision: revision}, call.Key)
	h.writeDatePoll(w, view, err, 200)
}

func (h meetingHandlers) addDateOption(w http.ResponseWriter, r *http.Request) {
	call, ok := h.pollContext(w, r, http.MethodPost, true)
	if !ok {
		return
	}

	var input struct {
		Date             string `json:"date"`
		ExpectedRevision string `json:"expected_revision"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}

	revision, ok := parsePollRevision(w, input.ExpectedRevision)
	if !ok {
		return
	}

	view, err := h.app.AddDateOption(r.Context(), call.Actor, call.MeetingID, call.PollID, meetings.AddDateOptionInput{Date: input.Date, ExpectedRevision: revision}, call.Key)
	h.writeDatePoll(w, view, err, 200)
}

func (h meetingHandlers) resolveDatePoll(w http.ResponseWriter, r *http.Request) {
	call, ok := h.pollContext(w, r, http.MethodPost, true)
	if !ok {
		return
	}

	var input struct {
		OptionID         string          `json:"option_id"`
		ExpectedRevision string          `json:"expected_revision"`
		StartsAt         json.RawMessage `json:"starts_at"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}

	revision, ok := parsePollRevision(w, input.ExpectedRevision)
	if !ok {
		return
	}

	instant, ok := patchField(input.StartsAt, true)
	if !ok {
		writeError(w, 422, "validation_failed", map[string]string{"starts_at": "invalid"})
		return
	}

	view, err := h.app.ResolveDatePoll(r.Context(), call.Actor, call.MeetingID, call.PollID, meetings.ResolveDatePollInput{OptionID: input.OptionID, ExpectedRevision: revision, StartsAt: instant}, call.Key)
	h.writeDatePoll(w, view, err, 200)
}
