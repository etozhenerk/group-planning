package httpapi

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type nativeDesignDays struct {
	friday, saturday, sunday, pastSaturday string
}

func nativeDesignDates(today time.Time) nativeDesignDays {
	untilFriday := (int(time.Friday) - int(today.Weekday()) + 7) % 7
	if untilFriday < 2 {
		untilFriday += 7
	}

	sinceSaturday := (int(today.Weekday()) - int(time.Saturday) + 7) % 7
	if sinceSaturday == 0 {
		sinceSaturday = 7
	}

	friday := today.AddDate(0, 0, untilFriday)

	return nativeDesignDays{
		friday:       friday.Format(time.DateOnly),
		saturday:     friday.AddDate(0, 0, 1).Format(time.DateOnly),
		sunday:       friday.AddDate(0, 0, 9).Format(time.DateOnly),
		pastSaturday: today.AddDate(0, 0, -sinceSaturday).Format(time.DateOnly),
	}
}

func TestNativeDesignDatesKeepRejoinOpenAndHistoryPast(t *testing.T) {
	for _, day := range []string{"2026-10-25", "2026-11-01", "2026-11-06", "2026-11-07", "2026-12-31", "2028-02-29"} {
		t.Run(day, func(t *testing.T) {
			today, err := time.Parse(time.DateOnly, day)
			if err != nil {
				t.Fatal(err)
			}

			days := nativeDesignDates(today)
			for text, weekday := range map[string]time.Weekday{days.friday: time.Friday, days.saturday: time.Saturday, days.sunday: time.Sunday} {
				date, err := time.Parse(time.DateOnly, text)
				if err != nil || date.Weekday() != weekday || date.Before(today.AddDate(0, 0, 2)) {
					t.Fatalf("future fixture cannot support leaving and rejoining: %s %v", text, err)
				}
			}

			past, err := time.Parse(time.DateOnly, days.pastSaturday)
			if err != nil || past.Weekday() != time.Saturday || !past.Before(today) {
				t.Fatalf("history fixture became upcoming: %s %v", days.pastSaturday, err)
			}
		})
	}
}

// Read the exact seeded values instead of recomputing host time at configuration export.
func nativeDesignFixtureDates(t *testing.T, store meetings.Store) map[string]string {
	t.Helper()
	dates := make(map[string]string, 4)
	err := store.View(context.Background(), func(reader meetings.Reader) error {
		for index, name := range []string{"dinner", "boardgame", "untimed", "past"} {
			meeting, err := reader.Meeting(fmt.Sprintf("deb00000-0000-4000-8000-%012d", index+1))
			if err != nil {
				return err
			}

			dates[name] = meeting.StartsOn
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	return dates
}
