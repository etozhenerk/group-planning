package httpapi

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

// Deliberately public deterministic capability, available only inside the opt-in test server.
const iosInvitationToken = "QUFBQUFBQUFBQUFBQUFBQQ"

func seedIOSInvitation(t *testing.T, store *memory.Store, service *identity.Service, credential iosFixtureCredential, id, token, title, invitationID, entryID string) {
	t.Helper()
	ctx := context.Background()
	principal, err := service.Authenticate(ctx, credential.Token, false)
	if err != nil {
		t.Fatal(err)
	}

	now := time.Now().UTC()
	starts := time.Date(2026, time.October, 24, 16, 0, 0, 0, time.UTC)

	err = store.Update(ctx, func(writer meetings.Writer) error {
		if err := writer.SaveMeeting(meetings.Meeting{
			ID: id, OrganizerID: principal.User.ID, Title: title,
			Description: "Соберёмся в субботу. Принесите любимую игру.",
			StartsAt:    &starts, Timezone: "Europe/Moscow", Place: "У Саши", Revision: 1, CreatedAt: now,
		}); err != nil {
			return err
		}

		if err := writer.InsertInvitation(meetings.Invitation{
			ID: invitationID, MeetingID: id,
			Token: token, CreatedAt: now,
		}); err != nil {
			return err
		}

		payload, err := json.Marshal(map[string]string{"text": "Возьмите настолки, пиццу закажу я."})
		if err != nil {
			return err
		}

		_, err = writer.AppendEntry(meetings.FeedEntry{
			ID: entryID, MeetingID: id, Kind: "message",
			ActorID: principal.User.ID, ActorName: principal.User.DisplayName,
			OccurredAt: now, PayloadVersion: 1, Payload: payload,
		})

		return err
	})
	if err != nil {
		t.Fatal(err)
	}
}
