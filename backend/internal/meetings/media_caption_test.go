package meetings_test

import (
	"encoding/json"
	"errors"
	"strings"
	"sync"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestDocumentCaptionAtomicPublishAndImmutableRetry(t *testing.T) {
	f, _ := mediaFixture(t)
	id := f.created.Details.Meeting.ID
	content := []byte("Rules for Friday")
	item, err := f.app.PrepareMedia(ctx, owner, id, meetings.MediaInput{
		ClientRequestID: key(700), FileName: "rules.txt", ContentType: "text/plain",
		SizeBytes: len(content), Purpose: "message",
	}, key(700))
	must(t, err)
	_, err = f.app.UploadMedia(ctx, owner, id, item.ID, "text/plain", content)
	must(t, err)
	var wg sync.WaitGroup
	for range 8 {
		wg.Go(func() {
			_, err := f.app.PublishMediaWithCaption(ctx, owner, id, item.ID, key(701), "  Правила на пятницу 🎲  ")
			if err != nil {
				t.Error(err)
			}
		})
	}

	wg.Wait()
	entries := feed(t, f).Entries
	if len(entries) != 2 || len(entries[1].Attachments) != 1 || entries[1].Attachments[0].FileName != "rules.txt" {
		t.Fatal("caption duplicated or replaced the document")
	}

	var payload struct{ Text string }
	must(t, json.Unmarshal(entries[1].Payload, &payload))
	if payload.Text != "Правила на пятницу 🎲" {
		t.Fatal("caption was lost")
	}

	_, err = f.app.PublishMediaWithCaption(ctx, owner, id, item.ID, key(701), "Другая подпись")
	assertError(t, err, meetings.ErrIdempotencyConflict)
	_, err = f.app.PublishMediaWithCaption(ctx, owner, id, item.ID, key(702), "Другая подпись")
	var conflict *meetings.Conflict
	if !errors.As(err, &conflict) || conflict.Code != "media_already_published" {
		t.Fatal("new key changed the published caption", err)
	}

	_, err = f.app.PublishMediaWithCaption(ctx, owner, id, item.ID, key(703), "Правила на пятницу 🎲")
	must(t, err)
	_, err = f.app.PublishMediaWithCaption(ctx, outsider, id, item.ID, key(704), "Правила на пятницу 🎲")
	assertError(t, err, meetings.ErrForbidden)
}

func TestCaptionRejectsPhotosAndOversizedText(t *testing.T) {
	f, _ := mediaFixture(t)
	id := f.created.Details.Meeting.ID
	item := reservePhoto(t, f, owner, "message", 710)
	_, err := f.app.UploadMedia(ctx, owner, id, item.ID, "image/png", mediaPhoto(t))
	must(t, err)
	for _, caption := range []string{"Фото с подписью", strings.Repeat("я", 2001)} {
		_, err = f.app.PublishMediaWithCaption(ctx, owner, id, item.ID, key(711), caption)
		var invalid meetings.ValidationError
		if !errors.As(err, &invalid) {
			t.Fatal("accepted invalid caption", err)
		}
	}

	_, err = f.app.PublishMediaWithCaption(ctx, owner, id, item.ID, key(711), "  ")
	must(t, err)
	_, err = f.app.PublishMedia(ctx, owner, id, item.ID, key(711))
	must(t, err)
	if len(feed(t, f).Entries) != 2 {
		t.Fatal("empty caption changed legacy retry semantics")
	}
}
