package meetings

import "time"

func updatedSchedule(original Meeting, input UpdateInput) (string, *time.Time, string, error) {
	zone := original.Timezone
	if input.Timezone.Present {
		zone = input.Timezone.Value
	}

	location, err := loadZone(zone)
	if err != nil {
		return "", nil, "", err
	}

	if !input.StartsAt.Present && !input.StartsOn.Present && !input.Timezone.Present {
		return original.StartsOn, original.StartsAt, zone, nil
	}

	day, instant := original.StartsOn, original.StartsAt
	if input.StartsAt.Present {
		instant = nil
		if input.StartsAt.Value != "" {
			parsed, err := parseInstant(input.StartsAt.Value)
			if err != nil {
				return "", nil, "", err
			}

			if err := validateOffset(parsed, location); err != nil {
				return "", nil, "", err
			}

			utc := parsed.UTC()
			instant = &utc
		} else if !input.StartsOn.Present {
			return "", nil, "", ValidationError{map[string]string{"starts_on": "required"}}
		}
	}

	if instant != nil {
		day = instant.In(location).Format(time.DateOnly)
	}

	if input.StartsOn.Present {
		if instant != nil && day != input.StartsOn.Value {
			return "", nil, "", ValidationError{map[string]string{"starts_on": "date_mismatch"}}
		}

		day = input.StartsOn.Value
	}

	if day != "" || input.StartsOn.Present || input.StartsAt.Present {
		if _, err := dateStart(day, location); err != nil {
			return "", nil, "", err
		}
	}

	return day, instant, zone, nil
}
