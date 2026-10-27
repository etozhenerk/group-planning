package meetings_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

var errFullFeed = errors.New("bounded operation called full Feed")

type (
	boundedStore  struct{ meetings.Store }
	boundedReader struct{ meetings.Reader }
	boundedWriter struct{ meetings.Writer }
)

func (boundedReader) Feed(string) ([]meetings.FeedEntry, error) { return nil, errFullFeed }
func (boundedWriter) Feed(string) ([]meetings.FeedEntry, error) { return nil, errFullFeed }
func (s boundedStore) View(ctx context.Context, fn func(meetings.Reader) error) error {
	return s.Store.View(ctx, func(r meetings.Reader) error { return fn(boundedReader{r}) })
}

func (s boundedStore) Update(ctx context.Context, fn func(meetings.Writer) error) error {
	return s.Store.Update(ctx, func(w meetings.Writer) error { return fn(boundedWriter{w}) })
}

func TestFeedAndTextRetryNeverReadFullHistory(t *testing.T) {
	f := setup(t)
	id := f.created.Details.Meeting.ID
	respond(t, f, meetings.Going, 0, 2)
	first, err := f.app.SendMessage(ctx, guest, id, "Same intent", key(810), key(810))
	must(t, err)
	f.app = meetings.NewService(boundedStore{f.store}, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	for _, expired := range []bool{false, true} {
		if expired {
			f.clock.Add(int64((31 * 24 * time.Hour) / time.Second))
		}

		again, err := f.app.SendMessage(ctx, guest, id, "Same intent", key(810), key(810))
		must(t, err)
		if again.ID != first.ID || again.Sequence != first.Sequence {
			t.Fatal("retry changed identity")
		}

		_, err = f.app.SendMessage(ctx, guest, id, "Different", key(810), key(810))
		assertError(t, err, meetings.ErrIdempotencyConflict)
	}

	page, err := f.app.Feed(ctx, owner, id, meetings.FeedQuery{Limit: 1})
	must(t, err)
	if len(page.Entries) != 1 || page.Entries[0].ID != first.ID || !page.HasMore || page.LatestSequence != first.Sequence {
		t.Fatal("wrong bounded page", page)
	}

	another, err := f.app.SendMessage(ctx, owner, id, "Own intent", key(810), key(810))
	must(t, err)
	if another.ID == first.ID {
		t.Fatal("actor idempotency scope collapsed")
	}

	respond(t, f, meetings.NotGoing, 1, 811)
	f.app = meetings.NewService(deniedFeedStore{f.store}, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	_, err = f.app.SendMessage(ctx, guest, id, "Same intent", key(810), key(810))
	assertError(t, err, meetings.ErrForbidden)
	_, err = f.app.Feed(ctx, guest, id, meetings.FeedQuery{Limit: 1})
	assertError(t, err, meetings.ErrForbidden)
}

func TestMediaRetryNeverReadsFullHistory(t *testing.T) {
	f, content := mediaFixture(t)
	id := f.created.Details.Meeting.ID
	respond(t, f, meetings.Going, 0, 2)
	data := []byte("Document")
	item, err := f.app.PrepareMedia(ctx, guest, id, meetings.MediaInput{ClientRequestID: key(820), FileName: "rules.txt", ContentType: "text/plain", SizeBytes: len(data), Purpose: "message"}, key(820))
	must(t, err)
	_, err = f.app.UploadMedia(ctx, guest, id, item.ID, "text/plain", data)
	must(t, err)
	first, err := f.app.PublishMediaWithCaption(ctx, guest, id, item.ID, key(821), "Caption")
	must(t, err)
	f.app = meetings.NewService(boundedStore{f.store}, func() time.Time { return time.Unix(f.clock.Load(), 0) }, meetings.WithMediaContent(content))
	for _, expired := range []bool{false, true} {
		if expired {
			f.clock.Add(int64((31 * 24 * time.Hour) / time.Second))
		}

		again, err := f.app.PublishMediaWithCaption(ctx, guest, id, item.ID, key(821), "Caption")
		must(t, err)
		if again.Entry == nil || first.Entry == nil || again.Entry.ID != first.Entry.ID || again.Entry.Sequence != first.Entry.Sequence || len(again.Entry.Attachments) != 1 {
			t.Fatal("media retry lost entry")
		}
	}

	_, err = f.app.PublishMediaWithCaption(ctx, guest, id, item.ID, key(822), "Changed")
	var conflict *meetings.Conflict
	if !errors.As(err, &conflict) || conflict.Code != "media_already_published" {
		t.Fatal("caption changed", err)
	}

	respond(t, f, meetings.NotGoing, 1, 823)
	f.app = meetings.NewService(deniedFeedStore{f.store}, func() time.Time { return time.Unix(f.clock.Load(), 0) }, meetings.WithMediaContent(content))
	_, err = f.app.PublishMediaWithCaption(ctx, guest, id, item.ID, key(821), "Caption")
	assertError(t, err, meetings.ErrForbidden)
}

// Fail on any feed data read: a revoked caller must be rejected before even
// the bounded methods or a persisted idempotency lookup can inspect history.
type (
	deniedFeedReader struct{ meetings.Reader }
	deniedFeedWriter struct{ meetings.Writer }
	deniedFeedStore  struct{ meetings.Store }
)

func (deniedFeedReader) FeedWindow(string, meetings.FeedQuery) (meetings.FeedWindow, error) {
	return meetings.FeedWindow{}, errFullFeed
}

func (deniedFeedWriter) MessageByRequest(string, string, string) (meetings.FeedEntry, error) {
	return meetings.FeedEntry{}, errFullFeed
}

func (deniedFeedWriter) FeedEntry(string, string) (meetings.FeedEntry, error) {
	return meetings.FeedEntry{}, errFullFeed
}

func (s deniedFeedStore) View(ctx context.Context, fn func(meetings.Reader) error) error {
	return s.Store.View(ctx, func(r meetings.Reader) error { return fn(deniedFeedReader{r}) })
}

func (s deniedFeedStore) Update(ctx context.Context, fn func(meetings.Writer) error) error {
	return s.Store.Update(ctx, func(w meetings.Writer) error { return fn(deniedFeedWriter{w}) })
}
