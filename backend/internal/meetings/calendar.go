package meetings

import (
	"context"
	"slices"
	"strings"
)

// Calendar filters personal meetings without changing their lifecycle or rights.
// A changed personal set invalidates pagination; access is checked on every page.
func (s *Service) Calendar(ctx context.Context, actor Actor, q CalendarQuery) (CalendarPage, error) {
	if err := checkActor(actor); err != nil {
		return CalendarPage{}, err
	}

	if err := q.Validate(); err != nil {
		return CalendarPage{}, err
	}

	var cursor calendarCursor
	if q.Cursor != "" {
		var err error
		cursor, err = decodeCalendarCursor(q, actor.ID)
		if err != nil {
			return CalendarPage{}, err
		}
	}

	result := CalendarPage{Meetings: []CalendarItem{}, Days: []CalendarDay{}}
	err := s.store.View(ctx, func(reader Reader) error {
		result.AsOf = s.now().UTC()
		all, err := reader.Meetings()
		if err != nil {
			return err
		}

		slices.SortFunc(all, func(a, b Meeting) int { return strings.Compare(a.ID, b.ID) })
		type fingerprintItem struct {
			ID       string
			Revision uint64
			Status   Period
			RSVP     uint64
		}
		personal := []fingerprintItem{}
		days := map[string]int{}
		for _, meeting := range all {
			details, err := snapshot(reader, meeting, actor.ID)
			if err != nil {
				return err
			}

			if !allowed(details, actor.ID) {
				continue
			}

			personal = append(personal, fingerprintItem{meeting.ID, meeting.Revision, meeting.Status, details.MyResponse.Revision})
			item, transition, err := classify(details, q.From != "")
			if err != nil {
				return err
			}

			switch item.Period {
			case Upcoming:
				result.Counts.Upcoming++
			case Past:
				result.Counts.Past++
			case Undated:
				result.Counts.Undated++
			}

			if transition != nil && (result.NextTransitionAt == nil || transition.Before(*result.NextTransitionAt)) {
				result.NextTransitionAt = transition
			}

			if item.Period != q.Period || (q.From != "" && (item.LocalDate < q.From || item.LocalDate >= q.To)) {
				continue
			}

			if q.From != "" {
				days[item.LocalDate]++
			}

			if q.Cursor == "" || compareCalendar(item.position, cursor.After, q) > 0 {
				result.Meetings = append(result.Meetings, item)
			}
		}

		fingerprint := requestHash(personal)
		if q.Cursor != "" && cursor.Fingerprint != fingerprint {
			return &Conflict{Code: "calendar_changed"}
		}

		for date, count := range days {
			result.Days = append(result.Days, CalendarDay{date, count})
		}

		slices.SortFunc(result.Days, func(a, b CalendarDay) int { return strings.Compare(a.Date, b.Date) })
		slices.SortFunc(result.Meetings, func(a, b CalendarItem) int { return compareCalendar(a.position, b.position, q) })
		if len(result.Meetings) > q.Limit {
			result.Meetings = result.Meetings[:q.Limit]
			result.NextCursor, err = encodeCalendarCursor(q, fingerprint, actor.ID, result.Meetings[q.Limit-1].position)
			if err != nil {
				return err
			}
		}

		if s.ChatReadStateEnabled() {
			for i := range result.Meetings {
				state, err := reader.ChatReadState(result.Meetings[i].Details.Meeting.ID, actor.ID)
				if err != nil {
					return err
				}

				result.Meetings[i].Details.ReadState = &state
			}
		}

		return nil
	})

	return result, err
}
