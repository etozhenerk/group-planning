package httpapi

import (
	"context"
	"encoding/base64"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func seedIOSCalendar(t *testing.T, store *memory.Store, service *identity.Service, owner iosFixtureCredential) {
	t.Helper()

	for _, item := range []struct {
		id, title, stamp, zone string
		status                 meetings.Period
	}{
		{"c1111111-1111-4111-8111-111111111111", "Киновечер", "2026-10-31T14:00:00Z", "Europe/Moscow", meetings.Upcoming},
		{"c2222222-2222-4222-8222-222222222222", "Поздний ужин", "2026-10-31T17:00:00Z", "Europe/Moscow", meetings.Upcoming},
		{"c3333333-3333-4333-8333-333333333333", "Прошлая встреча", "2026-09-20T14:00:00Z", "Europe/Moscow", meetings.Past},
		{"c4444444-4444-4444-8444-444444444444", "Поход", "", "Europe/Moscow", meetings.Undated},
	} {
		seedIOSInvitation(t, store, service, owner, item.id,
			base64.RawURLEncoding.EncodeToString([]byte(item.id[:16])), item.title,
			"d"+item.id[1:], "e"+item.id[1:])
		principal, err := service.Authenticate(context.Background(), owner.Token, false)
		if err != nil {
			t.Fatal(err)
		}

		var starts *time.Time
		if item.stamp != "" {
			value, err := time.Parse(time.RFC3339, item.stamp)
			if err != nil {
				t.Fatal(err)
			}

			starts = &value
		}

		err = store.Update(context.Background(), func(w meetings.Writer) error {
			return w.SaveMeeting(meetings.Meeting{
				ID:              item.id,
				OrganizerID:     principal.User.ID,
				Title:           item.title,
				StartsAt:        starts,
				Timezone:        item.zone,
				Place:           "У друзей",
				Status:          item.status,
				ScheduleVersion: 1,
				Revision:        1,
				CreatedAt:       time.Now().UTC(),
			})
		})
		if err != nil {
			t.Fatal(err)
		}
	}
}
