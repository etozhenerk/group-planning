package httpapi

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

// seedNativeDesignFixture keeps visual review data identical to approved HTML.
// It exists only in opt-in QA servers, never in the application binary.
func seedNativeDesignFixture(t *testing.T, store *memory.Store, identities *memory.Identity, auth *identity.Service, app *meetings.Service) iosFixtureCredential {
	t.Helper()
	ctx := context.Background()
	now := time.Date(2026, 10, 25, 12, 0, 0, 0, time.UTC)
	today := time.Now().In(time.FixedZone("Europe/Moscow", 3*60*60))
	messageTime := time.Date(today.Year(), today.Month(), today.Day(), 15, 24, 0, 0, time.UTC)
	names := []string{"Лена", "Миша", "Саша", "Сергей", "Катя", "Оля"}
	ids := make([]string, len(names))
	for i, name := range names {
		ids[i] = fmt.Sprintf("dea00000-0000-4000-8000-%012d", i+1)
		subject := fmt.Sprintf("yandex:ios-ui-design-%d", i+1)
		if err := identities.Update(ctx, func(r identity.Records) error {
			return r.PutUser(subject, identity.User{ID: ids[i], DisplayName: name, Email: "sasha@example.com", Login: "sasha", FirstName: "Александр", LastName: "Иванов", Birthday: "0000-12-23", Sex: "male", CreatedAt: now})
		}); err != nil {
			t.Fatal(err)
		}
	}

	credential := iosCredential(t, auth, "design-3")
	type example struct {
		title, day, clock, place, photo string
		organizer                       int
		period                          meetings.Period
	}
	examples := []example{
		{"Ужин в пятницу", "2026-10-30", "20:00", "Кафе «Соседи»", "dinner.png", 3, meetings.Upcoming},
		{"Настолки у Саши", "2026-10-31", "19:00", "У Саши дома", "boardgame.png", 2, meetings.Upcoming},
		{"Воскресенье без планов", "2026-11-08", "", "", "", 3, meetings.Upcoming},
		{"Суббота без спешки", "2026-10-24", "", "Лофт «Квартал»", "", 2, meetings.Past},
	}
	for i, example := range examples {
		id := fmt.Sprintf("deb00000-0000-4000-8000-%012d", i+1)
		meeting := meetings.Meeting{ID: id, OrganizerID: ids[example.organizer], Title: example.title, StartsOn: example.day, Timezone: "Europe/Moscow", Place: example.place, Revision: 1, ScheduleVersion: 1, Status: example.period, CreatedAt: now}
		if example.clock != "" {
			date, err := time.Parse(time.RFC3339, example.day+"T"+example.clock+":00+03:00")
			if err != nil {
				t.Fatal(err)
			}

			meeting.StartsAt = &date
		}

		var cover meetings.Cover
		if example.photo != "" {
			data := nativeDesignAsset(t, example.photo)
			config, _, err := image.DecodeConfig(bytes.NewReader(data))
			if err != nil {
				t.Fatal(err)
			}

			meeting.CoverVersion = fmt.Sprintf("%x", sha256.Sum256(data))
			cover = meetings.Cover{MeetingID: id, Version: meeting.CoverVersion, MediaType: "image/png", Data: data, Width: config.Width, Height: config.Height}
		}

		err := store.Update(ctx, func(w meetings.Writer) error {
			if err := w.SaveMeeting(meeting); err != nil {
				return err
			}

			if example.photo != "" {
				if err := w.SaveCover(cover); err != nil {
					return err
				}
			}

			if err := w.InsertInvitation(meetings.Invitation{ID: fmt.Sprintf("dec00000-0000-4000-8000-%012d", i+1), MeetingID: id, Token: base64.RawURLEncoding.EncodeToString([]byte(fmt.Sprintf("%016d", 9500+i))), CreatedAt: now}); err != nil {
				return err
			}

			for _, userID := range ids {
				if userID != meeting.OrganizerID {
					if err := w.SaveRSVP(meetings.RSVP{MeetingID: id, UserID: userID, Answer: meetings.Going, Revision: 1, UpdatedAt: now}); err != nil {
						return err
					}
				}
			}

			for j, message := range []struct {
				actor int
				text  string
			}{{0, "Я принесу настолки. Во что будем играть?"}, {2, "Давайте начнём с чего-нибудь простого 🙂"}, {0, "Тогда беру две игры. И можно заказать пиццу!"}} {
				payload, err := json.Marshal(map[string]string{"text": message.text})
				if err != nil {
					return err
				}

				entryID := fmt.Sprintf("ded00000-0000-4000-8000-%012d", i*10+j+1)
				_, err = w.AppendEntry(meetings.FeedEntry{ID: entryID, MeetingID: id, Kind: "message", ActorID: ids[message.actor], ActorName: names[message.actor], OccurredAt: messageTime, PayloadVersion: 1, Payload: payload})
				if err != nil {
					return err
				}

				if j == 0 {
					for _, userID := range []string{ids[1], ids[3]} {
						if err := w.SaveReaction(meetings.Reaction{MeetingID: id, EntryID: entryID, UserID: userID, Emoji: "❤️"}, true); err != nil {
							return err
						}
					}
				}
			}

			return nil
		})
		if err != nil {
			t.Fatal(err)
		}
	}

	actor := meetings.Actor{ID: ids[2], Name: "Саша"}
	for i, name := range []string{"friends.png", "dinner.png", "boardgame.png"} {
		data := nativeDesignAsset(t, name)
		key := fmt.Sprintf("def00000-0000-4000-8000-%012d", i+1)
		media, err := app.PrepareMedia(ctx, actor, "deb00000-0000-4000-8000-000000000004", meetings.MediaInput{ClientRequestID: key, FileName: name, ContentType: "image/png", SizeBytes: len(data), Purpose: "memory"}, key)
		if err != nil {
			t.Fatal(err)
		}

		if _, err := app.UploadMedia(ctx, actor, media.MeetingID, media.ID, "image/png", data); err != nil {
			t.Fatal(err)
		}

		if _, err := app.PublishMedia(ctx, actor, media.MeetingID, media.ID, key); err != nil {
			t.Fatal(err)
		}
	}

	task, err := app.CreatePreparationTask(ctx, actor, "deb00000-0000-4000-8000-000000000002", meetings.CreatePreparationTaskInput{Title: "Заказать пиццу", RecipientID: ids[1]}, "def00000-0000-4000-8000-000000000010")
	if err != nil {
		t.Fatal(err)
	}

	// The approved visual example shows one live task card, without a separate
	// historical acceptance entry. Seed that snapshot; lifecycle fixtures still
	// exercise the real operation and keep its complete audit history.
	if err := store.Update(ctx, func(w meetings.Writer) error {
		accepted := task.Task
		assignee := meetings.Actor{ID: ids[1], Name: "Миша"}
		accepted.State = meetings.TaskAccepted
		accepted.Assignee = &assignee
		accepted.UpdatedBy = assignee
		accepted.Revision = 2
		accepted.UpdatedAt = messageTime

		return w.SavePreparationTask(accepted)
	}); err != nil {
		t.Fatal(err)
	}

	return credential
}

func nativeDesignAsset(t *testing.T, name string) []byte {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("missing fixture source location")
	}

	data, err := os.ReadFile(filepath.Join(filepath.Dir(file), "../../../openspec/changes/meeting-experience-refresh/assets", name))
	if err != nil {
		t.Fatal(err)
	}

	return data
}

func TestNativeDesignFixtureData(t *testing.T) {
	store, identities := memory.New(), memory.NewIdentity()
	auth, err := identity.New(identity.Config{PublicOrigin: "https://fixture.example.test", SessionTTL: time.Hour, NativeCallbacks: map[string]string{"ios": "group-planning-ios://auth/callback"}}, identities, iosFixtureProvider{}, time.Now, func(context.Context, string) (bool, error) { return false, nil })
	if err != nil {
		t.Fatal(err)
	}

	app := meetings.NewService(store, time.Now, meetings.WithMediaContent(memory.NewMediaContent()))
	credential := seedNativeDesignFixture(t, store, identities, auth, app)
	principal, err := auth.Authenticate(context.Background(), credential.Token, false)
	if err != nil {
		t.Fatal(err)
	}

	actor := meetings.Actor{ID: principal.User.ID, Name: principal.User.DisplayName}
	page, err := app.List(context.Background(), actor, 10, "")
	if err != nil {
		t.Fatal(err)
	}

	if len(page.Meetings) != 4 || principal.User.Email != "sasha@example.com" {
		t.Fatal("design fixture differs from approved data")
	}

	for _, detail := range page.Meetings {
		if detail.ParticipantCount != 6 {
			t.Fatal("missing design participants")
		}

		if detail.Meeting.CoverVersion != "" && len(detail.Meeting.CoverVersion) != 64 {
			t.Fatal("invalid cover version")
		}
	}

	photos, err := app.Memories(context.Background(), actor, "deb00000-0000-4000-8000-000000000004", 10, "")
	if err != nil || len(photos.Photos) != 3 {
		t.Fatalf("design photos: %v", err)
	}
}
