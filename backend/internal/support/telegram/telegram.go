// Package telegram delivers explicit feedback through the fixed Telegram Bot API.
package telegram

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/support"
)

var (
	tokenPattern = regexp.MustCompile(`^[0-9]+:[A-Za-z0-9_-]{20,}$`)
	chatPattern  = regexp.MustCompile(`^-?[0-9]+$`)
)

// Client never accepts an arbitrary URL or redirects server-only credentials.
type Client struct {
	token, chat string
	http        *http.Client
}

// New validates credentials without connecting to Telegram.
func New(token, chat string) (*Client, error) {
	if !tokenPattern.MatchString(token) || !chatPattern.MatchString(chat) {
		return nil, support.ErrUnavailable
	}

	return &Client{token: token, chat: chat, http: &http.Client{Timeout: 10 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}}, nil
}

// Send resumes acknowledged parts; an ambiguous network failure may duplicate a part.
// Every part includes the stable reference for operator reconciliation.
func (c *Client) Send(ctx context.Context, item support.Feedback) (support.Progress, error) {
	progress := item.Progress
	parts := textParts(item)
	for progress.SentChunks < len(parts) {
		data, err := json.Marshal(map[string]any{"chat_id": c.chat, "text": item.Reference + "\n" + parts[progress.SentChunks], "link_preview_options": map[string]bool{"is_disabled": true}, "protect_content": true})
		if err != nil {
			return progress, support.ErrUnavailable
		}

		id, err := c.call(ctx, "sendMessage", "application/json", bytes.NewReader(data))
		if err != nil {
			return progress, err
		}

		progress.MessageID = id
		progress.SentChunks++
	}

	if item.Screenshot == nil || progress.FileMessageID != 0 {
		return progress, nil
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	for key, value := range map[string]string{"chat_id": c.chat, "caption": item.Reference, "protect_content": "true"} {
		if err := writer.WriteField(key, value); err != nil {
			return progress, support.ErrUnavailable
		}
	}

	extension := "png"
	if item.Screenshot.ContentType == "image/jpeg" {
		extension = "jpg"
	}

	file, err := writer.CreateFormFile("document", item.Reference+"."+extension)
	if err != nil {
		return progress, support.ErrUnavailable
	}

	if _, err := file.Write(item.Screenshot.Data); err != nil {
		return progress, support.ErrUnavailable
	}

	if err := writer.Close(); err != nil {
		return progress, support.ErrUnavailable
	}

	id, err := c.call(ctx, "sendDocument", writer.FormDataContentType(), &body)
	if err != nil {
		return progress, err
	}

	progress.FileMessageID = id

	return progress, nil
}

func (c *Client) call(ctx context.Context, method, contentType string, body io.Reader) (int64, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.telegram.org/bot"+c.token+"/"+method, body)
	if err != nil {
		return 0, support.ErrUnavailable
	}

	request.Header.Set("Content-Type", contentType)
	response, err := c.http.Do(request)
	if err != nil {
		return 0, support.ErrUnavailable
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return 0, support.ErrUnavailable
	}

	data, err := io.ReadAll(io.LimitReader(response.Body, 64<<10+1))
	if err != nil || len(data) > 64<<10 {
		return 0, support.ErrUnavailable
	}

	var result struct {
		OK     bool `json:"ok"`
		Result struct {
			ID int64 `json:"message_id"`
		} `json:"result"`
	}
	if json.Unmarshal(data, &result) != nil || !result.OK || result.Result.ID <= 0 {
		return 0, support.ErrUnavailable
	}

	return result.Result.ID, nil
}

func textParts(item support.Feedback) []string {
	var text strings.Builder
	fmt.Fprintf(&text, "Тема: %s\nЭкран: %s\n", item.Kind, item.Screen)
	if item.Email != "" {
		fmt.Fprintf(&text, "Почта: %s\n", item.Email)
	}

	text.WriteString("\n" + item.Description)
	if item.Diagnostics != nil {
		data, _ := json.Marshal(item.Diagnostics)
		text.WriteString("\n\nСведения об устройстве:\n" + string(data))
	}

	// Count UTF-16 units conservatively and never split a Unicode code point.
	parts := []string{}
	var part strings.Builder
	units := 0
	for _, r := range text.String() {
		size := 1
		if r > 0xffff {
			size = 2
		}

		if units+size > 3500 {
			parts = append(parts, part.String())
			part.Reset()
			units = 0
		}

		part.WriteRune(r)
		units += size
	}

	if part.Len() > 0 {
		parts = append(parts, part.String())
	}

	return parts
}
