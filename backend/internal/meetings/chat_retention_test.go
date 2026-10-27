package meetings_test

import (
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestChatRetentionResetAndOutboxReplacement(t *testing.T) {
	f := syncFixture(t)
	id := f.created.Details.Meeting.ID
	first, err := f.app.Sync(ctx, owner, id, meetings.SyncQuery{Limit: 5})
	must(t, err)
	before, _, oldHints := chatState(t, f)
	f.clock.Add(int64(8 * 24 * time.Hour / time.Second))
	_, err = f.app.SendMessage(ctx, owner, id, "current", key(1300), key(1300))
	must(t, err)
	failed := meetings.NewService(failedOutboxStore{f.store}, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	assertError(t, failed.MaintainChat(ctx), errChatOutbox)
	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		stream, err := r.ChatStream(id)
		if err != nil {
			return err
		}

		if stream.RetainedAfter != before.RetainedAfter {
			t.Fatal("failed replacement committed retention")
		}

		hints, err := r.PendingChatHints(time.Unix(f.clock.Load(), 0), 100)
		if err != nil {
			return err
		}

		for _, old := range oldHints {
			found := false
			for _, hint := range hints {
				found = found || old.ID == hint.ID
			}

			if !found {
				t.Fatal("failed replacement deleted pending intent")
			}
		}

		return nil
	}))
	must(t, f.app.MaintainChat(ctx))
	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		stream, err := r.ChatStream(id)
		if err != nil {
			return err
		}

		if stream.Epoch != before.Epoch || stream.RetainedAfter != before.LatestSequence {
			t.Fatal("retention boundary", stream)
		}

		if _, err := r.ChatChanges(id, 0, stream.LatestSequence, 100); !errors.Is(err, meetings.ErrChangeCursorInvalid) {
			t.Fatal("pruned cursor accepted", err)
		}

		pending, err := r.PendingChatHints(time.Unix(f.clock.Load(), 0), 100)
		if err != nil {
			return err
		}

		replacements := 0
		for _, hint := range pending {
			for _, old := range oldHints {
				if hint.ID == old.ID {
					t.Fatal("expired intent not replaced")
				}
			}

			if hint.Invalidation {
				replacements++
				if hint.Epoch != stream.Epoch || hint.LatestSequence != stream.LatestSequence {
					t.Fatal("stale replacement", hint)
				}
			}
		}

		if replacements != 2 {
			t.Fatal("missing current meeting/private invalidation", replacements)
		}

		return nil
	}))
	_, err = f.app.Sync(ctx, owner, id, meetings.SyncQuery{Limit: 5, Cursor: first.ChangeCursor})
	assertError(t, err, meetings.ErrSyncResetRequired)
	fresh, err := f.app.Sync(ctx, owner, id, meetings.SyncQuery{Limit: 5})
	must(t, err)
	if len(fresh.Entries) == 0 {
		t.Fatal("journal retention removed history")
	}
}

func TestChatSyncAccountReplayHasCurrentNames(t *testing.T) {
	f := syncFixture(t)
	id := f.created.Details.Meeting.ID
	respond(t, f, meetings.Going, 0, 2)
	initial, err := f.app.Sync(ctx, guest, id, meetings.SyncQuery{Limit: 20})
	must(t, err)
	entry, err := f.app.SendMessage(ctx, owner, id, "body", key(1310), key(1310))
	must(t, err)
	must(t, meetings.NewService(f.store, func() time.Time { return time.Unix(f.clock.Load(), 0) }).RemoveAccount(ctx, owner.ID))
	page, err := f.app.Sync(ctx, guest, id, meetings.SyncQuery{Limit: 100, Cursor: initial.ChangeCursor})
	must(t, err)
	anonymized, invalidated := false, false
	for _, change := range page.Changes {
		invalidated = invalidated || change.Kind == "history_invalidated"
		if change.Projection != nil && change.Projection.Entry != nil && change.Projection.Entry.ID == entry.ID {
			anonymized = change.Projection.Entry.ActorName == meetings.RemovedAccountName
		}
	}

	if !anonymized || !invalidated {
		t.Fatal("replay returned stale identity or omitted invalidation")
	}
}
