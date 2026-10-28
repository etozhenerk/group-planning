package httpapi

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image/color"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/albumexport"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestAlbumExportOpenAPIResponses(t *testing.T) {
	h := newMeetingHTTPTest(t)
	client, guestClient := h.client(true), h.client(true)
	owner := h.login(client, "owner", map[string]string{"kind": "home"})
	guest := h.login(guestClient, "guest", map[string]string{"kind": "home"})
	data, _ := h.request(client, "POST", "/api/v1/meetings", map[string]any{"title": "Альбом", "starts_on": "2099-01-01", "timezone": "UTC"}, headersFor(h, owner, testKey("8000")), 201)
	created := decodeMeetingTest[createdMeetingResponse](t, data)
	id := created.Meeting.ID
	base := "/api/v1/meetings/" + id
	exports := base + "/memories/exports"
	h.request(client, "GET", base+"/memories/snapshot", nil, nil, 409)
	invitation, _ := url.Parse(created.InvitationURL)
	h.request(guestClient, "PUT", "/api/v1/invitations/"+strings.TrimPrefix(invitation.Path, "/i/")+"/rsvp", map[string]string{"answer": "going", "expected_revision": "0"}, headersFor(h, guest, testKey("8001")), 200)
	if err := h.store.Update(t.Context(), func(w meetings.Writer) error {
		meeting, err := w.Meeting(id)
		if err != nil {
			return err
		}

		meeting.Status = meetings.Past

		return w.SaveMeeting(meeting)
	}); err != nil {
		t.Fatal(err)
	}

	h.request(h.anonymous, "GET", base+"/memories/snapshot", nil, nil, 401)
	h.request(client, "GET", base+"/memories/snapshot?limit=1", nil, nil, 400)
	h.request(client, "GET", base+"/memories/snapshot", nil, nil, 200)
	h.request(client, "POST", exports, struct{}{}, headersFor(h, owner, testKey("8002")), 409)
	h.request(client, "POST", exports, struct{}{}, map[string]string{"Origin": h.server.URL, "Idempotency-Key": testKey("8002")}, 403)
	actor := meetings.Actor{ID: owner.User.ID, Name: owner.User.DisplayName}
	originals := seedExportPhotos(t, h, actor, id, 103)
	data, _ = h.request(client, "GET", base+"/memories?limit=100", nil, nil, 200)
	page := decodeMeetingTest[struct {
		Photos []mediaResponse `json:"photos"`
		Next   *string         `json:"next_cursor"`
	}](t, data)
	if len(page.Photos) != 100 || page.Next == nil {
		t.Fatal("fixture must exceed one page")
	}

	data, _ = h.request(client, "GET", base+"/memories/snapshot", nil, nil, 200)
	snapshot := decodeMeetingTest[struct {
		Photos []mediaResponse `json:"photos"`
		Next   *string         `json:"next_cursor"`
	}](t, data)
	if len(snapshot.Photos) != 103 || snapshot.Next != nil {
		t.Fatal("snapshot paginated")
	}

	// Metadata is copied and remains unchanged after later uploads.
	h.request(client, "POST", exports, map[string]string{"unknown": "value"}, headersFor(h, owner, testKey("8002")), 400)
	data, _ = h.request(client, "POST", exports, struct{}{}, headersFor(h, owner, testKey("8002")), 202)
	status := decodeMeetingTest[albumexport.Status](t, data)
	data, _ = h.request(client, "POST", exports, struct{}{}, headersFor(h, owner, testKey("8002")), 202)
	if decodeMeetingTest[albumexport.Status](t, data).ID != status.ID {
		t.Fatal("duplicate HTTP operation")
	}

	h.request(client, "POST", exports, struct{}{}, headersFor(h, owner, testKey("8003")), 429)
	path := exports + "/" + status.ID
	h.request(guestClient, "GET", path, nil, nil, 404)
	h.request(guestClient, "GET", path+"/download", nil, nil, 404)
	h.request(guestClient, "DELETE", path, nil, headersFor(h, guest, ""), 404)
	h.request(h.anonymous, "GET", path+"/download", nil, nil, 401)
	awaitHTTPExport(t, h, client, path)
	response, err := client.Get(h.server.URL + path + "/download")
	if err != nil {
		t.Fatal(err)
	}

	archiveBytes, err := io.ReadAll(response.Body)
	_ = response.Body.Close()
	if err != nil || response.StatusCode != 200 || response.Header.Get("Content-Type") != "application/zip" || !strings.HasPrefix(response.Header.Get("Content-Disposition"), "attachment;") || response.ContentLength != int64(len(archiveBytes)) {
		t.Fatalf("invalid archive response: %v %+v", err, response)
	}

	archive, err := zip.NewReader(bytes.NewReader(archiveBytes), int64(len(archiveBytes)))
	if err != nil || len(archive.File) != 103 {
		t.Fatal("incomplete ZIP", err)
	}

	for index, photo := range snapshot.Photos {
		reader, err := archive.File[index].Open()
		if err != nil {
			t.Fatal(err)
		}

		original, err := io.ReadAll(reader)
		_ = reader.Close()
		if err != nil || !bytes.Equal(original, originals[photo.ID]) {
			t.Fatal("archive transformed original", err)
		}
	}

	encoded, _ := json.Marshal(base64.StdEncoding.EncodeToString(archiveBytes))
	h.captures = append(h.captures, capturedResponse{Path: "/api/v1/meetings/{id}/memories/exports/{export_id}/download", Method: "get", Status: 200, Headers: response.Header, Body: encoded})
	h.request(client, "GET", path, nil, nil, 404)
	data, _ = h.request(client, "POST", exports, struct{}{}, headersFor(h, owner, testKey("8004")), 202)
	path = exports + "/" + decodeMeetingTest[albumexport.Status](t, data).ID
	h.request(client, "DELETE", path, nil, headersFor(h, owner, ""), 204)
	h.request(client, "GET", path+"/download", nil, nil, 404)
	// Access changes invalidate an already prepared export.
	data, _ = h.request(guestClient, "POST", exports, struct{}{}, headersFor(h, guest, testKey("8005")), 202)
	path = exports + "/" + decodeMeetingTest[albumexport.Status](t, data).ID
	awaitHTTPExport(t, h, guestClient, path)
	h.request(guestClient, "PUT", base+"/rsvp", map[string]string{"answer": "not_going", "expected_revision": "1"}, headersFor(h, guest, testKey("8006")), 200)
	h.request(guestClient, "GET", path+"/download", nil, nil, 403)
	// Expiry uses the manager's injectable clock, while auth remains valid.
	data, _ = h.request(client, "POST", exports, struct{}{}, headersFor(h, owner, testKey("8007")), 202)
	path = exports + "/" + decodeMeetingTest[albumexport.Status](t, data).ID
	awaitHTTPExport(t, h, client, path)
	h.clock.Add(601)
	h.request(client, "GET", path, nil, nil, 404)
	data, _ = h.request(client, "POST", exports, struct{}{}, headersFor(h, owner, testKey("8008")), 202)
	path = exports + "/" + decodeMeetingTest[albumexport.Status](t, data).ID
	awaitHTTPExport(t, h, client, path)
	h.request(client, "POST", "/api/v1/auth/logout", nil, headersFor(h, owner, ""), 204)
	h.request(client, "GET", path+"/download", nil, nil, 401)
	h.login(client, "owner", map[string]string{"kind": "home"})
	h.request(client, "GET", path, nil, nil, 404)
	if output := os.Getenv("SOMEWHERE_CONTRACT_CAPTURE"); output != "" {
		data, err := json.Marshal(h.captures)
		if err != nil {
			t.Fatal(err)
		}

		if err := os.WriteFile(output+".album-export", data, 0o600); err != nil {
			t.Fatal(err)
		}
	}
}

func awaitHTTPExport(t *testing.T, h *meetingHTTPTest, client *http.Client, path string) {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		data, _ := h.request(client, "GET", path, nil, nil, 200)
		status := decodeMeetingTest[albumexport.Status](t, data)
		if status.State == "ready" {
			return
		}

		if status.State == "failed" {
			t.Fatal("preparation failed")
		}

		time.Sleep(time.Millisecond)
	}

	t.Fatal("preparation timed out")
}

func seedExportPhotos(t *testing.T, h *meetingHTTPTest, actor meetings.Actor, meeting string, count int) map[string][]byte {
	t.Helper()
	cover := httpCover(t, color.RGBA{R: 200, A: 255})
	photo, err := base64.StdEncoding.DecodeString(cover["data"])
	if err != nil {
		t.Fatal(err)
	}

	result := map[string][]byte{}
	for index := range count {
		key := testKey(fmt.Sprint(9000 + index))
		item, err := h.app.PrepareMedia(t.Context(), actor, meeting, meetings.MediaInput{ClientRequestID: key, FileName: "portrait.png", ContentType: "image/png", SizeBytes: len(photo), Purpose: "memory"}, key)
		if err != nil {
			t.Fatal(err)
		}

		if _, err := h.app.UploadMedia(t.Context(), actor, meeting, item.ID, "image/png", photo); err != nil {
			t.Fatal(err)
		}

		if _, err := h.app.PublishMedia(t.Context(), actor, meeting, item.ID, key); err != nil {
			t.Fatal(err)
		}

		_, content, err := h.app.MediaBytes(context.Background(), actor, meeting, item.ID)
		if err != nil {
			t.Fatal(err)
		}

		result[item.ID] = content
	}

	return result
}
