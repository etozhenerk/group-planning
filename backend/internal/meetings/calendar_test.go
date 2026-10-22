package meetings_test

import (
	"errors"
	"fmt"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestCalendarCountsRangeAndAllPages(t *testing.T) {
	f := setup(t)
	for i := 2; i <= 107; i++ {
		input := validInput()
		if i%2 == 0 {
			input.StartsAt = "2026-10-25T19:00:00+03:00"
		}

		_, err := f.app.Create(ctx, owner, input, key(i))
		must(t, err)
	}

	input := validInput()
	input.StartsAt = "2026-10-18T19:00:00+03:00"
	_, err := f.app.Create(ctx, owner, input, key(108))
	must(t, err)
	must(t, f.store.Update(ctx, func(w meetings.Writer) error {
		return w.SaveMeeting(meetings.Meeting{ID: key(200), OrganizerID: owner.ID, Title: "Без даты", Timezone: "Europe/Moscow", Status: meetings.Undated, Revision: 1})
	}))
	query := meetings.CalendarQuery{Period: meetings.Upcoming, From: "2026-10-24", To: "2026-10-26", Limit: 17}
	seen := map[string]bool{}
	for {
		page, err := f.app.Calendar(ctx, owner, query)
		must(t, err)
		if page.Counts != (meetings.CalendarCounts{Upcoming: 107, Past: 1, Undated: 1}) || len(page.Days) != 2 || page.Days[0].Count+page.Days[1].Count != 107 {
			t.Fatalf("truncated totals: %+v", page)
		}

		for _, item := range page.Meetings {
			if seen[item.Details.Meeting.ID] {
				t.Fatal("duplicate page item")
			}

			seen[item.Details.Meeting.ID] = true
		}

		if page.NextCursor == "" {
			break
		}

		query.Cursor = page.NextCursor
	}

	if len(seen) != 107 {
		t.Fatalf("lost meetings: %d", len(seen))
	}

	empty, err := f.app.Calendar(ctx, owner, meetings.CalendarQuery{Period: meetings.Upcoming, From: "2026-10-26", To: "2026-10-27", Limit: 10})
	must(t, err)
	if len(empty.Meetings) != 0 || len(empty.Days) != 0 || empty.Counts.Upcoming != 107 {
		t.Fatal("empty day hid personal set")
	}

	undated, err := f.app.Calendar(ctx, owner, meetings.CalendarQuery{Period: meetings.Undated, Limit: 10})
	must(t, err)
	if len(undated.Meetings) != 1 || undated.Meetings[0].LocalDate != "" || len(undated.Days) != 0 {
		t.Fatal("undated assigned to a day")
	}
}

func TestCalendarCursorInvalidationAndLegacyCompatibility(t *testing.T) {
	f := setup(t)
	input := validInput()
	input.StartsAt = "2026-10-27T19:00:00+03:00"
	_, err := f.app.Create(ctx, owner, input, key(2))
	must(t, err)
	query := meetings.CalendarQuery{Period: meetings.Upcoming, Limit: 1}
	page, err := f.app.Calendar(ctx, owner, query)
	must(t, err)
	legacy, err := f.app.List(ctx, owner, 1, "")
	must(t, err)
	f.clock.Store(currentMeeting(t, f).PastAt.Unix())
	// Time alone neither changes status nor invalidates the cursor.
	query.Cursor = page.NextCursor
	unchanged, err := f.app.Calendar(ctx, owner, query)
	must(t, err)
	if unchanged.AsOf.Equal(page.AsOf) || unchanged.Counts.Upcoming != 2 {
		t.Fatal("read froze time or changed status")
	}

	job, err := f.app.ClaimTransition(ctx, meetings.DefaultTransitionOptions())
	must(t, err)
	must(t, f.app.CompleteTransition(ctx, job))
	_, err = f.app.Calendar(ctx, owner, query)
	var conflict *meetings.Conflict
	if !errors.As(err, &conflict) || conflict.Code != "calendar_changed" {
		t.Fatalf("stale pages accepted: %v", err)
	}

	next, err := f.app.List(ctx, owner, 1, legacy.NextCursor)
	must(t, err)
	if len(next.Meetings) != 1 {
		t.Fatal("legacy cursor invalidated")
	}

	for _, q := range []meetings.CalendarQuery{
		{Period: meetings.Past, Limit: 1, Cursor: page.NextCursor},
		{Period: meetings.Upcoming, Limit: 1, Cursor: legacy.NextCursor},
		{Period: meetings.Upcoming, Limit: 1, Cursor: "c2.invalid"},
	} {
		_, err = f.app.Calendar(ctx, owner, q)
		var validation meetings.ValidationError
		if !errors.As(err, &validation) {
			t.Fatalf("invalid cursor: %v", err)
		}
	}

	_, err = f.app.Calendar(ctx, guest, meetings.CalendarQuery{Period: meetings.Upcoming, Limit: 1, Cursor: page.NextCursor})
	if err == nil {
		t.Fatal("cursor changed owner")
	}
}

func TestCalendarAccessAndUnrelatedChanges(t *testing.T) {
	f := setup(t)
	respond(t, f, meetings.Going, 0, 2)
	second, err := f.app.Create(ctx, guest, validInput(), key(3))
	must(t, err)
	query := meetings.CalendarQuery{Period: meetings.Upcoming, Limit: 1}
	first, err := f.app.Calendar(ctx, guest, query)
	must(t, err)
	query.Cursor = first.NextCursor
	_, err = f.app.Create(ctx, outsider, validInput(), key(4))
	must(t, err)
	_, err = f.app.Calendar(ctx, guest, query)
	must(t, err)
	respond(t, f, meetings.Maybe, 1, 5)
	_, err = f.app.Calendar(ctx, guest, query)
	var conflict *meetings.Conflict
	if !errors.As(err, &conflict) {
		t.Fatal("removed access did not invalidate pages")
	}

	query.Cursor = ""
	page, err := f.app.Calendar(ctx, guest, query)
	must(t, err)
	if len(page.Meetings) != 1 || page.Meetings[0].Details.Meeting.ID != second.Details.Meeting.ID || page.Counts.Upcoming != 1 {
		t.Fatal("removed meeting leaked")
	}
}

func TestCalendarLocalDateAndPastOrder(t *testing.T) {
	f := setup(t)
	input := validInput()
	input.Timezone = "Pacific/Kiritimati"
	input.StartsAt = "2026-10-25T00:30:00+14:00"
	created, err := f.app.Create(ctx, owner, input, key(2))
	must(t, err)
	page, err := f.app.Calendar(ctx, owner, meetings.CalendarQuery{Period: meetings.Upcoming, From: "2026-10-25", To: "2026-10-26", Limit: 10})
	must(t, err)
	if len(page.Meetings) != 1 || page.Meetings[0].Details.Meeting.ID != created.Details.Meeting.ID {
		t.Fatal("calendar used UTC date")
	}

	for i, day := range []int{16, 17, 18} {
		input := validInput()
		input.StartsAt = fmt.Sprintf("2026-10-%02dT19:00:00+03:00", day)
		_, err := f.app.Create(ctx, owner, input, key(10+i))
		must(t, err)
	}

	past, err := f.app.Calendar(ctx, owner, meetings.CalendarQuery{Period: meetings.Past, Limit: 10})
	must(t, err)
	if len(past.Meetings) != 3 || past.Meetings[0].LocalDate != "2026-10-18" || past.Meetings[2].LocalDate != "2026-10-16" {
		t.Fatal("past not newest first")
	}

	ranged, err := f.app.Calendar(ctx, owner, meetings.CalendarQuery{Period: meetings.Past, From: "2026-10-16", To: "2026-10-19", Limit: 10})
	must(t, err)
	if ranged.Meetings[0].LocalDate != "2026-10-16" {
		t.Fatal("calendar not chronological")
	}
}

func TestCalendarValidation(t *testing.T) {
	cases := []meetings.CalendarQuery{
		{Period: "all", Limit: 10},
		{Period: meetings.Upcoming, Limit: 0},
		{Period: meetings.Upcoming, Limit: 101},
		{Period: meetings.Undated, Limit: 1, From: "2026-10-01", To: "2026-10-02"},
		{Period: meetings.Past, Limit: 1, From: "2026-10-01"},
		{Period: meetings.Past, Limit: 1, To: "2026-10-02"},
		{Period: meetings.Past, Limit: 1, From: "2026-02-30", To: "2026-03-01"},
		{Period: meetings.Past, Limit: 1, From: "2026-10-01", To: "2026-10-01"},
		{Period: meetings.Past, Limit: 1, From: "2026-10-02", To: "2026-10-01"},
		{Period: meetings.Past, Limit: 1, From: "2026-10-01", To: "2026-11-13"},
	}
	for _, q := range cases {
		if q.Validate() == nil {
			t.Fatalf("accepted query %+v", q)
		}
	}

	must(t, (meetings.CalendarQuery{Period: meetings.Upcoming, Limit: 1, From: "2026-10-01", To: "2026-11-12"}).Validate())
}
