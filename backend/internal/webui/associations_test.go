package webui

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestAssociatedDomainsDocuments(t *testing.T) {
	fingerprint := strings.TrimSuffix(strings.Repeat("AB:", 32), ":")
	handler, err := NewAssociations(LinkAssociations{
		IOSAppIDs:           []string{"ABCDEFGHIJ.dev.groupplanning.ios"},
		AndroidPackage:      "dev.groupplanning.android",
		AndroidFingerprints: []string{strings.ToLower(fingerprint)},
	})
	if err != nil {
		t.Fatal(err)
	}

	for _, name := range []string{"apple-app-site-association", "assetlinks.json"} {
		path := "/.well-known/" + name
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, path, nil))
		if response.Code != http.StatusOK || response.Header().Get("Content-Type") != "application/json" || response.Header().Get("Location") != "" || response.Header().Get("Set-Cookie") != "" {
			t.Fatalf("association must be public JSON without redirects: %d %v", response.Code, response.Header())
		}

		if !json.Valid(response.Body.Bytes()) || strings.Contains(response.Body.String(), "/api/") {
			t.Fatal("invalid JSON or OAuth callback claimed")
		}

		if name == "apple-app-site-association" {
			var document struct {
				Applinks struct {
					Details []struct {
						AppIDs     []string            `json:"appIDs"`
						Components []map[string]string `json:"components"`
					} `json:"details"`
				} `json:"applinks"`
			}
			if err := json.Unmarshal(response.Body.Bytes(), &document); err != nil {
				t.Fatal(err)
			}

			if len(document.Applinks.Details) != 1 {
				t.Fatal("missing association")
			}

			details := document.Applinks.Details[0]
			if len(details.AppIDs) != 1 || details.AppIDs[0] != "ABCDEFGHIJ.dev.groupplanning.ios" || len(details.Components) != 2 || details.Components[0]["/"] != "/i/*" || details.Components[1]["/"] != "/invitations/*" {
				t.Fatalf("unexpected iOS association: %+v", details)
			}
		} else {
			var statements []struct {
				Relation []string `json:"relation"`
				Target   struct {
					Namespace    string   `json:"namespace"`
					Package      string   `json:"package_name"`
					Fingerprints []string `json:"sha256_cert_fingerprints"`
				} `json:"target"`
			}
			if err := json.Unmarshal(response.Body.Bytes(), &statements); err != nil {
				t.Fatal(err)
			}

			if len(statements) != 1 || len(statements[0].Relation) != 1 || statements[0].Relation[0] != "delegate_permission/common.handle_all_urls" || statements[0].Target.Namespace != "android_app" || statements[0].Target.Package != "dev.groupplanning.android" || len(statements[0].Target.Fingerprints) != 1 || statements[0].Target.Fingerprints[0] != fingerprint {
				t.Fatalf("unexpected Android association: %+v", statements)
			}
		}

		head := httptest.NewRecorder()
		handler.ServeHTTP(head, httptest.NewRequest(http.MethodHead, path, nil))
		if head.Code != http.StatusOK || head.Body.Len() != 0 || head.Header().Get("Content-Length") != response.Header().Get("Content-Length") {
			t.Fatal("invalid HEAD response")
		}
	}
}

func TestAssociatedDomainsRejectInvalidConfiguration(t *testing.T) {
	fingerprint := strings.TrimSuffix(strings.Repeat("AB:", 32), ":")
	for _, config := range []LinkAssociations{
		{IOSAppIDs: []string{"dev.groupplanning.ios"}},
		{IOSAppIDs: []string{"ABCDEFGHIJ.*"}},
		{IOSAppIDs: []string{"ABCDEFGHIJ.dev.groupplanning.ios", ""}},
		{AndroidPackage: "dev.groupplanning.android"},
		{AndroidFingerprints: []string{fingerprint}},
		{AndroidPackage: "*", AndroidFingerprints: []string{fingerprint}},
		{AndroidPackage: "dev.groupplanning.android", AndroidFingerprints: []string{"AB:CD"}},
	} {
		if _, err := NewAssociations(config); err == nil {
			t.Fatal("invalid signing metadata accepted")
		}
	}
}

func TestUnconfiguredAssociationDoesNotServeSPA(t *testing.T) {
	handler, err := NewAssociations(LinkAssociations{})
	if err != nil {
		t.Fatal(err)
	}

	for _, path := range []string{"/.well-known/apple-app-site-association", "/.well-known/assetlinks.json", "/.well-known/unknown"} {
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, path, nil))
		if response.Code != http.StatusNotFound {
			t.Fatalf("unconfigured document: %d", response.Code)
		}
	}

	response := httptest.NewRecorder()
	handler.ServeHTTP(response, httptest.NewRequest(http.MethodPost, "/.well-known/assetlinks.json", nil))
	if response.Code != http.StatusMethodNotAllowed || response.Header().Get("Allow") != "GET, HEAD" {
		t.Fatal("write method accepted")
	}
}
