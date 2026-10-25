package httpapi

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"image/color"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestExperienceOpenAPIResponses(t *testing.T) {
	h := newMeetingHTTPTest(t)
	client := h.client(true)
	owner := h.login(client, "owner", map[string]string{"kind": "home"})
	h.request(h.anonymous, "GET", "/api/v1/me/profile", nil, nil, 401)
	profile, _ := h.request(client, "GET", "/api/v1/me/profile", nil, nil, 200)
	private := decodeMeetingTest[profileResponse](t, profile)
	if private.ID != owner.User.ID || private.Provider != "yandex" || private.Email == nil || *private.Email != "owner@example.test" || private.Phone == nil {
		t.Fatal("wrong private profile")
	}

	data, _ := h.request(client, "POST", "/api/v1/meetings", map[string]any{"title": "Фото прогулки", "starts_on": "2099-01-01", "timezone": "Europe/Moscow"}, headersFor(h, owner, testKey("1600")), 201)
	created := decodeMeetingTest[createdMeetingResponse](t, data)
	base := "/api/v1/meetings/" + created.Meeting.ID
	if bytes.Contains(data, []byte("email")) || bytes.Contains(data, []byte("phone")) {
		t.Fatal("summary leaked contacts")
	}

	if len(created.Meeting.ParticipantPreview) != 1 || created.Meeting.ParticipantPreview[0].ID != owner.User.ID {
		t.Fatal("missing participant preview")
	}

	invitation, _ := url.Parse(created.InvitationURL)
	public, _ := h.request(h.anonymous, "GET", "/api/v1/invitations/"+strings.TrimPrefix(invitation.Path, "/i/"), nil, nil, 200)
	for _, field := range []string{"email", "phone", "participant_preview", "memory_preview"} {
		if bytes.Contains(public, []byte(field)) {
			t.Fatal("public invitation leaked private data")
		}
	}

	h.request(client, "GET", base+"/media/limits", nil, nil, 200)
	cover := httpCover(t, color.RGBA{R: 200, A: 255})
	photo, err := base64.StdEncoding.DecodeString(cover["data"])
	if err != nil {
		t.Fatal(err)
	}

	body := map[string]any{"client_request_id": testKey("1601"), "file_name": "walk.png", "content_type": "image/png", "size_bytes": len(photo), "purpose": "message"}
	data, _ = h.request(client, "POST", base+"/media/uploads", body, headersFor(h, owner, testKey("1601")), 201)
	media := decodeMeetingTest[struct {
		Media mediaResponse `json:"media"`
	}](t, data).Media
	h.request(client, "POST", base+"/media/uploads", body, headersFor(h, owner, testKey("1601")), 201)
	contentPath := base + "/media/" + media.ID + "/content"
	h.request(h.anonymous, "GET", contentPath, nil, nil, 401)
	h.request(client, "GET", contentPath, nil, nil, 404)
	request, err := http.NewRequest("PUT", h.server.URL+contentPath, bytes.NewReader(photo))
	if err != nil {
		t.Fatal(err)
	}

	request.Header.Set("Content-Type", "image/png")
	for name, value := range headersFor(h, owner, "") {
		request.Header.Set(name, value)
	}

	response, err := client.Do(request)
	if err != nil {
		t.Fatal(err)
	}

	uploaded, err := io.ReadAll(response.Body)
	response.Body.Close()
	if err != nil {
		t.Fatal(err)
	}

	if response.StatusCode != 200 {
		t.Fatalf("upload failed: %d %s", response.StatusCode, uploaded)
	}

	h.captures = append(h.captures, capturedResponse{Path: "/api/v1/meetings/{id}/media/{media_id}/content", Method: "put", Status: 200, Headers: response.Header, Body: uploaded})
	published, _ := h.request(client, "POST", base+"/media/"+media.ID+"/publish", struct{}{}, headersFor(h, owner, testKey("1602")), 200)
	value := decodeMeetingTest[struct {
		Media mediaResponse     `json:"media"`
		Entry feedEntryResponse `json:"entry"`
	}](t, published)
	if value.Entry.Kind != "message" || !bytes.Contains(value.Entry.Payload, []byte("attachments")) {
		t.Fatal("old-compatible message attachment missing")
	}

	h.request(client, "POST", base+"/media/"+media.ID+"/publish", struct{}{}, headersFor(h, owner, testKey("1602")), 200)
	raw, err := client.Get(h.server.URL + contentPath)
	if err != nil {
		t.Fatal(err)
	}

	download, err := io.ReadAll(raw.Body)
	raw.Body.Close()
	if err != nil || raw.StatusCode != 200 || raw.Header.Get("Cache-Control") != "no-store" || len(download) == 0 || raw.Header.Get("X-Content-Type-Options") != "nosniff" {
		t.Fatal("unsafe or absent private bytes")
	}

	h.request(client, "GET", base+"/feed", nil, nil, 200)
	checkDocumentCaptionHTTP(t, h, client, owner, base)
	h.request(client, "PUT", base+"/messages/"+value.Entry.ID+"/reactions", map[string]any{"emoji": "❤️", "active": true}, headersFor(h, owner, testKey("1603")), 200)
	h.request(client, "GET", base+"/reactions?entry_id="+value.Entry.ID, nil, nil, 200)
	h.request(client, "GET", base+"/memories", nil, nil, 409)
	if err := h.store.Update(context.Background(), func(w meetings.Writer) error {
		m, err := w.Meeting(created.Meeting.ID)
		if err != nil {
			return err
		}

		m.Status = meetings.Past

		return w.SaveMeeting(m)
	}); err != nil {
		t.Fatal(err)
	}

	h.request(client, "GET", base+"/memories", nil, nil, 200)
	h.request(client, "GET", base, nil, nil, 200)
	closedStart := time.Unix(h.clock.Load(), 0).Add(30 * time.Minute).UTC()
	closedData, _ := h.request(client, "POST", "/api/v1/meetings", map[string]any{"title": "Скоро начнём", "starts_at": closedStart.Format(time.RFC3339), "timezone": "UTC"}, headersFor(h, owner, testKey("1610")), 201)
	closed := decodeMeetingTest[createdMeetingResponse](t, closedData)
	closedURL, _ := url.Parse(closed.InvitationURL)
	closedPath := "/api/v1/invitations/" + strings.TrimPrefix(closedURL.Path, "/i/")
	closedPreview, _ := h.request(h.anonymous, "GET", closedPath, nil, nil, 200)
	if decodeMeetingTest[previewResponse](t, closedPreview).CanJoin {
		t.Fatal("late invitation stayed open")
	}

	guestClient := h.client(true)
	guest := h.login(guestClient, "guest", map[string]string{"kind": "home"})
	rejected, _ := h.request(guestClient, "PUT", closedPath+"/rsvp", map[string]string{"answer": "going", "expected_revision": "0"}, headersFor(h, guest, testKey("1611")), 409)
	if !bytes.Contains(rejected, []byte("join_closed")) {
		t.Fatal("missing compatible cutoff reason")
	}

	if output := os.Getenv("SOMEWHERE_CONTRACT_CAPTURE"); output != "" {
		encoded, err := json.Marshal(h.captures)
		if err != nil {
			t.Fatal(err)
		}

		if err := os.WriteFile(output+".experience", encoded, 0o600); err != nil {
			t.Fatal(err)
		}
	}
}
