package meetings

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"io"
	"strings"
	"time"
)

// The prefix prevents calendar cursors being interpreted as legacy list cursors.
const calendarCursorPrefix = "c2."

type calendarPosition struct {
	StartsAt   *time.Time `json:"starts_at"`
	LocalStart string     `json:"local_start"`
	ID         string     `json:"id"`
}

type calendarCursor struct {
	Period      Period           `json:"period"`
	From        string           `json:"from"`
	To          string           `json:"to"`
	Fingerprint string           `json:"fingerprint"`
	ActorID     string           `json:"actor_id"`
	After       calendarPosition `json:"after"`
}

func decodeCalendarCursor(q CalendarQuery, actorID string) (calendarCursor, error) {
	var result calendarCursor
	invalid := ValidationError{map[string]string{"cursor": "invalid"}}
	if !strings.HasPrefix(q.Cursor, calendarCursorPrefix) || len(q.Cursor) > 2048 {
		return result, invalid
	}

	encoded := strings.TrimPrefix(q.Cursor, calendarCursorPrefix)
	data, err := base64.RawURLEncoding.DecodeString(encoded)
	if err != nil || base64.RawURLEncoding.EncodeToString(data) != encoded {
		return result, invalid
	}

	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&result) != nil || decoder.Decode(new(any)) != io.EOF {
		return result, invalid
	}

	if result.Period != q.Period || result.From != q.From || result.To != q.To || result.ActorID != actorID || len(result.Fingerprint) != 64 {
		return result, invalid
	}

	if _, err := ParseUUID(result.After.ID); err != nil {
		return result, invalid
	}

	if (result.After.StartsAt == nil) != (q.Period == Undated) {
		return result, invalid
	}

	if q.From == "" {
		if result.After.LocalStart != "" {
			return result, invalid
		}
	} else {
		local, err := time.Parse(localStartLayout, result.After.LocalStart)
		if err != nil || local.Format(localStartLayout) != result.After.LocalStart || local.Format(time.DateOnly) < q.From || local.Format(time.DateOnly) >= q.To {
			return result, invalid
		}
	}

	return result, nil
}

func encodeCalendarCursor(q CalendarQuery, fingerprint, actorID string, after calendarPosition) (string, error) {
	data, err := json.Marshal(calendarCursor{q.Period, q.From, q.To, fingerprint, actorID, after})
	if err != nil {
		return "", err
	}

	return calendarCursorPrefix + base64.RawURLEncoding.EncodeToString(data), nil
}

func compareCalendar(a, b calendarPosition, q CalendarQuery) int {
	if q.From != "" {
		if order := strings.Compare(a.LocalStart, b.LocalStart); order != 0 {
			return order
		}

		return strings.Compare(a.ID, b.ID)
	}

	order := compareCursor(listCursor{a.StartsAt, a.ID}, listCursor{b.StartsAt, b.ID})
	if q.Period == Past {
		return -order
	}

	return order
}
