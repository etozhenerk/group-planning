package server

import (
	"strings"
	"testing"
)

func TestLinkAssociationsConfig(t *testing.T) {
	values := map[string]string{
		"SOMEWHERE_IOS_APP_IDS":                      "ABCDEFGHIJ.dev.groupplanning.ios, KLMNOPQRST.dev.groupplanning.ios",
		"SOMEWHERE_ANDROID_APP_ID":                   "dev.groupplanning.android",
		"SOMEWHERE_ANDROID_SHA256_CERT_FINGERPRINTS": strings.TrimSuffix(strings.Repeat("AB:", 32), ":"),
	}
	config, err := LoadConfig(func(key string) string { return values[key] })
	if err != nil || len(config.LinkAssociations.IOSAppIDs) != 2 || config.LinkAssociations.IOSAppIDs[1] != "KLMNOPQRST.dev.groupplanning.ios" || config.LinkAssociations.AndroidPackage != "dev.groupplanning.android" {
		t.Fatal("association configuration not loaded", err)
	}

	delete(values, "SOMEWHERE_ANDROID_APP_ID")
	if _, err := LoadConfig(func(key string) string { return values[key] }); err == nil {
		t.Fatal("partial Android configuration accepted")
	}
}
