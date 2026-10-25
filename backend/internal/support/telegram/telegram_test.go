package telegram

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
	"unicode/utf16"

	"github.com/etozhenerk/group-planning/backend/internal/support"
)

type transportFunc func(*http.Request) (*http.Response, error)

func (f transportFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func reply(status int, body string) *http.Response {
	return &http.Response{StatusCode: status, Header: make(http.Header), Body: io.NopCloser(strings.NewReader(body))}
}

func TestFixedEndpointAndPartialAcknowledgement(t *testing.T) {
	client, err := New("123456:abcdefghijklmnopqrstuv", "-100000")
	if err != nil {
		t.Fatal(err)
	}

	messages, files := 0, 0
	client.http.Transport = transportFunc(func(r *http.Request) (*http.Response, error) {
		if r.URL.Scheme != "https" || r.URL.Host != "api.telegram.org" || r.Method != "POST" {
			t.Fatal("unsafe delivery target")
		}

		if strings.HasSuffix(r.URL.Path, "/sendMessage") {
			messages++
			var body map[string]any
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				t.Fatal(err)
			}

			if body["parse_mode"] != nil || body["chat_id"] != "-100000" || !strings.Contains(body["text"].(string), "SW-TEST") {
				t.Fatal("unexpected forwarding content")
			}

			return reply(200, `{"ok":true,"result":{"message_id":7}}`), nil
		}

		files++
		if files == 1 {
			return reply(503, "secret upstream payload"), nil
		}

		if err := r.ParseMultipartForm(6 << 20); err != nil {
			t.Fatal(err)
		}

		defer r.MultipartForm.RemoveAll()
		if r.FormValue("caption") != "SW-TEST" || r.FormValue("chat_id") != "-100000" {
			t.Fatal("wrong screenshot destination")
		}

		return reply(200, `{"ok":true,"result":{"message_id":8}}`), nil
	})
	item := support.Feedback{Reference: "SW-TEST", Kind: "problem", Screen: "other", Description: "Текст <без> HTML", Screenshot: &support.Screenshot{ContentType: "image/png", Data: []byte("normalized image")}}
	progress, err := client.Send(context.Background(), item)
	if err != support.ErrUnavailable || progress.MessageID != 7 || progress.FileMessageID != 0 {
		t.Fatal("lost partial delivery")
	}

	item.Progress = progress
	progress, err = client.Send(context.Background(), item)
	if err != nil || messages != 1 || files != 2 || progress.FileMessageID != 8 {
		t.Fatal("acknowledged message sent twice")
	}
}

func TestDeliveryRejectsRedirectAndOversizedResponse(t *testing.T) {
	for _, response := range []*http.Response{reply(302, ""), reply(200, strings.Repeat("x", 65<<10)), reply(200, `{"ok":false,"description":"secret"}`)} {
		client, _ := New("123456:abcdefghijklmnopqrstuv", "-100000")
		calls := 0
		response.Header.Set("Location", "https://other.invalid/")
		client.http.Transport = transportFunc(func(*http.Request) (*http.Response, error) { calls++; return response, nil })
		_, err := client.Send(context.Background(), support.Feedback{Reference: "SW-X", Description: "Test"})
		if err != support.ErrUnavailable || calls != 1 {
			t.Fatal("unsafe response or redirected credentials")
		}
	}
}

func TestLongUnicodeMessageIsCompleteAndBounded(t *testing.T) {
	description := strings.Repeat("🙂", 3000)
	parts := textParts(support.Feedback{Kind: "problem", Screen: "other", Description: description})
	if len(parts) < 2 {
		t.Fatal("missing bounded chunks")
	}

	for _, part := range parts {
		if len(utf16.Encode([]rune(part))) > 3500 {
			t.Fatal("part too large")
		}
	}

	if !strings.Contains(strings.Join(parts, ""), description) {
		t.Fatal("description truncated")
	}
}
