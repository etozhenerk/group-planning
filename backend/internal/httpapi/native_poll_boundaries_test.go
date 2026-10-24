package httpapi

import (
	"context"
	"encoding/base64"
	"fmt"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func seedNativePollBoundary(t *testing.T, store *memory.Store, identityService *identity.Service, kind string, index int) iosFixtureCredential {
	t.Helper()
	ctx := context.Background()
	credential := iosCredential(t, identityService, "poll-"+kind)
	principal, err := identityService.Authenticate(ctx, credential.Token, false)
	if err != nil {
		t.Fatal(err)
	}

	actor := meetings.Actor{ID: principal.User.ID, Name: principal.User.DisplayName}
	id := fmt.Sprintf("d3c50000-0000-4000-8000-%012d", index)
	service := meetings.NewService(store, time.Now)
	now := time.Now().UTC()
	if err := store.Update(ctx, func(writer meetings.Writer) error {
		meeting := meetings.Meeting{
			ID: id, OrganizerID: actor.ID, Title: "Опрос: " + kind,
			StartsOn: "2026-10-25", Timezone: "Europe/Moscow", Revision: 1,
			CreatedAt: now, Status: meetings.Upcoming, ScheduleVersion: 1,
		}
		if kind == "time" {
			instant := time.Date(2026, 3, 7, 7, 30, 0, 0, time.UTC)
			meeting.StartsAt, meeting.StartsOn, meeting.Timezone = &instant, "2026-03-07", "America/New_York"
		}

		if err := writer.SaveMeeting(meeting); err != nil {
			return err
		}

		return writer.InsertInvitation(meetings.Invitation{
			ID: fmt.Sprintf("d3c50000-0000-4000-8000-%012d", index+4), MeetingID: id,
			Token: base64.RawURLEncoding.EncodeToString([]byte(fmt.Sprintf("%016d", index))), CreatedAt: now,
		})
	}); err != nil {
		t.Fatal(err)
	}

	dates := []string{"2026-10-25", "2026-10-26"}
	if kind == "time" {
		dates = []string{"2026-03-08", "2026-03-09"}
	}

	poll, err := service.CreateDatePoll(ctx, actor, id, meetings.CreateDatePollInput{
		Dates: dates, ClosesAt: now.Add(time.Hour).Format(time.RFC3339),
		Settings: meetings.PollSettings{MultipleAnswers: true, AllowRevoting: true, AllowNewOptions: true, HideResults: kind == "hidden", Anonymous: kind == "hidden"},
	}, fmt.Sprintf("d3c50000-0000-4000-8000-%012d", index+1))
	if err != nil {
		t.Fatal(err)
	}

	options := []string{poll.Options[0].Option.ID}
	if kind == "tie" {
		options = append(options, poll.Options[1].Option.ID)
	}

	if _, err := service.VoteDatePoll(ctx, actor, id, poll.ID, meetings.DateVoteInput{OptionIDs: options},
		fmt.Sprintf("d3c50000-0000-4000-8000-%012d", index+2)); err != nil {
		t.Fatal(err)
	}

	if kind == "hidden" {
		if _, err := service.Update(ctx, actor, id, meetings.UpdateInput{
			StartsOn: meetings.Field{Present: true, Value: "2026-10-27"}, ExpectedRevision: 1,
		}, fmt.Sprintf("d3c50000-0000-4000-8000-%012d", index+3)); err != nil {
			t.Fatal(err)
		}
	}

	return credential
}
