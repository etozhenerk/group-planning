package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

const maxCoverBodyBytes = 7 << 20

type coverRequest struct {
	MediaType string `json:"media_type"`
	Data      string `json:"data"`
}

func parseCover(w http.ResponseWriter, data json.RawMessage) (*meetings.CoverInput, bool) {
	if len(data) == 0 || string(data) == "null" {
		return nil, true
	}

	var value coverRequest
	if err := validateJSONNames(data, &value); err != nil {
		writeError(w, 422, "validation_failed", map[string]string{"cover": "invalid"})
		return nil, false
	}

	if err := json.Unmarshal(data, &value); err != nil {
		writeError(w, 422, "validation_failed", map[string]string{"cover": "invalid"})
		return nil, false
	}

	return &meetings.CoverInput{MediaType: value.MediaType, Data: value.Data}, true
}
