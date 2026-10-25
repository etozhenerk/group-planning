package yandex

import (
	"net/mail"
	"regexp"
	"strings"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

var (
	avatarIDPattern = regexp.MustCompile(`^[a-zA-Z0-9_-]+(/[a-zA-Z0-9_-]+)?$`)
	phonePattern    = regexp.MustCompile(`^\+?[0-9]{5,20}$`)
)

type providerProfile struct {
	ID          string  `json:"id"`
	ClientID    string  `json:"client_id"`
	DisplayName string  `json:"display_name"`
	RealName    string  `json:"real_name"`
	Login       string  `json:"login"`
	AvatarID    *string `json:"default_avatar_id"`
	AvatarEmpty *bool   `json:"is_avatar_empty"`
	Email       *string `json:"default_email"`
	Phone       *struct {
		Number string `json:"number"`
	} `json:"default_phone"`
}

func (p providerProfile) optionalFields(result identity.Profile) identity.Profile {
	if p.AvatarEmpty != nil && *p.AvatarEmpty {
		empty := ""
		result.AvatarURL = &empty
	} else if p.AvatarID != nil && len(*p.AvatarID) <= 256 && avatarIDPattern.MatchString(*p.AvatarID) {
		avatar := "https://avatars.yandex.net/get-yapic/" + *p.AvatarID + "/islands-200"
		result.AvatarURL = &avatar
	}

	if p.Email != nil {
		email := strings.TrimSpace(*p.Email)
		address, err := mail.ParseAddress(email)
		if email == "" || (err == nil && address.Address == email && len(email) <= 320) {
			result.Email = &email
		}
	}

	if p.Phone != nil {
		phone := strings.TrimSpace(p.Phone.Number)
		if phone == "" || phonePattern.MatchString(phone) {
			result.Phone = &phone
		}
	}

	return result
}
