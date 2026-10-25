package httpapi

import "net/http"

type savedInvitationResponse struct {
	InvitationURL string          `json:"invitation_url"`
	Preview       previewResponse `json:"preview"`
}

type invitationsPageResponse struct {
	Invitations []savedInvitationResponse `json:"invitations"`
	NextCursor  *string                   `json:"next_cursor"`
}

func (h meetingHandlers) savedInvitations(w http.ResponseWriter, r *http.Request) {
	if !getOnly(w, r) {
		return
	}

	actor, ok := h.actor(w, r, false)
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

	page, err := h.app.SavedInvitations(r.Context(), actor, limit, values.Get("cursor"))
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	result := invitationsPageResponse{
		Invitations: []savedInvitationResponse{}, NextCursor: optionalString(page.NextCursor),
	}
	ids := make([]string, 0, len(page.Invitations))
	for _, invitation := range page.Invitations {
		ids = append(ids, invitation.Preview.OrganizerID)
	}

	users, err := h.identity.Users(r.Context(), ids)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	for _, invitation := range page.Invitations {
		preview := invitation.Preview
		var organizer *userResponse
		if user, exists := users[preview.OrganizerID]; exists {
			value := publicUserDTO(user)
			organizer = &value
		}

		result.Invitations = append(result.Invitations, savedInvitationResponse{
			InvitationURL: h.link(invitation.Token),
			Preview: previewResponse{
				Organizer: organizer,
				MeetingID: preview.MeetingID, Title: preview.Title,
				Description: optionalString(preview.Description),
				StartsOn:    optionalString(preview.StartsOn), StartsAt: preview.StartsAt,
				Timezone: preview.Timezone, Place: optionalString(preview.Place),
				CoverURL:           h.coverURL("invitations/"+invitation.Token, preview.CoverVersion),
				MyRSVP:             optionalString(string(invitation.Response.Answer)),
				MyRSVPRevision:     decimal(invitation.Response.Revision),
				JoinClosesAt:       preview.JoinClosesAt,
				CanJoin:            preview.CanJoin,
				JoinDisabledReason: optionalString(preview.JoinDisabledReason),
			},
		})
	}

	writeJSON(w, 200, result)
}
