package httpapi

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"image"
	"image/color"
	"image/png"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"testing"
)

func httpCover(t *testing.T, tint color.RGBA) map[string]string {
	t.Helper()
	pixels := image.NewRGBA(image.Rect(0, 0, 2, 1))
	pixels.Set(0, 0, tint)
	pixels.Set(1, 0, tint)
	var encoded bytes.Buffer
	if err := png.Encode(&encoded, pixels); err != nil {
		t.Fatal(err)
	}

	return map[string]string{"media_type": "image/png", "data": base64.StdEncoding.EncodeToString(encoded.Bytes())}
}

func readHTTPCover(t *testing.T, client *http.Client, method, address string) []byte {
	t.Helper()
	r, err := http.NewRequest(method, address, nil)
	if err != nil {
		t.Fatal(err)
	}

	response, err := client.Do(r)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	data, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}

	if response.StatusCode != 200 || response.Header.Get("Content-Type") != "image/png" || response.Header.Get("X-Content-Type-Options") != "nosniff" || response.Header.Get("Cache-Control") != "private, no-store" {
		t.Fatalf("wrong photo response: %d %v", response.StatusCode, response.Header)
	}

	if method == "HEAD" {
		if len(data) != 0 || response.ContentLength <= 0 {
			t.Fatal("invalid HEAD")
		}
	} else {
		if response.ContentLength != int64(len(data)) {
			t.Fatal("wrong content length")
		}

		if _, err := png.Decode(bytes.NewReader(data)); err != nil {
			t.Fatal(err)
		}
	}

	return data
}

func TestCoverOpenAPIResponses(t *testing.T) {
	h := newMeetingHTTPTest(t)
	ownerClient, guestClient := h.client(true), h.client(true)
	owner := h.login(ownerClient, "owner", map[string]string{"kind": "home"})
	guest := h.login(guestClient, "guest", map[string]string{"kind": "home"})
	input := map[string]any{"title": "С фото", "starts_on": "2026-12-20", "timezone": "Europe/Moscow", "cover": httpCover(t, color.RGBA{R: 255, A: 255})}
	data, _ := h.request(ownerClient, "POST", "/api/v1/meetings", input, headersFor(h, owner, testKey("3000")), 201)
	created := decodeMeetingTest[createdMeetingResponse](t, data)
	base := "/api/v1/meetings/" + created.Meeting.ID
	if created.Meeting.CoverURL == nil || !strings.HasPrefix(*created.Meeting.CoverURL, h.server.URL+base+"/cover?v=") {
		t.Fatal("missing private cover URL")
	}

	privateURL := *created.Meeting.CoverURL
	privatePath := strings.TrimPrefix(privateURL, h.server.URL)
	invitation, _ := url.Parse(created.InvitationURL)
	invite := "/api/v1/invitations/" + strings.TrimPrefix(invitation.Path, "/i/")
	data, _ = h.request(h.anonymous, "GET", invite, nil, nil, 200)
	preview := decodeMeetingTest[previewResponse](t, data)
	if preview.CoverURL == nil || !strings.HasPrefix(*preview.CoverURL, h.server.URL+invite+"/cover?v=") {
		t.Fatal("missing public photo")
	}

	publicURL := *preview.CoverURL
	original := readHTTPCover(t, ownerClient, "GET", privateURL)
	if !bytes.Equal(original, readHTTPCover(t, h.anonymous, "GET", publicURL)) {
		t.Fatal("public/private photo differ")
	}

	readHTTPCover(t, h.anonymous, "HEAD", publicURL)
	readHTTPCover(t, ownerClient, "HEAD", privateURL)
	h.request(h.anonymous, "GET", privatePath, nil, nil, 401)
	h.request(guestClient, "GET", privatePath, nil, nil, 403)
	h.request(ownerClient, "GET", base+"/cover?v=old", nil, nil, 404)
	h.request(ownerClient, "GET", base+"/cover", nil, nil, 404)
	h.request(ownerClient, "GET", privatePath+"&v=duplicate", nil, nil, 400)
	h.request(ownerClient, "GET", privatePath+"&extra=yes", nil, nil, 400)
	h.request(ownerClient, "POST", privatePath, nil, nil, 405)
	h.request(h.anonymous, "GET", "/api/v1/invitations/invalid/cover?v=x", nil, nil, 404)
	h.request(ownerClient, "GET", "/api/v1/meetings", nil, nil, 200)
	h.request(guestClient, "PUT", invite+"/rsvp", map[string]string{"answer": "going", "expected_revision": "0"}, headersFor(h, guest, testKey("3001")), 200)
	readHTTPCover(t, guestClient, "GET", privateURL)
	patch := map[string]any{"expected_revision": "2", "cover": httpCover(t, color.RGBA{B: 255, A: 255})}
	h.request(guestClient, "PATCH", base, patch, headersFor(h, guest, testKey("3002")), 403)
	h.request(ownerClient, "PATCH", base, patch, nil, 403)
	data, _ = h.request(ownerClient, "PATCH", base, patch, headersFor(h, owner, testKey("3003")), 200)
	updated := decodeMeetingTest[meetingResponse](t, data)
	if updated.CoverURL == nil || *updated.CoverURL == privateURL {
		t.Fatal("replacement URL unchanged")
	}

	if bytes.Equal(original, readHTTPCover(t, ownerClient, "GET", *updated.CoverURL)) {
		t.Fatal("photo not replaced")
	}

	h.request(ownerClient, "GET", privatePath, nil, nil, 404)
	h.request(h.anonymous, "GET", strings.TrimPrefix(publicURL, h.server.URL), nil, nil, 404)
	h.request(guestClient, "PUT", invite+"/rsvp", map[string]string{"answer": "maybe", "expected_revision": "1"}, headersFor(h, guest, testKey("3004")), 200)
	h.request(guestClient, "GET", strings.TrimPrefix(*updated.CoverURL, h.server.URL), nil, nil, 403)
	data, _ = h.request(ownerClient, "PATCH", base, map[string]any{"expected_revision": "4", "cover": nil}, headersFor(h, owner, testKey("3005")), 200)
	if decodeMeetingTest[meetingResponse](t, data).CoverURL != nil {
		t.Fatal("photo not removed")
	}

	for i, bad := range []any{map[string]string{"media_type": "image/png", "data": "https://example.test/x"}, map[string]string{"media_type": "image/svg+xml", "data": "PHN2Zy8+"}, map[string]string{"media_type": "image/png", "data": "", "url": "x"}, "bad"} {
		h.request(ownerClient, "PATCH", base, map[string]any{"expected_revision": "5", "cover": bad}, headersFor(h, owner, testKey(strconv.Itoa(3010+i))), 422)
	}

	h.request(ownerClient, "PATCH", base, map[string]any{"expected_revision": "5", "cover": map[string]string{"media_type": "image/png", "data": strings.Repeat("A", maxCoverBodyBytes)}}, headersFor(h, owner, testKey("3020")), 413)
	h.request(ownerClient, "GET", base+"/feed", nil, nil, 200)
	if output := os.Getenv("SOMEWHERE_CONTRACT_CAPTURE"); output != "" {
		data, err := json.Marshal(h.captures)
		if err != nil {
			t.Fatal(err)
		}

		if err := os.WriteFile(output+".covers", data, 0o600); err != nil {
			t.Fatal(err)
		}
	}
}
