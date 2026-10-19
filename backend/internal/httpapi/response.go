// Package httpapi translates the public HTTP contract to application operations.
package httpapi

import (
	"encoding/json"
	"net/http"
)

type errorBody struct {
	Error errorDetail `json:"error"`
}

type errorDetail struct {
	Code        string            `json:"code"`
	FieldErrors map[string]string `json:"field_errors"`
	RequestID   string            `json:"request_id"`
}

func writeError(w http.ResponseWriter, status int, code string, fields map[string]string) {
	if fields == nil {
		fields = map[string]string{}
	}
	writeJSON(w, status, errorBody{Error: errorDetail{Code: code,
		FieldErrors: fields, RequestID: w.Header().Get("X-Request-ID")}})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	// Encode before committing headers: encoding failure cannot leave a partial JSON success.
	data, err := json.Marshal(value)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal_error", nil)
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_, _ = w.Write(append(data, '\n'))
}
