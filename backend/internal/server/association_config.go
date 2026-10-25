package server

import (
	"strings"

	"github.com/etozhenerk/group-planning/backend/internal/webui"
)

func loadLinkAssociations(getenv func(string) string) (webui.LinkAssociations, error) {
	config := webui.LinkAssociations{
		IOSAppIDs:           associationList(getenv("SOMEWHERE_IOS_APP_IDS")),
		AndroidPackage:      getenv("SOMEWHERE_ANDROID_APP_ID"),
		AndroidFingerprints: associationList(getenv("SOMEWHERE_ANDROID_SHA256_CERT_FINGERPRINTS")),
	}
	_, err := webui.NewAssociations(config)

	return config, err
}

func associationList(value string) []string {
	if value == "" {
		return nil
	}

	values := strings.Split(value, ",")
	for index := range values {
		values[index] = strings.TrimSpace(values[index])
	}

	return values
}
