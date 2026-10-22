package meetings

import "time"

func pollDateInstant(meeting Meeting, day string, override Field) (*time.Time, bool, error) {
	zone, err := loadZone(meeting.Timezone)
	if err != nil {
		return nil, false, err
	}

	if override.Present {
		_, instant, err := parseSchedule(day, override.Value, zone)
		return instant, false, err
	}

	if meeting.StartsAt == nil {
		return nil, false, nil
	}

	date, err := time.Parse(time.DateOnly, day)
	if err != nil {
		return nil, false, err
	}

	old := meeting.StartsAt.In(zone)
	wall := time.Date(date.Year(), date.Month(), date.Day(), old.Hour(), old.Minute(), old.Second(), old.Nanosecond(), time.UTC)
	probe, end := wall.Add(-48*time.Hour), wall.Add(48*time.Hour)
	candidates := map[string]time.Time{}
	for probe.Before(end) {
		local := probe.In(zone)
		_, offset := local.Zone()
		candidate := wall.Add(-time.Duration(offset) * time.Second)
		converted := candidate.In(zone)
		if converted.Format(time.DateOnly) == day && converted.Hour() == old.Hour() && converted.Minute() == old.Minute() && converted.Second() == old.Second() {
			candidates[candidate.Format(time.RFC3339Nano)] = candidate
		}

		_, next := local.ZoneBounds()
		if next.IsZero() || !next.After(probe) {
			break
		}

		probe = next
	}

	if len(candidates) != 1 {
		return nil, true, nil
	}

	for _, instant := range candidates {
		return &instant, false, nil
	}

	return nil, true, nil
}
