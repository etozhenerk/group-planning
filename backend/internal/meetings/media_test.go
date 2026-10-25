package meetings_test

import (
	"bytes"
	"context"
	"errors"
	"image"
	"image/color"
	"image/png"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func mediaFixture(t *testing.T) (*fixture, *memory.MediaContent) {
	t.Helper()
	f := setup(t)
	content := memory.NewMediaContent()
	f.app = meetings.NewService(f.store, func() time.Time { return time.Unix(f.clock.Load(), 0) }, meetings.WithMediaContent(content))

	return f, content
}

func mediaPhoto(t *testing.T) []byte {
	t.Helper()
	pixels := image.NewRGBA(image.Rect(0, 0, 16, 16))
	pixels.Set(0, 0, color.RGBA{R: 200, A: 255})
	var encoded bytes.Buffer
	must(t, png.Encode(&encoded, pixels))

	return encoded.Bytes()
}

func reservePhoto(t *testing.T, f *fixture, actor meetings.Actor, purpose string, n int) meetings.Media {
	t.Helper()
	item, err := f.app.PrepareMedia(ctx, actor, f.created.Details.Meeting.ID, meetings.MediaInput{ClientRequestID: key(n), FileName: "lake.png", ContentType: "image/png", SizeBytes: len(mediaPhoto(t)), Purpose: purpose}, key(n))
	must(t, err)

	return item
}

func TestMediaValidationAtomicPublishAndRetries(t *testing.T) {
	f, _ := mediaFixture(t)
	id := f.created.Details.Meeting.ID
	first := reservePhoto(t, f, owner, "message", 60)
	second := reservePhoto(t, f, owner, "message", 61)
	_, _, err := f.app.MediaBytes(ctx, owner, id, first.ID)
	assertError(t, err, meetings.ErrNotFound)
	_, err = f.app.PublishMedia(ctx, owner, id, first.ID, key(62))
	var conflict *meetings.Conflict
	if !errors.As(err, &conflict) || conflict.Code != "media_not_uploaded" {
		t.Fatal("published pending upload", err)
	}

	_, err = f.app.UploadMedia(ctx, owner, id, first.ID, "image/png", bytes.Repeat([]byte{1}, len(mediaPhoto(t))))
	if err == nil {
		t.Fatal("accepted false image type")
	}

	original := mediaPhoto(t)
	for range 2 {
		_, err = f.app.UploadMedia(ctx, owner, id, first.ID, "image/png", original)
		must(t, err)
	}

	changed := bytes.Clone(original)
	changed[len(changed)-1] ^= 1
	_, err = f.app.UploadMedia(ctx, owner, id, first.ID, "image/png", changed)
	assertError(t, err, meetings.ErrIdempotencyConflict)
	var wg sync.WaitGroup
	for range 8 {
		wg.Go(func() {
			_, err := f.app.PublishMedia(ctx, owner, id, first.ID, key(63))
			if err != nil {
				t.Error(err)
			}
		})
	}

	wg.Wait()
	entries := feed(t, f).Entries
	if len(entries) != 2 || entries[1].Kind != "message" || len(entries[1].Attachments) != 1 {
		t.Fatalf("duplicate/missing attachment: %+v", entries)
	}

	item, data, err := f.app.MediaBytes(ctx, owner, id, first.ID)
	must(t, err)
	if item.Status != "published" || len(data) == 0 {
		t.Fatal("no published bytes")
	}

	_, _, err = f.app.MediaBytes(ctx, outsider, id, first.ID)
	assertError(t, err, meetings.ErrForbidden)
	_, _, err = f.app.MediaBytes(ctx, owner, id, second.ID)
	assertError(t, err, meetings.ErrNotFound)
	// An unfinished second file neither rolls back nor republishes the first.
	_, err = f.app.UploadMedia(ctx, owner, id, second.ID, "image/png", original)
	must(t, err)
	_, err = f.app.PublishMedia(ctx, owner, id, second.ID, key(64))
	must(t, err)
	if len(feed(t, f).Entries) != 3 {
		t.Fatal("partial success duplicated earlier file")
	}
}

type pausedContent struct {
	*memory.MediaContent
	entered, release chan struct{}
}

func (p *pausedContent) Put(ctx context.Context, key string, data []byte) error {
	close(p.entered)
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-p.release:
	}

	return p.MediaContent.Put(ctx, key, data)
}

func TestMediaRechecksRevocationAfterBinaryIO(t *testing.T) {
	f, content := mediaFixture(t)
	id := f.created.Details.Meeting.ID
	respond(t, f, meetings.Going, 0, 70)
	item := reservePhoto(t, f, guest, "message", 71)
	paused := &pausedContent{MediaContent: content, entered: make(chan struct{}), release: make(chan struct{})}
	app := meetings.NewService(f.store, func() time.Time { return time.Unix(f.clock.Load(), 0) }, meetings.WithMediaContent(paused))
	result := make(chan error, 1)
	data := mediaPhoto(t)
	go func() { _, err := app.UploadMedia(ctx, guest, id, item.ID, "image/png", data); result <- err }()
	<-paused.entered
	respond(t, f, meetings.NotGoing, 1, 72)
	close(paused.release)
	assertError(t, <-result, meetings.ErrForbidden)
	_, err := f.app.PublishMedia(ctx, guest, id, item.ID, key(73))
	assertError(t, err, meetings.ErrForbidden)
	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		stored, err := r.Media(item.ID)
		if stored.Status != "pending" {
			t.Fatal("revoked upload committed")
		}

		return err
	}))
}

func TestAlbumPagesPrivatePreviewsAndPendingCleanup(t *testing.T) {
	f, _ := mediaFixture(t)
	id := f.created.Details.Meeting.ID
	_, err := f.app.Memories(ctx, owner, id, 10, "")
	if err == nil {
		t.Fatal("upcoming album available")
	}

	must(t, f.store.Update(ctx, func(w meetings.Writer) error {
		m, err := w.Meeting(id)
		if err != nil {
			return err
		}

		m.Status = meetings.Past

		return w.SaveMeeting(m)
	}))
	empty, err := f.app.Memories(ctx, owner, id, 1, "")
	must(t, err)
	if len(empty.Photos) != 0 {
		t.Fatal("nonempty new album")
	}

	for i := 0; i < 3; i++ {
		item := reservePhoto(t, f, owner, "memory", 80+i)
		_, err := f.app.UploadMedia(ctx, owner, id, item.ID, "image/png", mediaPhoto(t))
		must(t, err)
		_, err = f.app.PublishMedia(ctx, owner, id, item.ID, key(90+i))
		must(t, err)
		f.clock.Add(1)
	}

	first, err := f.app.Memories(ctx, owner, id, 1, "")
	must(t, err)
	if len(first.Photos) != 1 || first.NextCursor == "" {
		t.Fatal("missing album pagination")
	}

	next, err := f.app.Memories(ctx, owner, id, 2, first.NextCursor)
	must(t, err)
	if len(next.Photos) != 2 || next.NextCursor != "" || next.Photos[0].ID == first.Photos[0].ID {
		t.Fatal("album pages overlap")
	}

	details, err := f.app.Details(ctx, owner, id)
	must(t, err)
	if details.MemoryPhotoCount != 3 || len(details.MemoryPreview) != 3 || details.Meeting.Status != meetings.Past {
		t.Fatal("summary missing album or mutated transition")
	}

	pending := reservePhoto(t, f, owner, "memory", 95)
	_, err = f.app.UploadMedia(ctx, owner, id, pending.ID, "image/png", mediaPhoto(t))
	must(t, err)
	f.clock.Add(int64(24 * time.Hour / time.Second))
	must(t, f.app.PruneMedia(ctx))
	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		_, err := r.Media(pending.ID)
		assertError(t, err, meetings.ErrNotFound)

		return nil
	}))
	after, err := f.app.Memories(ctx, owner, id, 10, "")
	must(t, err)
	if len(after.Photos) != 3 {
		t.Fatal("cleanup removed published media")
	}

	if len(feed(t, f).Entries) != 1 {
		t.Fatal("album photos leaked into chat")
	}
}

func TestCurrentParticipantPublishesToChatAndAlbum(t *testing.T) {
	f, _ := mediaFixture(t)
	id := f.created.Details.Meeting.ID
	respond(t, f, meetings.Going, 0, 150)
	for index, purpose := range []string{"message", "memory"} {
		if purpose == "memory" {
			must(t, f.store.Update(ctx, func(w meetings.Writer) error {
				m, err := w.Meeting(id)
				if err != nil {
					return err
				}

				m.Status = meetings.Past

				return w.SaveMeeting(m)
			}))
		}

		item := reservePhoto(t, f, guest, purpose, 151+index)
		_, err := f.app.UploadMedia(ctx, guest, id, item.ID, "image/png", mediaPhoto(t))
		must(t, err)
		published, err := f.app.PublishMedia(ctx, guest, id, item.ID, key(155+index))
		must(t, err)
		if published.Media.UploadedBy.ID != guest.ID {
			t.Fatal("uploader changed to organizer")
		}

		if (published.Entry != nil) != (purpose == "message") {
			t.Fatal("wrong publication destination")
		}
	}

	album, err := f.app.Memories(ctx, owner, id, 10, "")
	must(t, err)
	if len(album.Photos) != 1 || album.NextCursor != "" {
		t.Fatal("single-photo album invalid")
	}
}

func TestMediaRejectsAdvertisedAndActualFileTypeMismatch(t *testing.T) {
	f, _ := mediaFixture(t)
	id := f.created.Details.Meeting.ID
	for index, kind := range []string{"application/pdf", "application/zip"} {
		n := 170 + index
		raw := []byte("plain text masquerading as document")
		item, err := f.app.PrepareMedia(ctx, owner, id, meetings.MediaInput{ClientRequestID: key(n), FileName: "document", ContentType: kind, SizeBytes: len(raw), Purpose: "message"}, key(n))
		must(t, err)
		if _, err := f.app.UploadMedia(ctx, owner, id, item.ID, kind, raw); err == nil {
			t.Fatal("false document format accepted")
		}
	}

	for _, size := range []int{0, meetings.MaxFileBytes + 1} {
		_, err := f.app.PrepareMedia(ctx, owner, id, meetings.MediaInput{ClientRequestID: key(180), FileName: "document", ContentType: "text/plain", SizeBytes: size, Purpose: "message"}, key(180))
		if err == nil {
			t.Fatal("invalid size accepted")
		}
	}
}
