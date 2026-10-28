package webui

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestHomeMetadataWithoutSessionOrJavaScript(t *testing.T) {
	site, _, _ := fixture(t, 16, "Private meeting description")
	for _, method := range []string{http.MethodGet, http.MethodHead} {
		response := httptest.NewRecorder()
		site.ServeHTTP(response, httptest.NewRequest(method, "https://untrusted.example/", nil))
		if response.Code != http.StatusOK || response.Header().Get("Content-Type") != "text/html; charset=utf-8" {
			t.Fatal("homepage unavailable", response.Code)
		}

		if method == http.MethodHead {
			if response.Body.Len() != 0 {
				t.Fatal("HEAD returned a body")
			}

			continue
		}

		body := response.Body.String()
		for _, value := range []string{`property="og:title"`, `property="og:description"`, `content="https://somewhere.example/share-card.png"`, `content="https://somewhere.example/"`, `content="1200"`, `content="630"`} {
			if !strings.Contains(body, value) {
				t.Fatalf("missing homepage metadata %q", value)
			}
		}

		if strings.Contains(body, "Private meeting") || strings.Contains(body, "untrusted.example") || strings.Count(body, "<title>") != 1 || strings.Count(body, `name="description"`) != 1 {
			t.Fatal("private, untrusted or duplicate homepage metadata")
		}
	}
}

func TestInvitationMetadataUsesCurrentCoverAndFallback(t *testing.T) {
	site, token, store := fixture(t, 16, "Public description")
	setCover := func(version, mediaType string, width, height int) {
		t.Helper()
		err := store.Update(context.Background(), func(writer meetings.Writer) error {
			meeting, err := writer.Meeting("5cf76452-b7fa-4a5b-b785-1582b58b1d75")
			if err != nil {
				return err
			}

			meeting.CoverVersion = version
			if err := writer.SaveMeeting(meeting); err != nil {
				return err
			}

			if version == "" {
				return writer.DeleteCover(meeting.ID)
			}

			return writer.SaveCover(meetings.Cover{MeetingID: meeting.ID, Version: version, MediaType: mediaType, Width: width, Height: height, Data: []byte("cover")})
		})
		if err != nil {
			t.Fatal(err)
		}
	}
	read := func() string {
		t.Helper()
		response := httptest.NewRecorder()
		site.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "https://host/i/"+token, nil))
		if response.Code != http.StatusOK {
			t.Fatal(response.Code)
		}

		return response.Body.String()
	}
	setCover(strings.Repeat("a", 64), "image/jpeg", 480, 640)
	body := read()
	for _, value := range []string{"https://somewhere.example/api/v1/invitations/" + token + "/cover?v=" + strings.Repeat("a", 64), `content="image/jpeg"`, `content="480"`, `content="640"`} {
		if !strings.Contains(body, value) {
			t.Fatalf("missing cover metadata %q", value)
		}
	}

	setCover(strings.Repeat("b", 64), "image/png", 800, 600)
	body = read()
	if strings.Contains(body, strings.Repeat("a", 64)) || !strings.Contains(body, "cover?v="+strings.Repeat("b", 64)) || !strings.Contains(body, `content="800"`) || !strings.Contains(body, `content="600"`) {
		t.Fatal("cover replacement kept stale image metadata")
	}

	setCover("", "", 0, 0)
	body = read()
	if !strings.Contains(body, "/share-card.png") || strings.Contains(body, "/cover?v=") {
		t.Fatal("removed cover did not restore branded fallback")
	}
}
