package postgres

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"image"
	"image/png"
	"slices"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

type baselineLookups struct{ calls, rows int }
type baselineRetryStore struct {
	meetings.Store
	reads *baselineLookups
}
type baselineRetryWriter struct {
	meetings.Writer
	reads *baselineLookups
}

func (s baselineRetryStore) Update(ctx context.Context, fn func(meetings.Writer) error) error {
	return s.Store.Update(ctx, func(w meetings.Writer) error { return fn(baselineRetryWriter{w, s.reads}) })
}
func (w baselineRetryWriter) Feed(string) ([]meetings.FeedEntry, error) {
	return nil, fmt.Errorf("retry attempted full history")
}
func (w baselineRetryWriter) FeedEntry(m, id string) (meetings.FeedEntry, error) {
	entry, err := w.Writer.FeedEntry(m, id)
	w.reads.calls++
	if err == nil {
		w.reads.rows++
	}
	return entry, err
}
func (w baselineRetryWriter) MessageByRequest(m, a, key string) (meetings.FeedEntry, error) {
	entry, err := w.Writer.MessageByRequest(m, a, key)
	w.reads.calls++
	if err == nil {
		w.reads.rows++
	}
	return entry, err
}
func baselineUUID(t *testing.T) string {
	t.Helper()
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		t.Fatal(err)
	}
	b[6] = (b[6] & 15) | 64
	b[8] = (b[8] & 63) | 128
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}
func TestSDDRetryQuantitativeMemory(t *testing.T) {
	for _, count := range []int{1000, 10000, 100000} {
		t.Run(fmt.Sprint(count), func(t *testing.T) { baselineRetry(t, memory.New(), nil, count, "memory") })
	}
}
func TestSDDRetryQuantitativeSQL(t *testing.T) {
	db := integrationDB(t)
	for _, count := range []int{1000, 10000, 100000} {
		t.Run(fmt.Sprint(count), func(t *testing.T) { baselineRetry(t, db.Meetings(), db, count, "postgres") })
	}
}
func baselineRetry(t *testing.T, store meetings.Store, db *Database, count int, adapter string) {
	t.Helper()
	ctx := t.Context()
	id := baselineUUID(t)
	actor := meetings.Actor{ID: baselineUUID(t), Name: "Synthetic baseline"}
	now := time.Now().UTC()
	clock := now
	requireChatSQL(t, store.Update(ctx, func(w meetings.Writer) error {
		return w.SaveMeeting(meetings.Meeting{ID: id, OrganizerID: actor.ID, Title: "Synthetic retry baseline", StartsOn: now.AddDate(0, 0, 1).Format(time.DateOnly), Timezone: "Europe/Moscow", CreatedAt: now})
	}))
	t.Cleanup(func() {
		if err := store.Update(context.Background(), func(w meetings.Writer) error { return w.DeleteMeeting(id) }); err != nil {
			t.Error(err)
		}
	})
	for first := 1; first <= count; first += 1000 {
		last := min(first+999, count)
		requireChatSQL(t, store.Update(ctx, func(w meetings.Writer) error {
			if db != nil {
				_, err := w.(*transaction).exec(`INSERT INTO feed_entries(id,meeting_id,sequence,actor_id,client_request_id,document) SELECT $1||'-'||n,$1,n,'synthetic',n::text,jsonb_build_object('ID',$1||'-'||n,'MeetingID',$1,'Sequence',n,'ActorID','synthetic','ClientRequestID',n::text,'Kind','message','Payload',jsonb_build_object('text','synthetic baseline')) FROM generate_series($2::int,$3::int)n`, id, first, last)
				return err
			}
			for n := first; n <= last; n++ {
				_, err := w.AppendEntry(meetings.FeedEntry{ID: fmt.Sprintf("%s-%d", id, n), MeetingID: id, ActorID: "synthetic", Kind: "message", Payload: json.RawMessage(`{"text":"synthetic baseline"}`)})
				if err != nil {
					return err
				}
			}
			return nil
		}))
	}
	reads := &baselineLookups{}
	app := meetings.NewService(baselineRetryStore{store, reads}, func() time.Time { return clock }, meetings.WithMediaContent(memory.NewMediaContent()))
	key := baselineUUID(t)
	entry, err := app.SendMessage(ctx, actor, id, "synthetic retry", key, key)
	requireChatSQL(t, err)
	var photo bytes.Buffer
	requireChatSQL(t, png.Encode(&photo, image.NewRGBA(image.Rect(0, 0, 16, 16))))
	type mediaIntent struct {
		name                string
		item                meetings.Media
		publishKey, caption string
		entryID             string
	}
	media := []mediaIntent{}
	for _, file := range []struct {
		name, contentType, caption string
		data                       []byte
	}{{"photo.png", "image/png", "", photo.Bytes()}, {"file.txt", "text/plain", "synthetic caption", []byte("Synthetic baseline document")}} {
		prepareKey := baselineUUID(t)
		item, e := app.PrepareMedia(ctx, actor, id, meetings.MediaInput{ClientRequestID: prepareKey, FileName: file.name, ContentType: file.contentType, SizeBytes: len(file.data), Purpose: "message"}, prepareKey)
		requireChatSQL(t, e)
		_, e = app.UploadMedia(ctx, actor, id, item.ID, file.contentType, file.data)
		requireChatSQL(t, e)
		publishKey := baselineUUID(t)
		published, e := app.PublishMediaWithCaption(ctx, actor, id, item.ID, publishKey, file.caption)
		requireChatSQL(t, e)
		if published.Entry == nil {
			t.Fatal("no committed media entry")
		}
		media = append(media, mediaIntent{file.name, item, publishKey, file.caption, published.Entry.ID})
	}
	if db != nil {
		_, err = db.pool.Exec(ctx, "ANALYZE feed_entries")
		requireChatSQL(t, err)
	}
	for _, expired := range []bool{false, true} {
		if expired {
			clock = now.Add(31 * 24 * time.Hour)
		}
		paths := []struct {
			name   string
			invoke func() error
			query  string
			args   []any
		}{{"text", func() error {
			again, e := app.SendMessage(ctx, actor, id, "synthetic retry", key, key)
			if e == nil && (again.ID != entry.ID || again.Sequence != entry.Sequence) {
				return fmt.Errorf("text identity changed")
			}
			return e
		}, feedRequestSQL, []any{id, actor.ID, key}}}
		for _, m := range media {
			paths = append(paths, struct {
				name   string
				invoke func() error
				query  string
				args   []any
			}{m.name, func() error {
				again, e := app.PublishMediaWithCaption(ctx, actor, id, m.item.ID, m.publishKey, m.caption)
				if e == nil && (again.Entry == nil || again.Entry.ID != m.entryID || len(again.Entry.Attachments) != 1) {
					return fmt.Errorf("media identity changed")
				}
				return e
			}, feedEntrySQL, []any{id, m.entryID}})
		}
		for _, path := range paths {
			samples := make([]float64, 0, 20)
			maxRows, maxCalls := 0, 0
			for sample := 0; sample < 20; sample++ {
				reads.calls = 0
				reads.rows = 0
				start := time.Now()
				requireChatSQL(t, path.invoke())
				samples = append(samples, float64(time.Since(start).Microseconds())/1000)
				maxRows = max(maxRows, reads.rows)
				maxCalls = max(maxCalls, reads.calls)
				if reads.rows != 1 || reads.calls != 1 {
					t.Fatalf("%s unbounded lookup calls=%d rows=%d", path.name, reads.calls, reads.rows)
				}
			}
			slices.Sort(samples)
			t.Logf("RETRY_BASELINE adapter=%s history=%d path=%s receipt_expired=%t samples=20 p50_ms=%.3f p95_ms=%.3f max_ms=%.3f max_feed_lookup_calls=%d max_feed_rows_returned=%d includes=application+transaction+lookup+decode full_feed=forbidden", adapter, count, path.name, expired, samples[9], samples[18], samples[19], maxCalls, maxRows)
			if db != nil {
				var raw []byte
				requireChatSQL(t, db.pool.QueryRow(ctx, "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) "+path.query, path.args...).Scan(&raw))
				var plans []struct{ Plan feedPlan }
				requireChatSQL(t, json.Unmarshal(raw, &plans))
				if len(plans) != 1 || !boundedFeedIndexScan(plans[0].Plan, 1) {
					t.Fatalf("unbounded retry lookup plan=%s", raw)
				}
				t.Logf("RETRY_SQL_PLAN history=%d path=%s receipt_expired=%t plan=%s", count, path.name, expired, raw)
			}
		}
	}
}
