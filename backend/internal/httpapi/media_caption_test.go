package httpapi

import (
	"bytes"
	"io"
	"net/http"
	"strings"
	"testing"
)

func checkDocumentCaptionHTTP(t *testing.T, h *meetingHTTPTest, client *http.Client, owner meResponse, base string) {
	t.Helper()
	content := []byte("Rules for Friday")
	data, _ := h.request(client, "POST", base+"/media/uploads", map[string]any{
		"client_request_id": testKey("1650"), "file_name": "rules.txt", "content_type": "text/plain",
		"size_bytes": len(content), "purpose": "message",
	}, headersFor(h, owner, testKey("1650")), 201)
	item := decodeMeetingTest[struct {
		Media mediaResponse `json:"media"`
	}](t, data).Media
	path := base + "/media/" + item.ID
	request, err := http.NewRequest("PUT", h.server.URL+path+"/content", bytes.NewReader(content))
	if err != nil {
		t.Fatal(err)
	}

	request.Header.Set("Content-Type", "text/plain")
	for name, value := range headersFor(h, owner, "") {
		request.Header.Set(name, value)
	}

	response, err := client.Do(request)
	if err != nil {
		t.Fatal(err)
	}

	uploaded, err := io.ReadAll(response.Body)
	response.Body.Close()
	if err != nil || response.StatusCode != 200 {
		t.Fatal("document upload failed", response.StatusCode, err)
	}

	h.captures = append(h.captures, capturedResponse{Path: "/api/v1/meetings/{id}/media/{media_id}/content", Method: "put", Status: 200, Headers: response.Header, Body: uploaded})
	key := headersFor(h, owner, testKey("1651"))
	h.request(client, "POST", path+"/publish", map[string]any{"caption": strings.Repeat("я", 2001)}, key, 422)
	h.request(client, "POST", path+"/publish", map[string]any{"caption": nil}, key, 422)
	h.request(client, "POST", path+"/publish", map[string]any{"caption": "Правила", "unknown": true}, key, 400)
	caption := strings.Repeat("я", 2000)
	first, _ := h.request(client, "POST", path+"/publish", map[string]any{"caption": caption}, key, 200)
	second, _ := h.request(client, "POST", path+"/publish", map[string]any{"caption": "  " + caption + "  "}, key, 200)
	if !bytes.Equal(first, second) || !bytes.Contains(first, []byte(caption)) || !bytes.Contains(first, []byte("rules.txt")) {
		t.Fatal("caption retry changed its entry or lost the file")
	}

	h.request(client, "POST", path+"/publish", map[string]any{"caption": "Другая"}, key, 409)
	h.request(client, "POST", path+"/publish", map[string]any{"caption": "Другая"}, headersFor(h, owner, testKey("1652")), 409)
	h.request(client, "GET", base+"/feed", nil, nil, 200)
}
