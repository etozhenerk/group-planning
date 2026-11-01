// External QA-only identity clock. Product meeting clock and OS clock stay real time.
package httpapi

import (
	"encoding/json"
	"net/http"
	"sync/atomic"
	"time"
)

type qaIdentityReviewClock struct{ offset atomic.Int64 }

func (c *qaIdentityReviewClock) Now() time.Time {
	return time.Now().Add(time.Duration(c.offset.Load()) * time.Second)
}
func qaIdentityClockReviewHandler(clock *qaIdentityReviewClock, token string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if token == "" || r.Header.Get("X-Somewhere-QA-Epoch-Control") != token {
			http.NotFound(w, r)
			return
		}
		var input struct {
			AdvanceSeconds int64 `json:"advance_seconds"`
		}
		r.Body = http.MaxBytesReader(w, r.Body, 512)
		dec := json.NewDecoder(r.Body)
		dec.DisallowUnknownFields()
		if dec.Decode(&input) != nil || input.AdvanceSeconds < 1 || input.AdvanceSeconds > 7200 {
			w.WriteHeader(400)
			return
		}
		offset := clock.offset.Add(input.AdvanceSeconds)
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]int64{"advanced_seconds": input.AdvanceSeconds, "identity_offset_seconds": offset})
	})
}
