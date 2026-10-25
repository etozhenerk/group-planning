package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (h meetingHandlers) writePreparationTask(w http.ResponseWriter, r *http.Request, view meetings.PreparationTaskView, err error, status int) {
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	result, err := h.preparationTaskDTO(r.Context(), view)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	writeJSON(w, status, result)
}

func (h meetingHandlers) createPreparationTask(w http.ResponseWriter, r *http.Request) {
	call, ok := h.pollContext(w, r, http.MethodPost, false)
	if !ok {
		return
	}

	var input struct {
		Title       string          `json:"title"`
		RecipientID json.RawMessage `json:"recipient_id"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}

	if len(input.RecipientID) == 0 {
		writeError(w, 422, "validation_failed", map[string]string{"recipient_id": "required"})
		return
	}

	var requestedRecipient *string
	if err := json.Unmarshal(input.RecipientID, &requestedRecipient); err != nil {
		writeError(w, 422, "validation_failed", map[string]string{"recipient_id": "invalid"})
		return
	}

	recipientID := ""
	if requestedRecipient != nil {
		var err error
		recipientID, err = meetings.ParseUUID(*requestedRecipient)
		if err != nil {
			writeError(w, 422, "validation_failed", map[string]string{"recipient_id": "invalid"})
			return
		}
	}

	view, err := h.app.CreatePreparationTask(r.Context(), call.Actor, call.MeetingID, meetings.CreatePreparationTaskInput{Title: input.Title, RecipientID: recipientID}, call.Key)
	h.writePreparationTask(w, r, view, err, 201)
}

func parseTaskID(w http.ResponseWriter, r *http.Request) (string, bool) {
	id, err := meetings.ParseUUID(r.PathValue("task_id"))
	if err != nil {
		writeError(w, 404, "not_found", nil)
		return "", false
	}

	return id, true
}

func (h meetingHandlers) readPreparationTask(w http.ResponseWriter, r *http.Request) {
	call, ok := h.pollContext(w, r, http.MethodGet, false)
	if !ok {
		return
	}

	taskID, ok := parseTaskID(w, r)
	if !ok {
		return
	}

	view, err := h.app.ReadPreparationTask(r.Context(), call.Actor, call.MeetingID, taskID)
	h.writePreparationTask(w, r, view, err, 200)
}

func (h meetingHandlers) actOnPreparationTask(w http.ResponseWriter, r *http.Request) {
	call, ok := h.pollContext(w, r, http.MethodPost, false)
	if !ok {
		return
	}

	taskID, ok := parseTaskID(w, r)
	if !ok {
		return
	}

	action := meetings.PreparationAction(r.PathValue("action"))
	switch action {
	case meetings.TaskAccept, meetings.TaskDecline, meetings.TaskCancel, meetings.TaskComplete:
	default:
		writeError(w, 404, "not_found", nil)
		return
	}

	var input struct {
		ExpectedRevision string `json:"expected_revision"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}

	revision, ok := parsePollRevision(w, input.ExpectedRevision)
	if !ok {
		return
	}

	view, err := h.app.ActOnPreparationTask(r.Context(), call.Actor, call.MeetingID, taskID, meetings.PreparationActionInput{Action: action, ExpectedRevision: revision}, call.Key)
	h.writePreparationTask(w, r, view, err, 200)
}
