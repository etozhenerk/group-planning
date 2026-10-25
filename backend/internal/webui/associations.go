package webui

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
)

// LinkAssociations contains public signing metadata, never signing keys.
type LinkAssociations struct {
	IOSAppIDs           []string
	AndroidPackage      string
	AndroidFingerprints []string
}

// NewAssociations serves only explicitly configured platform associations.
func NewAssociations(config LinkAssociations) (http.Handler, error) {
	iosID := regexp.MustCompile(`^[A-Z0-9]{10}\.(?:[A-Za-z0-9-]+\.)+[A-Za-z0-9-]+$`)
	androidID := regexp.MustCompile(`^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$`)
	fingerprint := regexp.MustCompile(`^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$`)
	if len(config.IOSAppIDs) > 16 || len(config.AndroidFingerprints) > 16 {
		return nil, fmt.Errorf("too many mobile link associations")
	}

	for _, id := range config.IOSAppIDs {
		if !iosID.MatchString(id) {
			return nil, fmt.Errorf("invalid iOS application identifier for associated domains")
		}
	}

	if (config.AndroidPackage == "") != (len(config.AndroidFingerprints) == 0) {
		return nil, fmt.Errorf("Android link package and fingerprints must be configured together")
	}

	if config.AndroidPackage != "" && !androidID.MatchString(config.AndroidPackage) {
		return nil, fmt.Errorf("invalid Android application identifier for associated domains")
	}

	fingerprints := make([]string, len(config.AndroidFingerprints))
	for index, value := range config.AndroidFingerprints {
		fingerprints[index] = strings.ToUpper(value)
		if !fingerprint.MatchString(fingerprints[index]) {
			return nil, fmt.Errorf("invalid Android SHA-256 signing fingerprint")
		}
	}

	documents := map[string][]byte{}
	if len(config.IOSAppIDs) != 0 {
		data, err := json.Marshal(map[string]any{"applinks": map[string]any{"details": []any{
			map[string]any{"appIDs": config.IOSAppIDs, "components": []any{
				map[string]string{"/": "/i/*"}, map[string]string{"/": "/invitations/*"},
			}},
		}}})
		if err != nil {
			return nil, err
		}

		documents["/.well-known/apple-app-site-association"] = data
	}

	if config.AndroidPackage != "" {
		data, err := json.Marshal([]any{map[string]any{
			"relation": []string{"delegate_permission/common.handle_all_urls"},
			"target": map[string]any{
				"namespace": "android_app", "package_name": config.AndroidPackage,
				"sha256_cert_fingerprints": fingerprints,
			},
		}})
		if err != nil {
			return nil, err
		}

		documents["/.well-known/assetlinks.json"] = data
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Cache-Control", "no-store")
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.Header().Set("Allow", "GET, HEAD")
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)

			return
		}

		data, exists := documents[r.URL.Path]
		if !exists || r.URL.RawPath != "" {
			http.NotFound(w, r)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "public, max-age=300")
		w.Header().Set("Content-Length", strconv.Itoa(len(data)))
		w.WriteHeader(http.StatusOK)
		if r.Method == http.MethodGet {
			_, _ = w.Write(data)
		}
	}), nil
}
