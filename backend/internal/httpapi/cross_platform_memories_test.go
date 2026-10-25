package httpapi

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func seedCrossPlatformMemoryFixture(t *testing.T, store *memory.Store, auth *identity.Service, app *meetings.Service, credentials map[string]iosFixtureCredential) {
	t.Helper()
	ctx := context.Background()
	actors := make([]meetings.Actor, 0, 3)
	for _, name := range []string{"invite-owner", "invite-rsvp", "invite-error"} {
		principal, err := auth.Authenticate(ctx, credentials[name].Token, false)
		if err != nil {
			t.Fatal(err)
		}

		actors = append(actors, meetings.Actor{ID: principal.User.ID, Name: principal.User.DisplayName})
	}

	created, err := app.Create(ctx, actors[0], meetings.CreateInput{
		Title: "Вайб трёх платформ", StartsOn: "2099-10-24", Timezone: "Europe/Moscow",
	}, "c2055000-0000-4000-8000-000000000001")
	if err != nil {
		t.Fatal(err)
	}

	id := created.Details.Meeting.ID
	for i, actor := range actors[1:] {
		key := fmt.Sprintf("c2055000-0000-4000-8000-%012d", i+2)
		if _, err := app.Respond(ctx, actor, id, created.InvitationToken, meetings.Going, 0, key); err != nil {
			t.Fatal(err)
		}
	}

	// A pre-existing completed gathering lets all clients exercise the same album
	// without adding a production clock override or waiting for a calendar day.
	if err := store.Update(ctx, func(w meetings.Writer) error {
		meeting, err := w.Meeting(id)
		if err != nil {
			return err
		}

		now := time.Now().UTC()
		meeting.StartsOn = now.AddDate(0, 0, -2).Format(time.DateOnly)
		meeting.Status = meetings.Past
		meeting.PastAt = &now

		return w.SaveMeeting(meeting)
	}); err != nil {
		t.Fatal(err)
	}
}
