package httpapi

import "net/http"

func (h meetingHandlers) feed(w http.ResponseWriter, r *http.Request) {
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

	query, ok := feedQuery(w, r)
	if !ok {
		return
	}

	result, err := h.app.Feed(r.Context(), actor, id, query)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	response := feedPageResponse{
		Entries:          []feedEntryResponse{},
		HasMore:          result.HasMore,
		MeetingRevision:  decimal(result.Details.Meeting.Revision),
		ParticipantCount: result.Details.ParticipantCount,
		MyRSVP:           optionalString(string(result.Details.MyResponse.Answer)),
		MyRSVPRevision:   decimal(result.Details.MyResponse.Revision),
		LatestSequence:   decimal(result.LatestSequence),
	}
	for _, entry := range result.Entries {
		response.Entries = append(response.Entries, entryDTO(entry))
	}

	writeJSON(w, 200, response)
}

type messageRequest struct {
	Text            string `json:"text"`
	ClientRequestID string `json:"client_request_id"`
}

func (h meetingHandlers) message(w http.ResponseWriter, r *http.Request) {
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

	var input messageRequest
	if !decodeJSON(w, r, &input) {
		return
	}

	result, err := h.app.SendMessage(r.Context(), actor, id, input.Text, input.ClientRequestID, key)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	writeJSON(w, 201, entryDTO(result))
}
