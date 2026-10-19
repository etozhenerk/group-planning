package httpapi

import (
	"encoding/json"
	"errors"
	"io"
	"mime"
	"net/http"
)

const maxBodyBytes = 64 << 10

// decodeJSON is the input boundary for JSON operations. Unknown fields and extra
// values are rejected; clients may still ignore additional fields in responses.
func decodeJSON(w http.ResponseWriter, r *http.Request, destination any) bool {
	contentType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || contentType != "application/json" {
		writeError(w, http.StatusUnsupportedMediaType, "unsupported_media_type", nil)
		return false
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	data, err := io.ReadAll(r.Body)
	if err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			writeError(w, http.StatusRequestEntityTooLarge, "body_too_large", nil)
		} else {
			writeError(w, http.StatusBadRequest, "invalid_json", nil)
		}
		return false
	}
	// Go's JSON decoder accepts duplicate names and case-insensitive struct fields.
	// Check names first so the wire contract has exactly one spelling and value.
	if err := validateJSONNames(data, destination); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", nil)
		return false
	}
	if err := json.Unmarshal(data, destination); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", nil)
		return false
	}
	return true
}
