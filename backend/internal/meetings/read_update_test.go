package meetings_test

import (
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestPreviewSettingsParticipantsAndOwnList(t *testing.T) {
	f := setup(t)
	id := f.created.Details.Meeting.ID
	preview, response, err := f.app.PreviewForUser(ctx, f.created.InvitationToken, guest.ID)
	must(t, err)
	if preview.Title != "Настолки" || response.Revision != 0 {
		t.Fatal("preview changed RSVP")
	}
	_, err = f.app.Details(ctx, guest, id)
	assertError(t, err, meetings.ErrForbidden)
	link, err := f.app.Invitation(ctx, owner, id)
	must(t, err)
	if link != f.created.InvitationToken {
		t.Fatal("link rotated")
	}
	respond(t, f, meetings.Going, 0, 2)
	_, err = f.app.Invitation(ctx, guest, id)
	assertError(t, err, meetings.ErrForbidden)
	update := meetings.UpdateInput{Title: meetings.Field{Present: true, Value: "Новая встреча"}, ExpectedRevision: 2}
	_, err = f.app.Update(ctx, guest, id, update, key(3))
	assertError(t, err, meetings.ErrForbidden)
	update.ExpectedRevision = 1
	_, err = f.app.Update(ctx, owner, id, update, key(3))
	var conflict *meetings.Conflict
	if !errors.As(err, &conflict) || conflict.Current.Meeting.Revision != 2 {
		t.Fatal("missing current meeting")
	}
	update.ExpectedRevision = 2
	changed, err := f.app.Update(ctx, owner, id, update, key(3))
	must(t, err)
	if changed.Meeting.Revision != 3 {
		t.Fatal("settings revision")
	}
	retry, err := f.app.Update(ctx, owner, id, update, key(3))
	must(t, err)
	if retry.Meeting.Revision != 3 || len(feed(t, f).Entries) != 3 {
		t.Fatal("settings retry duplicated")
	}
	update.ExpectedRevision = 3
	_, err = f.app.Update(ctx, owner, id, update, key(4))
	must(t, err)
	if len(feed(t, f).Entries) != 3 {
		t.Fatal("noop emits event")
	}
	// A zone-only change preserves the instant; explicit null/empty clears optional fields.
	changed, err = f.app.Update(ctx, owner, id, meetings.UpdateInput{Timezone: meetings.Field{Present: true, Value: "UTC"}, Description: meetings.Field{Present: true}, Place: meetings.Field{Present: true}, ExpectedRevision: 3}, key(5))
	must(t, err)
	if !changed.Meeting.StartsAt.Equal(*f.created.Details.Meeting.StartsAt) || changed.Meeting.Description != "" || changed.Meeting.Place != "" || changed.Meeting.Revision != 4 {
		t.Fatal("patch presence or zone")
	}
	_, err = f.app.Update(ctx, owner, id, meetings.UpdateInput{StartsAt: meetings.Field{Present: true, Value: "2026-10-24T20:00:00+03:00"}, ExpectedRevision: 4}, key(6))
	var invalid meetings.ValidationError
	if !errors.As(err, &invalid) {
		t.Fatal("mismatched offset accepted")
	}
	retry, err = f.app.Update(ctx, owner, id, update, key(4))
	must(t, err)
	if retry.Meeting.Title != "Новая встреча" || retry.Meeting.Revision != 4 {
		t.Fatal("old patch reapplied")
	}
	respond(t, f, meetings.Maybe, 1, 7)
	_, err = f.app.Respond(ctx, outsider, "", f.created.InvitationToken, meetings.NotGoing, 0, key(8))
	must(t, err)
	people, err := f.app.Participants(ctx, owner, id)
	must(t, err)
	if len(people) != 3 || people[0].Role != "organizer" {
		t.Fatal("lost responses or duplicate owner")
	}
	own, err := f.app.List(ctx, owner, 50, "")
	must(t, err)
	if len(own.Meetings) != 1 {
		t.Fatal("owner missing")
	}
	guestList, err := f.app.List(ctx, guest, 50, "")
	must(t, err)
	if len(guestList.Meetings) != 0 {
		t.Fatal("maybe included")
	}
	_, err = f.app.Participants(ctx, guest, id)
	assertError(t, err, meetings.ErrForbidden)
	_, response, err = f.app.PreviewForUser(ctx, f.created.InvitationToken, guest.ID)
	must(t, err)
	if response.Answer != meetings.Maybe {
		t.Fatal("own preview stale")
	}
}
func TestListKeysetUndatedAndStorageFailure(t *testing.T) {
	f := setup(t)
	must(t, f.store.Update(ctx, func(w meetings.Writer) error {
		instant := *f.created.Details.Meeting.StartsAt
		for _, m := range []meetings.Meeting{
			{ID: key(100), OrganizerID: owner.ID, Title: "Same time", StartsAt: &instant, Timezone: "UTC"},
			{ID: key(101), OrganizerID: owner.ID, Title: "Undated", Timezone: "UTC"},
			{ID: key(102), OrganizerID: guest.ID, Title: "Other", StartsAt: &instant, Timezone: "UTC"},
		} {
			if err := w.SaveMeeting(m); err != nil {
				return err
			}
		}
		return nil
	}))
	seen := map[string]bool{}
	cursor := ""
	var last meetings.Meeting
	for {
		page, err := f.app.List(ctx, owner, 1, cursor)
		must(t, err)
		if len(page.Meetings) != 1 {
			t.Fatal("wrong page size")
		}
		last = page.Meetings[0].Meeting
		if seen[last.ID] {
			t.Fatal("repeated list item")
		}
		seen[last.ID] = true
		cursor = page.NextCursor
		if cursor == "" {
			break
		}
	}
	if len(seen) != 3 || last.StartsAt != nil {
		t.Fatal("ordering or visibility")
	}
	_, err := f.app.List(ctx, owner, 1, "junk")
	var validation meetings.ValidationError
	if !errors.As(err, &validation) {
		t.Fatal("bad cursor accepted")
	}
	empty := meetings.NewService(f.store, time.Now)
	p, err := empty.List(ctx, outsider, 50, "")
	must(t, err)
	if p.Meetings == nil || len(p.Meetings) != 0 {
		t.Fatal("empty list must be an array")
	}
	failure := errors.New("storage unavailable")
	broken := meetings.NewService(failedReadStore{f.store, failure}, time.Now)
	_, err = broken.List(ctx, owner, 50, "")
	assertError(t, err, failure)
}
