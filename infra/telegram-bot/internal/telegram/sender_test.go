package telegram

import (
	"context"
	"errors"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"strings"
	"testing"
	"time"
)

type roundTrip func(*http.Request) (*http.Response, error)

func (f roundTrip) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func response(code int, body string) *http.Response {
	return &http.Response{StatusCode: code, Body: io.NopCloser(strings.NewReader(body)), Header: make(http.Header)}
}

const testToken = "123456:abcdefghijklmnopqrstuvwxyzABCDE"

func TestMultipartAndAllowedRecipient(t *testing.T) {
	sender, _ := NewSender(testToken, "-100123")
	sender.HTTP.Transport = roundTrip(func(r *http.Request) (*http.Response, error) {
		if r.URL.Scheme != "https" || r.URL.Host != "api.telegram.org" || !strings.HasSuffix(r.URL.Path, "/sendPhoto") {
			t.Fatal("wrong destination")
		}

		_, params, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
		if err != nil {
			t.Fatal(err)
		}

		reader := multipart.NewReader(r.Body, params["boundary"])
		fields := map[string]string{}
		for {
			part, err := reader.NextPart()
			if err == io.EOF {
				break
			}

			if err != nil {
				t.Fatal(err)
			}

			body, err := io.ReadAll(part)
			if err != nil {
				t.Fatal(err)
			}

			fields[part.FormName()] = string(body)
		}

		if fields["chat_id"] != "-100123" || fields["photo"] != "png" || fields["caption"] != "Привет" || !strings.Contains(fields["reply_markup"], "monium.yandex.cloud") {
			t.Fatalf("bad multipart: %+v", fields)
		}

		return response(200, `{"ok":true}`), nil
	})
	if err := sender.Send(context.Background(), "Привет", "https://monium.yandex.cloud/", []byte("png")); err != nil {
		t.Fatal(err)
	}
}

func TestRetriesAreBoundedAndRedacted(t *testing.T) {
	for _, test := range []struct {
		name     string
		code     int
		body     string
		network  bool
		attempts int
		wait     time.Duration
	}{
		{"429", 429, `{"ok":false,"parameters":{"retry_after":2}}`, false, 3, 2 * time.Second},
		{"long429", 429, `{"ok":false,"parameters":{"retry_after":40}}`, false, 1, 0},
		{"5xx", 503, `secret`, false, 3, 0},
		{"denied", 403, `{"ok":false,"description":"SECRET"}`, false, 1, 0},
		{"ambiguous_network", 0, "", true, 3, 0},
		{"malformed_success", 200, `{`, false, 1, 0},
	} {
		t.Run(test.name, func(t *testing.T) {
			sender, _ := NewSender(testToken, "123")
			calls := 0
			sender.HTTP.Transport = roundTrip(func(r *http.Request) (*http.Response, error) {
				calls++
				if !strings.HasSuffix(r.URL.Path, "/sendPhoto") {
					t.Fatal("fallback after ambiguous delivery")
				}

				if test.network {
					return nil, errors.New("SECRET " + testToken)
				}

				return response(test.code, test.body), nil
			})
			sender.Sleep = func(_ context.Context, d time.Duration) error {
				if test.wait > 0 && d != test.wait {
					t.Fatalf("retry_after ignored: %s", d)
				}

				return nil
			}
			err := sender.Send(context.Background(), "alarm", "https://monium.yandex.cloud/", []byte("png"))
			if err == nil || calls != test.attempts || strings.Contains(err.Error(), testToken) || strings.Contains(err.Error(), "SECRET") {
				t.Fatalf("calls=%d error=%v", calls, err)
			}
		})
	}
}

func TestRecoveryCancellationAndRedirect(t *testing.T) {
	sender, _ := NewSender(testToken, "123")
	calls := 0
	sender.Sleep = func(context.Context, time.Duration) error { return nil }
	sender.HTTP.Transport = roundTrip(func(_ *http.Request) (*http.Response, error) {
		calls++
		if calls == 1 {
			return response(500, `{}`), nil
		}

		return response(200, `{"ok":true}`), nil
	})
	if err := sender.Send(context.Background(), "recovered", "https://monium.yandex.cloud/", nil); err != nil || calls != 2 {
		t.Fatalf("recovery: %v %d", err, calls)
	}

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if err := sender.Send(ctx, "x", "https://monium.yandex.cloud/", nil); err == nil || calls != 2 {
		t.Fatal("sent after cancellation")
	}

	calls = 0
	sender.HTTP.Transport = roundTrip(func(_ *http.Request) (*http.Response, error) {
		calls++
		r := response(302, `{}`)
		r.Header.Set("Location", "https://example.org/stolen")

		return r, nil
	})
	if err := sender.Send(context.Background(), "x", "https://monium.yandex.cloud/", nil); err == nil || calls != 1 {
		t.Fatal("followed redirect")
	}
}
