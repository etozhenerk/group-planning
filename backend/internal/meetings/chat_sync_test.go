package meetings_test

import (
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func syncFixture(t *testing.T) *fixture {
	f := setup(t)
	f.app = meetings.NewService(boundedStore{f.store}, func() time.Time { return time.Unix(f.clock.Load(), 0) }, meetings.WithChatSyncKey([]byte(strings.Repeat("s", 32))))

	return f
}

func TestChatSyncFixedBarrierAndNextCycle(t *testing.T) {
	f := syncFixture(t)
	id := f.created.Details.Meeting.ID
	initial, err := f.app.Sync(ctx, owner, id, meetings.SyncQuery{Limit: 2})
	must(t, err)
	for i := range 3 {
		_, err := f.app.SendMessage(ctx, owner, id, "during subscribe", key(1100+i), key(1100+i))
		must(t, err)
	}

	first, err := f.app.Sync(ctx, owner, id, meetings.SyncQuery{Limit: 2, Cursor: initial.ChangeCursor})
	must(t, err)
	if !first.HasMore || len(first.Changes) != 2 {
		t.Fatal("first page", first)
	}

	_, err = f.app.SendMessage(ctx, owner, id, "after barrier", key(1110), key(1110))
	must(t, err)
	last, err := f.app.Sync(ctx, owner, id, meetings.SyncQuery{Limit: 2, Cursor: first.NextCursor})
	must(t, err)
	if last.HasMore || len(last.Changes) != 1 || last.ThroughCursor != first.ThroughCursor {
		t.Fatal("moving barrier", last)
	}

	repeat, err := f.app.Sync(ctx, owner, id, meetings.SyncQuery{Limit: 2, Cursor: first.NextCursor})
	must(t, err)
	if repeat.NextCursor != last.NextCursor || len(repeat.Changes) != 1 {
		t.Fatal("unstable retry")
	}

	_, err = f.app.SendMessage(ctx, owner, id, "after last page", key(1111), key(1111))
	must(t, err)
	next, err := f.app.Sync(ctx, owner, id, meetings.SyncQuery{Limit: 2, Cursor: last.NextCursor})
	must(t, err)
	if len(next.Changes) != 2 || next.HasMore || next.ThroughCursor == last.ThroughCursor {
		t.Fatal("finished cursor stuck at old barrier", next)
	}
}

func TestChatSyncScopeExpiryAndHiddenProjection(t *testing.T) {
	f := syncFixture(t)
	id := f.created.Details.Meeting.ID
	respond(t, f, meetings.Going, 0, 2)
	poll := newPoll(t, f, true, true)
	initial, err := f.app.Sync(ctx, guest, id, meetings.SyncQuery{Limit: 20})
	must(t, err)
	pollVote(t, f, owner, poll, []string{poll.Options[0].Option.ID}, 0, 1120)
	page, err := f.app.Sync(ctx, guest, id, meetings.SyncQuery{Limit: 20, Cursor: initial.ChangeCursor})
	must(t, err)
	found := false
	for _, change := range page.Changes {
		if change.Projection != nil && change.Projection.DatePoll != nil {
			found = true
			view := change.Projection.DatePoll
			if len(view.MyOptionIDs) != 0 || view.Options[0].Votes != nil || view.Options[0].Voters != nil {
				t.Fatal("hidden choice exposed")
			}
		}
	}

	if !found {
		t.Fatal("old card projection missing")
	}

	_, err = f.app.Sync(ctx, owner, id, meetings.SyncQuery{Limit: 2, Cursor: initial.ChangeCursor})
	assertError(t, err, meetings.ErrSyncCursorInvalid)
	tampered := initial.ChangeCursor[:len(initial.ChangeCursor)-1] + "!"
	_, err = f.app.Sync(ctx, guest, id, meetings.SyncQuery{Limit: 2, Cursor: tampered})
	assertError(t, err, meetings.ErrSyncCursorInvalid)
	f.clock.Add(int64(8 * 24 * time.Hour / time.Second))
	_, err = f.app.Sync(ctx, guest, id, meetings.SyncQuery{Limit: 2, Cursor: initial.ChangeCursor})
	assertError(t, err, meetings.ErrSyncResetRequired)
	respond(t, f, meetings.NotGoing, 1, 1121)
	_, err = f.app.Sync(ctx, guest, id, meetings.SyncQuery{Limit: 2, Cursor: tampered})
	assertError(t, err, meetings.ErrForbidden)
}

func TestChatSyncInitializesLegacyStreamOnce(t *testing.T) {
	f := syncFixture(t)
	legacyID := "80000000-0000-4000-8000-000000001199"
	must(t, f.store.Update(ctx, func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: legacyID, OrganizerID: owner.ID}); err != nil {
			return err
		}

		_, err := w.AppendEntry(meetings.FeedEntry{ID: key(1199), MeetingID: legacyID, Kind: "message", ActorID: owner.ID, ActorName: owner.Name, Payload: []byte(`{"text":"legacy"}`)})

		return err
	}))
	_, err := f.app.Sync(ctx, outsider, legacyID, meetings.SyncQuery{Limit: 1})
	assertError(t, err, meetings.ErrForbidden)
	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		_, err := r.ChatStream(legacyID)
		assertError(t, err, meetings.ErrNotFound)

		return nil
	}))
	first, err := f.app.Sync(ctx, owner, legacyID, meetings.SyncQuery{Limit: 1})
	must(t, err)
	again, err := f.app.Sync(ctx, owner, legacyID, meetings.SyncQuery{Limit: 1})
	must(t, err)
	if first.StreamEpoch == "" || first.StreamEpoch != again.StreamEpoch || len(first.Entries) != 1 || first.ProjectionVersion != 0 {
		t.Fatal("unstable legacy initialization")
	}

	_, err = f.app.SendMessage(ctx, owner, legacyID, "after initial", key(1198), key(1198))
	must(t, err)
	page, err := f.app.Sync(ctx, owner, legacyID, meetings.SyncQuery{Limit: 1, Cursor: first.ChangeCursor})
	must(t, err)
	if len(page.Changes) != 1 || page.HasMore {
		t.Fatal("legacy snapshot lost subsequent commit")
	}
}
