package meetings

import "time"

// Period is the persisted lifecycle section of a personal meeting list.
type Period string

const (
	Upcoming Period = "upcoming"
	Past     Period = "past"
	Undated  Period = "undated"
)

// CalendarQuery selects a section and optionally a half-open local date range.
type CalendarQuery struct {
	Period   Period
	From, To string
	Limit    int
	Cursor   string
}

// Validate checks filters independently of the HTTP transport and cursor.
func (q CalendarQuery) Validate() error {
	invalid := func(field string) error { return ValidationError{map[string]string{field: "invalid"}} }
	if q.Period != Upcoming && q.Period != Past && q.Period != Undated {
		return invalid("period")
	}

	if q.Limit < 1 || q.Limit > 100 {
		return invalid("limit")
	}

	if q.From == "" && q.To == "" {
		return nil
	}

	from, fromErr := time.Parse(time.DateOnly, q.From)
	to, toErr := time.Parse(time.DateOnly, q.To)
	if q.Period == Undated || fromErr != nil || toErr != nil || !to.After(from) || to.Sub(from) > 42*24*time.Hour {
		return invalid("range")
	}

	return nil
}

// CalendarCounts covers all accessible meetings before range and page limits.
type CalendarCounts struct {
	Upcoming, Past, Undated int
}

// CalendarDay describes a nonempty local date in the requested range.
type CalendarDay struct {
	Date  string
	Count int
}

// CalendarItem adds local classification to a private meeting snapshot.
type CalendarItem struct {
	Details   Details
	Period    Period
	LocalDate string
	position  calendarPosition
}

// CalendarPage is calculated in one read transaction with current authorization.
type CalendarPage struct {
	Meetings         []CalendarItem
	NextCursor       string
	AsOf             time.Time
	Counts           CalendarCounts
	Days             []CalendarDay
	NextTransitionAt *time.Time
}
