package httpapi

import (
	"bytes"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestJSONBoundary(t *testing.T) {
	type request struct {
		Text             string `json:"text"`
		ExpectedRevision string `json:"expected_revision"`
	}
	cases := []struct {
		body, contentType string
		status            int
	}{
		{`{"text":"Привет","expected_revision":"0"}`, "application/json", 200},
		{`{"text":"Привет"}`, "application/json; charset=utf-8", 200},
		{`{"text":"a","text":"b"}`, "application/json", 400},
		{`{"Text":"a"}`, "application/json", 400},
		{`{"user_id":"someone"}`, "application/json", 400},
		{`{"text":"a"} {}`, "application/json", 400},
		{`null`, "application/json", 400},
		{`[]`, "application/json", 400},
		{`{"expected_revision":9007199254740993}`, "application/json", 400},
		{`{"text":"a"}`, "text/plain", 415},
		{`{"text":"` + strings.Repeat("a", maxBodyBytes) + `"}`, "application/json", 413},
		{string([]byte{'{', '"', 't', 'e', 'x', 't', '"', ':', '"', 0xff, '"', '}'}), "application/json", 400},
	}
	for _, tc := range cases {
		t.Run(tc.contentType+tc.body[:min(len(tc.body), 30)], func(t *testing.T) {
			req := httptest.NewRequest("POST", "/test", strings.NewReader(tc.body))
			req.Header.Set("Content-Type", tc.contentType)
			response := httptest.NewRecorder()
			response.Header().Set("X-Request-ID", "id")
			var value request
			ok := decodeJSON(response, req, &value)
			if (tc.status == 200) != ok || response.Code != tc.status {
				t.Fatalf("ok=%v status=%d body=%s", ok, response.Code, response.Body)
			}

			if bytes.Contains(response.Body.Bytes(), []byte(tc.body)) {
				t.Fatal("request echoed into error")
			}
		})
	}
}
