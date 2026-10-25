package httpapi

import "net/http"

type profileResponse struct {
	ID          string  `json:"id"`
	DisplayName string  `json:"display_name"`
	AvatarURL   *string `json:"avatar_url"`
	Email       *string `json:"email"`
	Phone       *string `json:"phone"`
	Provider    string  `json:"provider"`
	Login       *string `json:"login"`
	FirstName   *string `json:"first_name"`
	LastName    *string `json:"last_name"`
	Birthday    *string `json:"birthday"`
	Sex         *string `json:"sex"`
}

func (h authHandlers) profile(w http.ResponseWriter, r *http.Request) {
	if !getOnly(w, r) {
		return
	}

	if _, ok := closedQuery(w, r); !ok {
		return
	}

	principal, _, err := h.authenticate(r)
	if err != nil {
		writeAuthError(w, err)
		return
	}

	user := principal.User
	writeJSON(w, http.StatusOK, profileResponse{
		ID: user.ID, DisplayName: user.DisplayName, AvatarURL: optionalString(user.AvatarURL),
		Email: optionalString(user.Email), Phone: optionalString(user.Phone), Provider: "yandex",
		Login: optionalString(user.Login), FirstName: optionalString(user.FirstName), LastName: optionalString(user.LastName),
		Birthday: optionalString(user.Birthday), Sex: optionalString(user.Sex),
	})
}
