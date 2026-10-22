package meetings

import "time"

const localStartLayout = "2006-01-02T15:04:05.000000000"

func classify(details Details, ranged bool) (CalendarItem, *time.Time, error) {
	meeting := details.Meeting
	item := CalendarItem{Details: details, Period: meeting.Status, position: calendarPosition{ID: meeting.ID}}
	if meeting.StartsAt == nil && meeting.StartsOn == "" {
		if meeting.Status != Undated {
			return CalendarItem{}, nil, ErrInvalidRecord
		}

		return item, nil, nil
	}

	if meeting.Status != Upcoming && meeting.Status != Past {
		return CalendarItem{}, nil, ErrInvalidRecord
	}

	location, err := time.LoadLocation(meeting.Timezone)
	if err != nil {
		return CalendarItem{}, nil, err
	}

	local, err := scheduleStart(meeting, location)
	if err != nil {
		return CalendarItem{}, nil, err
	}

	item.LocalDate = local.Format(time.DateOnly)
	// This cursor key may be the start of a date-only day. It is never exposed
	// as starts_at: the meeting still has no fabricated time.
	item.position.StartsAt = local
	if ranged {
		item.position.LocalStart = local.Format(localStartLayout)
	}

	if meeting.Status == Upcoming {
		return item, meeting.PastAt, nil
	}

	return item, nil, nil
}

// Resolve the next date through zone intervals: a day can have 23/25 hours,
// and an offset jump can skip midnight or even a whole calendar date.
func nextLocalDay(local time.Time) time.Time {
	target := time.Date(local.Year(), local.Month(), local.Day()+1, 0, 0, 0, 0, time.UTC)
	date := local.Format(time.DateOnly)
	for {
		_, offset := local.Zone()
		midnight := target.Add(-time.Duration(offset) * time.Second)
		_, end := local.ZoneBounds()
		if end.IsZero() || midnight.Before(end) {
			return midnight.UTC()
		}

		local = end.In(local.Location())
		if local.Format(time.DateOnly) > date {
			return local.UTC()
		}
	}
}
