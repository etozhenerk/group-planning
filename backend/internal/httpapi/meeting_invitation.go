package httpapi

import (
	"errors"
	"net/http"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (h meetingHandlers) preview(w http.ResponseWriter, r *http.Request) {
	if !getOnly(w, r) {
		return
	}

	if _, ok := closedQuery(w, r); !ok {
		return
	}

	userID := ""
	if h.identity != nil {
		principal, _, err := h.auth.authenticate(r)
		if err == nil {
			userID = principal.User.ID
		} else if !errors.Is(err, identity.ErrUnauthenticated) {
			writeAuthError(w, err)
			return
		}
	}

	preview, response, err := h.app.PreviewForUser(r.Context(), r.PathValue("token"), userID)
	if err != nil {
		writeMeetingError(w, err)
		return
	}

	writeJSON(w, 200, previewResponse{
		MeetingID:      preview.MeetingID,
		Title:          preview.Title,
		StartsAt:       preview.StartsAt,
		Timezone:       preview.Timezone,
		Place:          optionalString(preview.Place),
		MyRSVP:         optionalString(string(response.Answer)),
		MyRSVPRevision: decimal(response.Revision),
	})
}

func (h meetingHandlers) invitation(w http.ResponseWriter, r *http.Request) {
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

	token, err := h.app.Invitation(r.Context(), actor, id)
	if err != nil {
		writeMeetingError(w, err)
		return
	}

	writeJSON(w, 200, struct {
		InvitationURL string `json:"invitation_url"`
	}{h.link(token)})
}

type respondRequest struct {
	Answer           string `json:"answer"`
	ExpectedRevision string `json:"expected_revision"`
}

func (h meetingHandlers) respond(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodPut) {
		return
	}

	actor, ok := h.actor(w, r, true)
	if !ok {
		return
	}

	if _, ok := closedQuery(w, r); !ok {
		return
	}

	id := ""
	token := r.PathValue("token")
	if token == "" {
		id, ok = parseMeetingID(w, r)
		if !ok {
			return
		}
	}

	key, ok := requestKey(w, r)
	if !ok {
		return
	}

	var input respondRequest
	if !decodeJSON(w, r, &input) {
		return
	}

	expected, err := meetings.ParseRevision(input.ExpectedRevision)
	if err != nil {
		writeError(w, 422, "validation_failed", map[string]string{"expected_revision": "invalid"})
		return
	}

	result, err := h.app.Respond(r.Context(), actor, id, token, meetings.Answer(input.Answer), expected, key)
	if err != nil {
		writeMeetingError(w, err)
		return
	}

	writeJSON(w, 200, rsvpDTO(result))
}

func (h meetingHandlers) participants(w http.ResponseWriter, r *http.Request) {
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

	participants, err := h.app.Participants(r.Context(), actor, id)
	if err != nil {
		writeMeetingError(w, err)
		return
	}

	ids := make([]string, 0, len(participants))
	for _, participant := range participants {
		ids = append(ids, participant.UserID)
	}

	users, err := h.identity.Users(r.Context(), ids)
	if err != nil {
		writeMeetingError(w, err)
		return
	}

	result := struct {
		Participants []participantResponse `json:"participants"`
	}{Participants: []participantResponse{}}
	for _, participant := range participants {
		user := users[participant.UserID]
		result.Participants = append(result.Participants, participantResponse{userResponse{user.ID, user.DisplayName}, participant.Role, optionalString(string(participant.Answer)), decimal(participant.Revision)})
	}

	writeJSON(w, 200, result)
}
