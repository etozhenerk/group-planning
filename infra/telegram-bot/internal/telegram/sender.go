// Package telegram sends bounded technical notifications without exposing tokens.
package telegram

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"regexp"
	"time"
)

// Sender sends only to its configured chat. HTTP and Sleep are test seams.
type Sender struct {
	Token  string
	ChatID string
	HTTP   *http.Client
	Sleep  func(context.Context, time.Duration) error
}

// NewSender validates the token's transport shape and rejects HTTP redirects.
func NewSender(token, chatID string) (*Sender, error) {
	if !regexp.MustCompile(`^[0-9]+:[A-Za-z0-9_-]{20,200}$`).MatchString(token) {
		return nil, errors.New("telegram token invalid")
	}

	return &Sender{Token: token, ChatID: chatID, HTTP: &http.Client{Timeout: 6 * time.Second, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}, Sleep: sleep}, nil
}

// Send retries at most twice; long RetryAfter is returned for bounded async retry.
func (s *Sender) Send(ctx context.Context, text, panelURL string, png []byte) error {
	body, contentType, method, err := encode(s.ChatID, text, panelURL, png)
	if err != nil {
		return err
	}

	for attempt := 0; attempt < 3; attempt++ {
		if ctx.Err() != nil {
			return errors.New("telegram deadline exceeded")
		}

		retry, delay, sendErr := s.attempt(ctx, method, contentType, body)
		if sendErr == nil {
			return nil
		}

		if !retry || attempt == 2 {
			return sendErr
		}

		if delay == 0 {
			delay = time.Duration(attempt+1) * time.Second
		}

		if delay > 5*time.Second {
			return errors.New("telegram retry_after exceeds local budget")
		}

		if err = s.Sleep(ctx, delay); err != nil {
			return errors.New("telegram retry cancelled")
		}
	}

	return errors.New("telegram attempts exhausted")
}

func (s *Sender) attempt(ctx context.Context, method, contentType string, body []byte) (bool, time.Duration, error) {
	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.telegram.org/bot"+s.Token+"/"+method, bytes.NewReader(body))
	if err != nil {
		return false, 0, errors.New("telegram request invalid")
	}

	req.Header.Set("Content-Type", contentType)
	response, err := s.HTTP.Do(req)
	if err != nil {
		return true, 0, errors.New("telegram transport failed")
	}
	defer response.Body.Close()
	data, err := io.ReadAll(io.LimitReader(response.Body, 32769))
	if err != nil || len(data) > 32768 {
		return false, 0, errors.New("telegram response unavailable or too large")
	}

	var result struct {
		OK         bool `json:"ok"`
		Code       int  `json:"error_code"`
		Parameters struct {
			RetryAfter int `json:"retry_after"`
		} `json:"parameters"`
	}
	decodeErr := json.Unmarshal(data, &result)
	if response.StatusCode == 200 && decodeErr == nil && result.OK {
		return false, 0, nil
	}

	code := response.StatusCode
	if result.Code != 0 {
		code = result.Code
	}

	if code == 429 {
		delay := result.Parameters.RetryAfter
		if decodeErr != nil || delay < 1 || delay > 5 {
			return false, 0, errors.New("telegram rate limited; deferred retry required")
		}

		return true, time.Duration(delay) * time.Second, errors.New("telegram rate limited")
	}

	return code >= 500 && code <= 599, 0, fmt.Errorf("telegram delivery failed (HTTP/API %d)", code)
}

func encode(chat, text, panel string, png []byte) ([]byte, string, string, error) {
	markup := map[string]any{"inline_keyboard": [][]map[string]string{{{"text": "Открыть графики", "url": panel}}}}
	if len(png) == 0 {
		body, err := json.Marshal(map[string]any{"chat_id": chat, "text": text, "reply_markup": markup, "link_preview_options": map[string]bool{"is_disabled": true}})
		return body, "application/json", "sendMessage", err
	}

	var buffer bytes.Buffer
	writer := multipart.NewWriter(&buffer)
	markupJSON, err := json.Marshal(markup)
	if err != nil {
		return nil, "", "", errors.New("telegram markup invalid")
	}

	for key, value := range map[string]string{"chat_id": chat, "caption": text, "reply_markup": string(markupJSON)} {
		if err = writer.WriteField(key, value); err != nil {
			return nil, "", "", errors.New("telegram form invalid")
		}
	}

	part, err := writer.CreateFormFile("photo", "metric.png")
	if err != nil {
		return nil, "", "", errors.New("telegram photo field invalid")
	}

	if _, err = part.Write(png); err != nil {
		return nil, "", "", errors.New("telegram photo invalid")
	}

	if err = writer.Close(); err != nil {
		return nil, "", "", errors.New("telegram form incomplete")
	}

	return buffer.Bytes(), writer.FormDataContentType(), "sendPhoto", nil
}

func sleep(ctx context.Context, delay time.Duration) error {
	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}
