package yandex

import (
	"encoding/json"
	"net/mail"
	"regexp"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

var (
	avatarIDPattern = regexp.MustCompile(`^[a-zA-Z0-9_-]+(/[a-zA-Z0-9_-]+)?$`)
	phonePattern    = regexp.MustCompile(`^\+?[0-9]{5,20}$`)
)

type providerProfile struct {
	ID          string          `json:"id"`
	ClientID    string          `json:"client_id"`
	DisplayName string          `json:"display_name"`
	RealName    string          `json:"real_name"`
	Login       profileText     `json:"login"`
	FirstName   profileText     `json:"first_name"`
	LastName    profileText     `json:"last_name"`
	Birthday    profileText     `json:"birthday"`
	Sex         profileText     `json:"sex"`
	AvatarID    *string         `json:"default_avatar_id"`
	AvatarEmpty *bool           `json:"is_avatar_empty"`
	Email       profileText     `json:"default_email"`
	Phone       json.RawMessage `json:"default_phone"`
}

func (p providerProfile) optionalFields(result identity.Profile) identity.Profile {
	if p.AvatarEmpty != nil && *p.AvatarEmpty {
		empty := ""
		result.AvatarURL = &empty
	} else if p.AvatarID != nil && len(*p.AvatarID) <= 256 && avatarIDPattern.MatchString(*p.AvatarID) {
		avatar := "https://avatars.yandex.net/get-yapic/" + *p.AvatarID + "/islands-200"
		result.AvatarURL = &avatar
	}

	result.Email = p.Email.pointer(func(email string) bool {
		address, err := mail.ParseAddress(email)
		return email == "" || (err == nil && address.Address == email && len(email) <= 320)
	})
	result.Phone = profilePhone(p.Phone)
	result.Login = p.Login.pointer(validProfileName)

	result.FirstName = p.FirstName.pointer(validProfileName)
	result.LastName = p.LastName.pointer(validProfileName)
	result.Birthday = p.Birthday.pointer(validBirthday)
	result.Sex = p.Sex.pointer(func(value string) bool { return value == "" || value == "male" || value == "female" })
	if result.Birthday != nil && *result.Birthday == "0000-00-00" {
		*result.Birthday = ""
	}

	return result
}

func profilePhone(data json.RawMessage) *string {
	if string(data) == "null" {
		return new("")
	}

	var phone struct {
		Number profileText `json:"number"`
	}
	if json.Unmarshal(data, &phone) != nil {
		return nil
	}

	return phone.Number.pointer(func(value string) bool { return value == "" || phonePattern.MatchString(value) })
}
