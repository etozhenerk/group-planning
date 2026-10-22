package meetings_test

import (
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestDateOnlyCreationCalendarAndBackgroundTransition(t *testing.T) {
	f := setup(t)
	input := validInput()
	input.StartsAt, input.StartsOn = "", "2026-10-24"
	created, err := f.app.Create(ctx, owner, input, key(2))
	must(t, err)
	m := created.Details.Meeting
	if m.StartsAt != nil || m.StartsOn != input.StartsOn || m.Status != meetings.Upcoming || m.PastAt.Format(time.RFC3339) != "2026-10-24T21:00:00Z" {
		t.Fatalf("date-only schedule: %+v", m)
	}

	repeated, err := f.app.Create(ctx, owner, input, key(2))
	must(t, err)
	if repeated.Details.Meeting.ID != m.ID {
		t.Fatal("duplicate creation")
	}

	preview, err := f.app.PublicPreview(ctx, created.InvitationToken)
	must(t, err)
	if preview.StartsOn != input.StartsOn || preview.StartsAt != nil {
		t.Fatalf("preview: %+v", preview)
	}

	query := meetings.CalendarQuery{Period: meetings.Upcoming, From: "2026-10-24", To: "2026-10-25", Limit: 1}
	page, err := f.app.Calendar(ctx, owner, query)
	must(t, err)
	if page.Counts.Upcoming != 2 || len(page.Days) != 1 || page.Days[0].Count != 2 || page.NextCursor == "" || page.Meetings[0].Details.Meeting.ID != m.ID {
		t.Fatalf("first calendar page: %+v", page)
	}

	query.Cursor = page.NextCursor
	next, err := f.app.Calendar(ctx, owner, query)
	must(t, err)
	if len(next.Meetings) != 1 || next.Meetings[0].Details.Meeting.ID == m.ID {
		t.Fatal("date-only pagination skipped or duplicated a meeting")
	}

	f.clock.Store(m.PastAt.Unix())
	for range 2 {
		job, err := f.app.ClaimTransition(ctx, meetings.DefaultTransitionOptions())
		must(t, err)
		must(t, f.app.CompleteTransition(ctx, job))
	}

	final, err := f.app.Details(ctx, owner, m.ID)
	must(t, err)
	if final.Meeting.Status != meetings.Past || final.Meeting.StartsAt != nil {
		t.Fatal("background transition lost calendar-only semantics")
	}
}

func TestDateOnlyScheduleAcrossTimezoneChanges(t *testing.T) {
	for _, c := range []struct{ day, zone, due string }{
		{"2026-03-08", "America/New_York", "2026-03-09T04:00:00Z"},
		{"2026-11-01", "America/New_York", "2026-11-02T05:00:00Z"},
		{"2018-11-04", "America/Sao_Paulo", "2018-11-05T02:00:00Z"},
		{"2011-12-29", "Pacific/Apia", "2011-12-30T10:00:00Z"},
		{"2026-12-31", "Pacific/Kiritimati", "2026-12-31T10:00:00Z"},
	} {
		t.Run(c.zone+c.day, func(t *testing.T) {
			app := meetings.NewService(memory.New(), func() time.Time { return time.Date(2010, 1, 1, 0, 0, 0, 0, time.UTC) })
			input := validInput()
			input.StartsOn, input.StartsAt, input.Timezone = c.day, "", c.zone
			created, err := app.Create(ctx, owner, input, key(1))
			must(t, err)
			if created.Details.Meeting.PastAt.Format(time.RFC3339) != c.due {
				t.Fatalf("boundary: %v", created.Details.Meeting.PastAt)
			}
		})
	}
}

func TestDateOnlyValidationAndEditing(t *testing.T) {
	f := setup(t)
	for _, c := range []struct{ day, instant, zone string }{
		{"", "", "Europe/Moscow"},
		{"2026-02-30", "", "Europe/Moscow"},
		{"2026-10-25", "2026-10-24T19:00:00+03:00", "Europe/Moscow"},
		{"2011-12-30", "", "Pacific/Apia"},
		{"2026-10-24", "", "Invalid/Zone"},
	} {
		input := validInput()
		input.StartsOn, input.StartsAt, input.Timezone = c.day, c.instant, c.zone
		_, err := f.app.Create(ctx, owner, input, key(20))
		var validation meetings.ValidationError
		if !errors.As(err, &validation) {
			t.Fatalf("invalid schedule accepted: %+v / %v", c, err)
		}
	}

	id := f.created.Details.Meeting.ID
	patch := meetings.UpdateInput{StartsOn: meetings.Field{Present: true, Value: "2026-10-24"}, StartsAt: meetings.Field{Present: true}, ExpectedRevision: 1}
	changed, err := f.app.Update(ctx, owner, id, patch, key(2))
	must(t, err)
	if changed.Meeting.StartsAt != nil || changed.Meeting.StartsOn != "2026-10-24" {
		t.Fatal("time was not cleared")
	}

	repeated, err := f.app.Update(ctx, owner, id, patch, key(2))
	must(t, err)
	if repeated.Meeting.Revision != changed.Meeting.Revision {
		t.Fatal("repeat changed revision")
	}

	changed, err = f.app.Update(ctx, owner, id, meetings.UpdateInput{StartsOn: meetings.Field{Present: true, Value: "2026-10-27"}, ExpectedRevision: 2}, key(3))
	must(t, err)
	if changed.Meeting.StartsAt != nil || changed.Meeting.PastAt.Format(time.RFC3339) != "2026-10-27T21:00:00Z" {
		t.Fatal("date-only reschedule failed")
	}

	changed, err = f.app.Update(ctx, owner, id, meetings.UpdateInput{StartsAt: meetings.Field{Present: true, Value: "2026-10-27T19:00:00+03:00"}, ExpectedRevision: 3}, key(4))
	must(t, err)
	if changed.Meeting.StartsAt == nil || changed.Meeting.StartsOn != "2026-10-27" {
		t.Fatal("legacy instant patch failed")
	}

	_, err = f.app.Update(ctx, owner, id, meetings.UpdateInput{StartsOn: meetings.Field{Present: true, Value: "2026-10-28"}, ExpectedRevision: 4}, key(5))
	if err == nil {
		t.Fatal("contradictory date and preserved instant accepted")
	}
}
