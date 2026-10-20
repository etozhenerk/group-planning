package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type createMeetingRequest struct {
	Title       string  `json:"title"`
	Description *string `json:"description"`
	StartsAt    string  `json:"starts_at"`
	Timezone    string  `json:"timezone"`
	Place       *string `json:"place"`
}

func stringValue(value *string) string {
	if value == nil {
		return ""
	}

	return *value
}

func (h meetingHandlers) collection(w http.ResponseWriter, r *http.Request) {
	if !allowMethods(w, r, http.MethodGet, http.MethodPost) {
		return
	}

	actor, ok := h.actor(w, r, r.Method == http.MethodPost)
	if !ok {
		return
	}

	if r.Method == http.MethodPost {
		if _, ok := closedQuery(w, r); !ok {
			return
		}

		key, ok := requestKey(w, r)
		if !ok {
			return
		}

		var input createMeetingRequest
		if !decodeJSON(w, r, &input) {
			return
		}

		result, err := h.app.Create(r.Context(), actor, meetings.CreateInput{
			Title:       input.Title,
			Description: stringValue(input.Description),
			StartsAt:    input.StartsAt,
			Timezone:    input.Timezone,
			Place:       stringValue(input.Place),
		}, key)
		if err != nil {
			writeMeetingError(w, err)
			return
		}

		writeJSON(w, 201, createdMeetingResponse{meetingDTO(result.Details), "organizer", h.link(result.InvitationToken)})

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

	if values.Has("cursor") && values.Get("cursor") == "" {
		writeError(w, 400, "invalid_query", nil)
		return
	}

	result, err := h.app.List(r.Context(), actor, limit, values.Get("cursor"))
	if err != nil {
		writeMeetingError(w, err)
		return
	}

	response := meetingsPageResponse{
		Meetings:   []meetingSummaryResponse{},
		NextCursor: optionalString(result.NextCursor),
	}
	for _, details := range result.Meetings {
		response.Meetings = append(response.Meetings, summaryDTO(details))
	}

	writeJSON(w, 200, response)
}

type updateMeetingRequest struct {
	Title            json.RawMessage `json:"title"`
	Description      json.RawMessage `json:"description"`
	StartsAt         json.RawMessage `json:"starts_at"`
	Timezone         json.RawMessage `json:"timezone"`
	Place            json.RawMessage `json:"place"`
	ExpectedRevision string          `json:"expected_revision"`
}

func patchField(data json.RawMessage, nullable bool) (meetings.Field, bool) {
	if len(data) == 0 {
		return meetings.Field{}, true
	}

	if string(data) == "null" {
		return meetings.Field{Present: true}, nullable
	}

	var value string
	if json.Unmarshal(data, &value) != nil {
		return meetings.Field{}, false
	}

	return meetings.Field{Present: true, Value: value}, true
}

func parseUpdate(w http.ResponseWriter, input updateMeetingRequest) (meetings.UpdateInput, bool) {
	var result meetings.UpdateInput
	for _, item := range []struct {
		name     string
		data     json.RawMessage
		nullable bool
		target   *meetings.Field
	}{
		{"title", input.Title, false, &result.Title}, {"description", input.Description, true, &result.Description}, {"starts_at", input.StartsAt, false, &result.StartsAt}, {"timezone", input.Timezone, false, &result.Timezone}, {"place", input.Place, true, &result.Place},
	} {
		value, ok := patchField(item.data, item.nullable)
		if !ok {
			writeError(w, 422, "validation_failed", map[string]string{item.name: "invalid"})
			return meetings.UpdateInput{}, false
		}

		*item.target = value
	}

	revision, err := meetings.ParseRevision(input.ExpectedRevision)
	if err != nil {
		writeError(w, 422, "validation_failed", map[string]string{"expected_revision": "invalid"})
		return meetings.UpdateInput{}, false
	}

	result.ExpectedRevision = revision

	return result, true
}

func (h meetingHandlers) details(w http.ResponseWriter, r *http.Request) {
	if !allowMethods(w, r, http.MethodGet, http.MethodPatch) {
		return
	}

	actor, ok := h.actor(w, r, r.Method == http.MethodPatch)
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

	var details meetings.Details
	var err error
	if r.Method == http.MethodPatch {
		key, ok := requestKey(w, r)
		if !ok {
			return
		}

		var input updateMeetingRequest
		if !decodeJSON(w, r, &input) {
			return
		}

		update, ok := parseUpdate(w, input)
		if !ok {
			return
		}

		details, err = h.app.Update(r.Context(), actor, id, update, key)
	} else {
		details, err = h.app.Details(r.Context(), actor, id)
	}

	if err != nil {
		writeMeetingError(w, err)
		return
	}

	writeJSON(w, 200, meetingDTO(details))
}
