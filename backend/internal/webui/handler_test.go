package webui

import (
	"bytes"
	"context"
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func fixture(t *testing.T, size int, description string) (http.Handler, string, *memory.Store) {
	t.Helper()
	directory := t.TempDir()
	index := `<!doctype html><html><head><meta name="description" content="default"><title>Default</title></head><body><div id="root"></div><script src="/assets/app.js"></script></body></html>`
	if err := os.WriteFile(filepath.Join(directory, "index.html"), []byte(index), 0o600); err != nil {
		t.Fatal(err)
	}

	store := memory.New()
	token := base64.RawURLEncoding.EncodeToString(bytes.Repeat([]byte{7}, size))
	instant := time.Date(2026, 10, 24, 16, 0, 0, 0, time.UTC)
	err := store.Update(context.Background(), func(writer meetings.Writer) error {
		if err := writer.SaveMeeting(meetings.Meeting{ID: "5cf76452-b7fa-4a5b-b785-1582b58b1d75", Title: `Игры "дома" <script>bad()</script>`, Description: description, StartsAt: &instant, Timezone: "Europe/Moscow", Place: "Кафе", OrganizerID: "private-organizer"}); err != nil {
			return err
		}

		return writer.InsertInvitation(meetings.Invitation{ID: "invite", MeetingID: "5cf76452-b7fa-4a5b-b785-1582b58b1d75", Token: token})
	})
	if err != nil {
		t.Fatal(err)
	}

	site, err := New(store, directory, "https://somewhere.example")
	if err != nil {
		t.Fatal(err)
	}

	return site, token, store
}

func TestInvitationMetadataWithoutJavaScript(t *testing.T) {
	for _, size := range []int{16, 32} {
		t.Run(strconv.Itoa(size*8)+"bit", func(t *testing.T) {
			site, token, _ := fixture(t, size, `Пицца & игры "до ночи" <script>bad()</script>`)
			response := httptest.NewRecorder()
			request := httptest.NewRequest(http.MethodGet, "https://attacker.example/i/"+token, nil)
			site.ServeHTTP(response, request)
			body := response.Body.String()
			if response.Code != 200 {
				t.Fatal(response.Code)
			}

			for _, value := range []string{`property="og:title"`, `property="og:description"`, `https://somewhere.example/i/` + token, `https://somewhere.example/share-card.png`, `content="1200"`, `content="630"`, `&lt;script&gt;`, "Пицца &amp; игры"} {
				if !strings.Contains(body, value) {
					t.Fatalf("missing %q", value)
				}
			}

			for _, value := range []string{"attacker.example", "private-organizer", `<script>bad()`, `content="default"`, `<title>Default`} {
				if strings.Contains(body, value) {
					t.Fatalf("unexpected %q", value)
				}
			}

			if strings.Count(body, "<title>") != 1 || strings.Count(body, `name="description"`) != 1 {
				t.Fatal("duplicate metadata")
			}

			if response.Header().Get("Cache-Control") != "no-store" || response.Header().Get("X-Robots-Tag") != "noindex, nofollow" {
				t.Fatal("missing headers")
			}

			head := httptest.NewRecorder()
			site.ServeHTTP(head, httptest.NewRequest(http.MethodHead, "https://host/i/"+token, nil))
			if head.Code != 200 || head.Body.Len() != 0 || head.Header().Get("Content-Length") != response.Header().Get("Content-Length") {
				t.Fatal("HEAD mismatch")
			}
		})
	}
}

func TestLegacyInvalidAndFallback(t *testing.T) {
	site, token, _ := fixture(t, 32, "")
	legacy := httptest.NewRecorder()
	site.ServeHTTP(legacy, httptest.NewRequest(http.MethodGet, "https://host/invitations/"+token+"?auth_error=cancelled", nil))
	if legacy.Code != 308 || legacy.Header().Get("Location") != "/i/"+token+"?auth_error=cancelled" {
		t.Fatal("legacy path failed")
	}

	response := httptest.NewRecorder()
	site.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "https://host/i/"+token, nil))
	if !strings.Contains(response.Body.String(), "24.10.2026 в 19:00 · Кафе") {
		t.Fatal("fallback is not local meeting time")
	}

	for _, address := range []string{"/i/invalid", "/i/" + base64.RawURLEncoding.EncodeToString(make([]byte, 16)), "/i/" + token + "/extra"} {
		result := httptest.NewRecorder()
		site.ServeHTTP(result, httptest.NewRequest(http.MethodGet, "https://host"+address, nil))
		if result.Code != 404 || strings.Contains(result.Body.String(), "Игры") || strings.Contains(result.Body.String(), `property="og:title"`) {
			t.Fatal("invalid invitation exposed metadata")
		}
	}
}

func TestInvalidWebConfiguration(t *testing.T) {
	directory := t.TempDir()
	if _, err := New(memory.New(), directory, "https://somewhere.example"); err == nil {
		t.Fatal("accepted missing bundle")
	}

	if err := os.WriteFile(filepath.Join(directory, "index.html"), []byte("<head></head>"), 0o600); err != nil {
		t.Fatal(err)
	}

	for _, origin := range []string{"http://host", "https://host/", "https://host#", "https://host?", "https://user:password@host", "https://host/path"} {
		if _, err := New(memory.New(), directory, origin); err == nil {
			t.Fatal("accepted invalid origin", origin)
		}
	}
}

func TestMetadataReflectsMeetingChanges(t *testing.T) {
	site, token, store := fixture(t, 16, "Первое описание")
	request := func() string {
		response := httptest.NewRecorder()
		site.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "https://host/i/"+token, nil))

		return response.Body.String()
	}
	if !strings.Contains(request(), "Первое описание") {
		t.Fatal("initial description missing")
	}

	err := store.Update(context.Background(), func(writer meetings.Writer) error {
		meeting, err := writer.Meeting("5cf76452-b7fa-4a5b-b785-1582b58b1d75")
		if err != nil {
			return err
		}

		meeting.Description = "Новое описание"

		return writer.SaveMeeting(meeting)
	})
	if err != nil {
		t.Fatal(err)
	}

	body := request()
	if !strings.Contains(body, "Новое описание") || strings.Contains(body, "Первое описание") {
		t.Fatal("stale metadata")
	}
}
