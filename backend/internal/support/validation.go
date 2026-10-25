package support

import (
	"encoding/base64"
	"net/mail"
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/etozhenerk/group-planning/backend/internal/imagecontent"
)

func validate(input Input) (Input, *Screenshot, error) {
	input.Description = strings.TrimSpace(input.Description)
	fields := map[string]string{}
	if input.Kind != "problem" && input.Kind != "idea" && input.Kind != "question" {
		fields["kind"] = "invalid"
	}

	switch input.Screen {
	case "meetings", "calendar", "invitation", "meeting_chat", "profile", "memories", "sign_in", "other":
	default:
		fields["screen"] = "invalid"
	}

	length := utf8.RuneCountInString(input.Description)
	if !utf8.ValidString(input.Description) || length < 10 || length > 3000 {
		fields["description"] = "length"
	}

	if input.Email != nil {
		value := strings.TrimSpace(*input.Email)
		input.Email = &value
		parsed, err := mail.ParseAddress(value)
		if value != "" && (len(value) > 320 || err != nil || parsed.Address != value) {
			fields["email"] = "invalid"
		}
	}

	if input.Diagnostics != nil {
		d := input.Diagnostics
		if d.Platform != "web" && d.Platform != "ios" && d.Platform != "android" {
			fields["diagnostics"] = "invalid"
		}

		if !safeLabel(d.ClientVersion, 80) || d.ClientVersion == "" || !safeLabel(d.OS, 120) || !safeLabel(d.Browser, 512) {
			fields["diagnostics"] = "invalid"
		}

		if d.Viewport != nil && (d.Viewport.Width < 1 || d.Viewport.Width > 16000 || d.Viewport.Height < 1 || d.Viewport.Height > 16000) {
			fields["diagnostics"] = "invalid"
		}
	}

	var screenshot *Screenshot
	if input.Screenshot != nil {
		file := input.Screenshot
		if !safeLabel(file.FileName, 255) || file.FileName == "" || strings.ContainsAny(file.FileName, "/\\") {
			fields["screenshot"] = "file_name"
		}

		if len(file.DataBase64) > base64.StdEncoding.EncodedLen(MaxScreenshotBytes) {
			fields["screenshot"] = "too_large"
		} else {
			data, err := base64.StdEncoding.Strict().DecodeString(file.DataBase64)
			if err != nil {
				fields["screenshot"] = "invalid"
			} else {
				normalized, kind, err := imagecontent.Prepare(data, file.ContentType, MaxScreenshotBytes)
				if err != nil {
					fields["screenshot"] = err.Error()
				} else {
					screenshot = &Screenshot{FileName: file.FileName, ContentType: kind, Data: normalized}
				}
			}
		}
	}

	if len(fields) > 0 {
		return Input{}, nil, ValidationError{fields}
	}

	return input, screenshot, nil
}

func safeLabel(value string, maximum int) bool {
	return utf8.ValidString(value) && utf8.RuneCountInString(value) <= maximum && strings.IndexFunc(value, unicode.IsControl) < 0
}
