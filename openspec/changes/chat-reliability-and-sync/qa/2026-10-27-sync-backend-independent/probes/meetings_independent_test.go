package meetings_test

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

// These probes belong to the independent review snapshot, not product sources.
type reviewLateFailureStore struct {
	meetings.Store
	failAt int
}

type reviewLateFailureWriter struct {
	meetings.Writer
	failAt, count int
}

var reviewFailure = errors.New("independent probe late outbox failure")

func (s reviewLateFailureStore) Update(c context.Context, callback func(meetings.Writer) error) error {
	return s.Store.Update(c, func(w meetings.Writer) error {
		return callback(&reviewLateFailureWriter{Writer: w, failAt: s.failAt})
	})
}

func (w *reviewLateFailureWriter) EnqueueChatHint(h meetings.ChatHint) error {
	w.count++
	if w.count == w.failAt {
		return reviewFailure
	}
	return w.Writer.EnqueueChatHint(h)
}

func TestIndependentLateOutboxFailureAndRetriedCommit(t *testing.T) {
	for _, failureIndex := range []int{2, 3} {
		t.Run(fmt.Sprint(failureIndex), func(t *testing.T) {
			f := setup(t)
			respond(t, f, meetings.Going, 0, 7200)
			id := f.created.Details.Meeting.ID
			stream, changes, hints := chatState(t, f)
			beforeFeed := feed(t, f)
			app := meetings.NewService(reviewLateFailureStore{f.store, failureIndex}, func() time.Time { return time.Unix(f.clock.Load(), 0) })
			_, err := app.SendMessage(ctx, owner, id, "independent private marker", key(7201), key(7201))
			if !errors.Is(err, reviewFailure) {
				t.Fatalf("expected injected failure after prior writes; got %v", err)
			}
			afterStream, afterChanges, afterHints := chatState(t, f)
			if stream != afterStream || !reflect.DeepEqual(changes, afterChanges) || !reflect.DeepEqual(hints, afterHints) || !reflect.DeepEqual(beforeFeed, feed(t, f)) {
				t.Fatal("partial entry/journal/hints committed on late failure")
			}
			entry, err := f.app.SendMessage(ctx, owner, id, "independent private marker", key(7201), key(7201))
			must(t, err)
			committedStream, _, _ := chatState(t, f)
			if entry.Sequence != beforeFeed.LatestSequence+1 || committedStream.LatestSequence != stream.LatestSequence+1 {
				t.Fatalf("rollback consumed an ordering slot: feed=%d journal=%d", entry.Sequence, committedStream.LatestSequence)
			}
			t.Logf("failure at hint %d: entire transaction unchanged; retry creates one consecutive feed/journal record", failureIndex)
		})
	}
}

func TestIndependentRevokedRetryAndAroundStayPrivate(t *testing.T) {
	f := setup(t)
	rsvp := respond(t, f, meetings.Going, 0, 7300)
	id := f.created.Details.Meeting.ID
	entry, err := f.app.SendMessage(ctx, guest, id, "independent private marker", key(7301), key(7301))
	must(t, err)
	respond(t, f, meetings.NotGoing, rsvp.Revision, 7302)
	for _, expiry := range []bool{false, true} {
		if expiry {
			f.clock.Add(int64((31 * 24 * time.Hour) / time.Second))
		}
		_, err := f.app.SendMessage(ctx, guest, id, "independent private marker", key(7301), key(7301))
		if !errors.Is(err, meetings.ErrForbidden) {
			t.Fatalf("revoked retry expiry=%v returned %v", expiry, err)
		}
		for _, anchor := range []string{entry.ID, "not-present"} {
			_, err := f.app.FeedAround(ctx, guest, id, anchor, 1)
			if !errors.Is(err, meetings.ErrForbidden) {
				t.Fatalf("anchor existence disclosed after revoke: %v", err)
			}
		}
	}
	t.Log("existing and absent anchors have same revoked-access result; text retry denied before and after receipt expiry")
}
