package cloud

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"
)

type writeTransport func(*http.Request) (*http.Response, error)

func (f writeTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestWriteMetrics(t *testing.T) {
	for _, body := range []string{`{"writtenMetricsCount":"1"}`, `{"writtenMetricsCount":0}`, `{"writtenMetricsCount":1,"errorMessage":"private internal error"}`} {
		client := NewClient("folder")
		client.HTTP.Transport = writeTransport(func(request *http.Request) (*http.Response, error) {
			if request.URL.String() != "https://monitoring.api.cloud.yandex.net/monitoring/v2/data/write?folderId=folder&service=custom" || request.Header.Get("Authorization") != "Bearer iam" {
				t.Error("bad request")
			}

			var payload struct {
				Metrics []struct{ Name string }
				Labels  map[string]string
			}
			if err := json.NewDecoder(request.Body).Decode(&payload); err != nil || len(payload.Metrics) != 1 || payload.Metrics[0].Name != "somewhere_probe_success" || payload.Labels["probe"] != "api" {
				t.Error("bad payload")
			}

			return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(body))}, nil
		})
		err := client.Write(context.Background(), "iam", map[string]float64{"somewhere_probe_success": 0}, time.Now())
		if (err == nil) != (body == `{"writtenMetricsCount":"1"}`) {
			t.Fatalf("unexpected result: %v", err)
		}

		if err != nil && strings.Contains(err.Error(), "private") {
			t.Fatal("leaked body")
		}
	}

	if err := NewClient("folder").Write(context.Background(), "iam", map[string]float64{"user_123": 1}, time.Now()); err == nil {
		t.Fatal("unbounded metric accepted")
	}
}
