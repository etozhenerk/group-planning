package meetings

import "time"

// parseSchedule keeps a calendar date separate from an optional exact instant.
func parseSchedule(day, timestamp string, zone *time.Location) (string, *time.Time, error) {
	var instant *time.Time
	if timestamp != "" {
		parsed, err := parseInstant(timestamp)
		if err != nil {
			return "", nil, err
		}

		if err := validateOffset(parsed, zone); err != nil {
			return "", nil, err
		}

		localDate := parsed.In(zone).Format(time.DateOnly)
		if day != "" && day != localDate {
			return "", nil, ValidationError{map[string]string{"starts_on": "date_mismatch"}}
		}

		day = localDate
		utc := parsed.UTC()
		instant = &utc
	}

	if _, err := dateStart(day, zone); err != nil {
		return "", nil, err
	}

	return day, instant, nil
}

// dateStart finds the first instant of a civil day, including a skipped midnight.
// The search begins before the requested date; each step follows zone boundaries,
// rather than assuming that a calendar day always lasts twenty-four hours.
func dateStart(day string, zone *time.Location) (time.Time, error) {
	date, err := time.Parse(time.DateOnly, day)
	if err != nil || date.Format(time.DateOnly) != day || day < "0001-01-01" || day >= "9999-12-31" {
		return time.Time{}, ValidationError{map[string]string{"starts_on": "invalid"}}
	}

	probe := date.Add(-48 * time.Hour).In(zone)
	for probe.Format(time.DateOnly) < day {
		probe = nextLocalDay(probe).In(zone)
	}

	if probe.Format(time.DateOnly) != day {
		return time.Time{}, ValidationError{map[string]string{"starts_on": "invalid"}}
	}

	return probe, nil
}

func scheduleStart(meeting Meeting, zone *time.Location) (*time.Time, error) {
	if meeting.StartsAt != nil {
		local := meeting.StartsAt.In(zone)
		return &local, nil
	}

	if meeting.StartsOn == "" {
		return nil, nil
	}

	start, err := dateStart(meeting.StartsOn, zone)
	if err != nil {
		return nil, err
	}

	return &start, nil
}

// calendarDay also understands records written before the explicit day field.
func calendarDay(meeting Meeting) string {
	if meeting.StartsOn != "" || meeting.StartsAt == nil {
		return meeting.StartsOn
	}

	location, err := time.LoadLocation(meeting.Timezone)
	if err != nil {
		return ""
	}

	return meeting.StartsAt.In(location).Format(time.DateOnly)
}
