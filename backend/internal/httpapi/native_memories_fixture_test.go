package httpapi

import (
	"bytes"
	"context"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

const nativeMemoryMeeting = "dab00000-0000-4000-8000-000000000001"

func seedNativeMemoryFixture(t *testing.T, store *memory.Store, auth *identity.Service, app *meetings.Service, credential iosFixtureCredential) {
	t.Helper()
	ctx := context.Background()
	principal, err := auth.Authenticate(ctx, credential.Token, false)
	if err != nil {
		t.Fatal(err)
	}

	actor := meetings.Actor{ID: principal.User.ID, Name: principal.User.DisplayName}
	now := time.Now().UTC()
	if err := store.Update(ctx, func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: nativeMemoryMeeting, OrganizerID: actor.ID, Title: "Суббота у озера", StartsOn: now.AddDate(0, 0, -2).Format(time.DateOnly), Timezone: "Europe/Moscow", Revision: 1, CreatedAt: now, Status: meetings.Past, ScheduleVersion: 1}); err != nil {
			return err
		}

		return w.InsertInvitation(meetings.Invitation{ID: "dab00000-0000-4000-8000-000000000002", MeetingID: nativeMemoryMeeting, Token: "TUVNT1JJRVMtRklYVFVSRQ", CreatedAt: now})
	}); err != nil {
		t.Fatal(err)
	}

	for i := 0; i < 3; i++ {
		pixels := image.NewRGBA(image.Rect(0, 0, 240, 320))
		for y := 0; y < 320; y++ {
			for x := 0; x < 240; x++ {
				pixels.Set(x, y, color.RGBA{R: uint8(70 + x/3 + i*25), G: uint8(110 + y/4), B: uint8(145 + i*25), A: 255})
			}
		}

		var content bytes.Buffer
		if err := png.Encode(&content, pixels); err != nil {
			t.Fatal(err)
		}

		key := fmt.Sprintf("dab00000-0000-4000-8000-%012d", i+10)
		media, err := app.PrepareMedia(ctx, actor, nativeMemoryMeeting, meetings.MediaInput{ClientRequestID: key, FileName: fmt.Sprintf("lake-%d.png", i), ContentType: "image/png", SizeBytes: content.Len(), Purpose: "memory"}, key)
		if err != nil {
			t.Fatal(err)
		}

		if _, err := app.UploadMedia(ctx, actor, nativeMemoryMeeting, media.ID, "image/png", content.Bytes()); err != nil {
			t.Fatal(err)
		}

		if _, err := app.PublishMedia(ctx, actor, nativeMemoryMeeting, media.ID, key); err != nil {
			t.Fatal(err)
		}
	}
}
