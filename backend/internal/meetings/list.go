package meetings

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"slices"
	"strings"
	"time"
)

type listCursor struct {
	StartsAt *time.Time `json:"starts_at"`
	ID       string     `json:"id"`
}

func cursorFor(meeting Meeting) listCursor { return listCursor{meeting.StartsAt, meeting.ID} }
func compareCursor(a, b listCursor) int {
	if a.StartsAt == nil && b.StartsAt != nil {
		return 1
	}
	if a.StartsAt != nil && b.StartsAt == nil {
		return -1
	}
	if a.StartsAt != nil && b.StartsAt != nil {
		if v := a.StartsAt.Compare(*b.StartsAt); v != 0 {
			return v
		}
	}
	return strings.Compare(a.ID, b.ID)
}

// List includes created meetings and current going responses, sorted by time/ID.
// Undated meetings sort last; calendar classification belongs to a later stage.
func (s *Service) List(ctx context.Context, actor Actor, limit int, cursor string) (ListPage, error) {
	if err := checkActor(actor); err != nil {
		return ListPage{}, err
	}
	if limit < 1 || limit > 100 {
		return ListPage{}, ValidationError{map[string]string{"limit": "invalid"}}
	}
	var after listCursor
	if cursor != "" {
		data, err := base64.RawURLEncoding.DecodeString(cursor)
		if err != nil || len(data) > 512 || base64.RawURLEncoding.EncodeToString(data) != cursor || json.Unmarshal(data, &after) != nil {
			return ListPage{}, ValidationError{map[string]string{"cursor": "invalid"}}
		}
		if _, err := ParseUUID(after.ID); err != nil {
			return ListPage{}, ValidationError{map[string]string{"cursor": "invalid"}}
		}
	}
	result := ListPage{Meetings: []Details{}}
	err := s.store.View(ctx, func(reader Reader) error {
		all, err := reader.Meetings()
		if err != nil {
			return err
		}
		slices.SortFunc(all, func(a, b Meeting) int { return compareCursor(cursorFor(a), cursorFor(b)) })
		for _, meeting := range all {
			if cursor != "" && compareCursor(cursorFor(meeting), after) <= 0 {
				continue
			}
			details, err := snapshot(reader, meeting, actor.ID)
			if err != nil {
				return err
			}
			if !allowed(details, actor.ID) {
				continue
			}
			result.Meetings = append(result.Meetings, details)
			if len(result.Meetings) > limit {
				break
			}
		}
		if len(result.Meetings) > limit {
			result.Meetings = result.Meetings[:limit]
			data, _ := json.Marshal(cursorFor(result.Meetings[limit-1].Meeting))
			result.NextCursor = base64.RawURLEncoding.EncodeToString(data)
		}
		return nil
	})
	return result, err
}
