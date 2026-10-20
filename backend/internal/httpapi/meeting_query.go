package httpapi

import (
	"net/http"
	"net/url"
	"strconv"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func closedQuery(w http.ResponseWriter, r *http.Request, names ...string) (url.Values, bool) {
	values, err := url.ParseQuery(r.URL.RawQuery)
	if err == nil {
		for name, items := range values {
			allowed := false
			for _, candidate := range names {
				if name == candidate {
					allowed = true
					break
				}
			}

			if !allowed || len(items) != 1 {
				err = meetings.ErrInvalidRecord
			}
		}
	}

	if err != nil {
		writeError(w, 400, "invalid_query", nil)
		return nil, false
	}

	return values, true
}

func pageLimit(w http.ResponseWriter, values url.Values) (int, bool) {
	if !values.Has("limit") {
		return 50, true
	}

	value, err := strconv.Atoi(values.Get("limit"))
	if err != nil || value < 1 || value > 100 || strconv.Itoa(value) != values.Get("limit") {
		writeError(w, 400, "invalid_query", nil)
		return 0, false
	}

	return value, true
}

func feedQuery(w http.ResponseWriter, r *http.Request) (meetings.FeedQuery, bool) {
	values, ok := closedQuery(w, r, "limit", "after_sequence", "before_sequence")
	if !ok {
		return meetings.FeedQuery{}, false
	}

	limit, ok := pageLimit(w, values)
	if !ok {
		return meetings.FeedQuery{}, false
	}

	result := meetings.FeedQuery{Limit: limit}
	for name, destination := range map[string]**uint64{"after_sequence": &result.After, "before_sequence": &result.Before} {
		if values.Has(name) {
			value, err := meetings.ParseRevision(values.Get(name))
			if err != nil {
				writeError(w, 400, "invalid_query", nil)
				return meetings.FeedQuery{}, false
			}

			*destination = &value
		}
	}

	if result.After != nil && result.Before != nil {
		writeError(w, 400, "invalid_query", nil)
		return meetings.FeedQuery{}, false
	}

	return result, true
}
