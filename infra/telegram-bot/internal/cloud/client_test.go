package cloud

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/infra/telegram-bot/internal/chart"
	"github.com/etozhenerk/group-planning/infra/telegram-bot/internal/notify"
	"github.com/etozhenerk/group-planning/infra/telegram-bot/internal/telegram"
)

type transport func(*http.Request) (*http.Response, error)

func (f transport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func reply(code int, body string) *http.Response {
	return &http.Response{StatusCode: code, Header: make(http.Header), Body: io.NopCloser(strings.NewReader(body))}
}

func TestCredentialRotationAndRedaction(t *testing.T) {
	client := NewClient("folder")
	version := 1
	client.MetadataHTTP.Transport = transport(func(r *http.Request) (*http.Response, error) {
		if r.URL.Host != "169.254.169.254" || r.Header.Get("Metadata-Flavor") != "Google" {
			t.Fatal("wrong metadata endpoint")
		}

		return reply(200, `{"access_token":"IAM_SECRET"}`), nil
	})
	client.HTTP.Transport = transport(func(r *http.Request) (*http.Response, error) {
		if r.URL.Host != "payload.lockbox.api.cloud.yandex.net" || r.URL.RawQuery != "" || r.Header.Get("Authorization") != "Bearer IAM_SECRET" {
			t.Fatal("wrong Lockbox request")
		}

		token := "first"
		if version == 2 {
			token = "second"
		}

		return reply(200, `{"entries":[{"key":"telegram-token","textValue":"`+token+`"}]}`), nil
	})
	for _, want := range []string{"first", "second"} {
		_, token, err := client.Credentials(context.Background(), "secret")
		if err != nil || token != want {
			t.Fatalf("rotation: %q %v", token, err)
		}

		version++
	}

	client.HTTP.Transport = transport(func(_ *http.Request) (*http.Response, error) { return reply(403, `SECRET`), nil })
	if _, _, err := client.Credentials(context.Background(), "secret"); err == nil || strings.Contains(err.Error(), "SECRET") {
		t.Fatalf("unsafe error: %v", err)
	}
}

func TestMetricShapesGapsAndLimits(t *testing.T) {
	now := time.Date(2026, 10, 25, 0, 0, 0, 0, time.UTC)
	stamp := now.Add(-time.Minute).UnixMilli()
	makeSeries := func(times, values any) string {
		raw, _ := json.Marshal(map[string]any{"metrics": []any{map[string]any{"timeseries": map[string]any{"timestamps": times, "doubleValues": values}}}})
		return string(raw)
	}
	for _, test := range []struct {
		name, body string
		count      int
		fail       bool
	}{
		{"null", makeSeries([]int64{stamp, stamp + 60000}, []any{nil, 4}), 2, false},
		{"nan", makeSeries([]int64{stamp}, []any{"NaN"}), 1, false},
		{"integer", `{"metrics":[{"timeseries":{"timestamps":[` + jsonNumber(stamp) + `],"int64Values":["4"]}}]}`, 1, false},
		{"empty", `{"metrics":[]}`, 0, false},
		{"ambiguous", `{"metrics":[{},{}]}`, 0, true},
		{"shape", makeSeries([]int64{stamp}, []any{}), 0, true},
		{"unordered", makeSeries([]int64{stamp + 60000, stamp}, []any{1, 2}), 0, true},
		{"invalid", makeSeries([]int64{stamp}, []any{"secret"}), 0, true},
		{"oversized", strings.Repeat("x", 256*1024+1), 0, true},
	} {
		t.Run(test.name, func(t *testing.T) {
			client := NewClient("folder")
			client.HTTP.Transport = transport(func(r *http.Request) (*http.Response, error) {
				if r.URL.Query().Get("folderId") != "folder" || r.Method != "POST" {
					t.Fatal("bad metric request")
				}

				var body map[string]any
				if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
					t.Fatal(err)
				}

				sampling := body["downsampling"].(map[string]any)
				if sampling["gapFilling"] != "NULL" || sampling["gridInterval"] != "60000" {
					t.Fatal("gap or step changed")
				}

				return reply(200, test.body), nil
			})
			points, err := (Metrics{Client: client, Token: "test"}).History(context.Background(), "trusted", now.Add(-time.Hour), now)
			if (err != nil) != test.fail || len(points) != test.count {
				t.Fatalf("points=%+v err=%v", points, err)
			}

			if (test.name == "null" || test.name == "nan") && points[0].Value != nil {
				t.Fatal("gap became zero")
			}
		})
	}
}

func jsonNumber(value int64) string { raw, _ := json.Marshal(value); return string(raw) }

func TestEndToEndWithHTTPAdapters(t *testing.T) {
	config := notify.Config{FolderID: "folder", InstanceID: "host", Environment: "production", ChatID: "-100123", SecretID: "secret", Dashboards: map[string]string{"vm": "vm", "postgres": "pg"}}
	catalog, err := notify.NewCatalog(config)
	if err != nil {
		t.Fatal(err)
	}

	alert, err := catalog.Resolve(notify.Event{AlertID: "folder__folder_somewhere-memory", Status: "ALARM"})
	if err != nil {
		t.Fatal(err)
	}

	now := time.Date(2026, 10, 25, 0, 0, 0, 0, time.UTC)
	client := NewClient("folder")
	client.HTTP.Transport = transport(func(r *http.Request) (*http.Response, error) {
		var request map[string]any
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			t.Fatal(err)
		}

		if !strings.Contains(request["query"].(string), `"sys.memory.MemTotal"{service="custom",host="host"}`) {
			t.Fatal("query dialect mismatch")
		}

		return reply(200, `{"metrics":[{"timeseries":{"timestamps":[`+jsonNumber(now.Add(-time.Minute).UnixMilli())+`,`+jsonNumber(now.UnixMilli())+`],"doubleValues":[85,95]}}]}`), nil
	})
	sender, err := telegram.NewSender("123:abcdefghijklmnopqrstuvwxyzABCDE", config.ChatID)
	if err != nil {
		t.Fatal(err)
	}

	sends := 0
	sender.HTTP.Transport = transport(func(r *http.Request) (*http.Response, error) {
		sends++
		if !strings.HasSuffix(r.URL.Path, "sendPhoto") {
			t.Fatal("expected graph")
		}

		if err := r.ParseMultipartForm(2 * 1024 * 1024); err != nil {
			t.Fatal(err)
		}

		defer r.MultipartForm.RemoveAll()
		if !strings.Contains(r.FormValue("caption"), "95 %") || r.FormValue("chat_id") != config.ChatID {
			t.Fatal("bad caption/recipient")
		}

		photo, header, err := r.FormFile("photo")
		if err != nil {
			t.Fatal(err)
		}
		defer photo.Close()
		if header.Size < 1000 || header.Size > 1024*1024 {
			t.Fatal("invalid image size")
		}

		return reply(200, `{"ok":true}`), nil
	})
	result, err := notify.Deliver(context.Background(), alert, Metrics{Client: client, Token: "test"}, chart.Renderer{}, sender, now)
	if err != nil || result.Delivery != "photo" || sends != 1 {
		t.Fatalf("%+v %v sends=%d", result, err, sends)
	}
}
