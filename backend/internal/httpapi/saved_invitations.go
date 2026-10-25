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
	for _, invitation := range page.Invitations {
		preview := invitation.Preview
		result.Invitations = append(result.Invitations, savedInvitationResponse{
			InvitationURL: h.link(invitation.Token),
			Preview: previewResponse{
				MeetingID: preview.MeetingID, Title: preview.Title,
				Description: optionalString(preview.Description),
				StartsOn:    optionalString(preview.StartsOn), StartsAt: preview.StartsAt,
				Timezone: preview.Timezone, Place: optionalString(preview.Place),
				CoverURL:       h.coverURL("invitations/"+invitation.Token, preview.CoverVersion),
				MyRSVP:         optionalString(string(invitation.Response.Answer)),
				MyRSVPRevision: decimal(invitation.Response.Revision),
			},
		})
	}

	writeJSON(w, 200, result)
}
