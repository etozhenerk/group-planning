package httpapi

import (
	"net/http"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

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

	var result meetings.FeedPage
	var around *meetings.FeedRange
	var err error
	if query.AroundEntryID != "" {
		value, readErr := h.app.FeedAround(r.Context(), actor, id, query.AroundEntryID, query.Limit)
		result = meetings.FeedPage{Entries: value.Entries, Details: value.Details, LatestSequence: value.LatestSequence, HasMore: value.HasOlder || value.HasNewer}
		around, err = &value, readErr
	} else {
		result, err = h.app.Feed(r.Context(), actor, id, query)
	}

	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	ids := []string{}
	seen := map[string]bool{}
	for _, entry := range result.Entries {
		if !seen[entry.ActorID] {
			ids = append(ids, entry.ActorID)
			seen[entry.ActorID] = true
		}

		for _, item := range entry.Attachments {
			if !seen[item.UploadedBy.ID] {
				ids = append(ids, item.UploadedBy.ID)
				seen[item.UploadedBy.ID] = true
			}
		}
	}

	users, err := h.identity.Users(r.Context(), ids)
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
		response.Entries = append(response.Entries, entryDTO(entry, users))
	}

	if around != nil {
		writeJSON(w, 200, struct {
			feedPageResponse
			Range    chatRangeResponse `json:"range"`
			HasOlder bool              `json:"has_older"`
			HasNewer bool              `json:"has_newer"`
		}{response, feedRangeDTO(around.Entries), around.HasOlder, around.HasNewer})

		return
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
