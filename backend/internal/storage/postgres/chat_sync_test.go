package postgres

import (
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestChatRetentionAndSyncIntegration(t *testing.T) {
	db, id, now := chatSQLFixture(t)
	owner := meetings.Actor{ID: id + "-owner", Name: "Current"}
	old := now.Add(-8 * 24 * time.Hour)
	requireChatSQL(t, db.Meetings().Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: id, OrganizerID: owner.ID}); err != nil {
			return err
		}

		if _, err := w.AppendEntry(meetings.FeedEntry{ID: id + "-entry", MeetingID: id, ActorID: owner.ID, ActorName: owner.Name, Kind: "message", Payload: []byte(`{"text":"persisted"}`)}); err != nil {
			return err
		}

		if _, err := w.AppendChatChanges(id, "epoch", []meetings.ChatChange{{MeetingID: id, Kind: "entry_upsert", ResourceKind: "entry", ResourceID: id + "-entry", EntryID: id + "-entry", CreatedAt: old}}); err != nil {
			return err
		}

		return w.EnqueueChatHint(meetings.ChatHint{ID: id + "-old", Target: "user", TargetID: owner.ID, MeetingID: id, Epoch: "epoch", LatestSequence: 1, SchemaVersion: 1, CreatedAt: old, AvailableAt: old})
	}))
	key := []byte(strings.Repeat("k", 32))
	app := meetings.NewService(db.Meetings(), func() time.Time { return now }, meetings.WithChatSyncKey(key))
	initial, err := app.Sync(t.Context(), owner, id, meetings.SyncQuery{Limit: 2})
	requireChatSQL(t, err)
	requireChatSQL(t, db.Meetings().Update(t.Context(), func(w meetings.Writer) error {
		_, err := w.AppendChatChanges(id, "ignored", []meetings.ChatChange{{MeetingID: id, Kind: "history_invalidated", CreatedAt: old}, {MeetingID: id, Kind: "meeting_changed", ResourceKind: "meeting", ResourceID: id, CreatedAt: now}})
		return err
	}))
	before, err := app.Sync(t.Context(), owner, id, meetings.SyncQuery{Limit: 1, Cursor: initial.ChangeCursor})
	requireChatSQL(t, err)
	if !before.HasMore {
		t.Fatal("missing fixed barrier")
	}

	requireChatSQL(t, app.MaintainChat(t.Context()))
	_, err = app.Sync(t.Context(), owner, id, meetings.SyncQuery{Limit: 1, Cursor: initial.ChangeCursor})
	if !errors.Is(err, meetings.ErrSyncResetRequired) {
		t.Fatal("retained cursor accepted", err)
	}

	fresh, err := app.Sync(t.Context(), owner, id, meetings.SyncQuery{Limit: 2})
	requireChatSQL(t, err)
	if len(fresh.Entries) != 1 || fresh.Entries[0].ID != id+"-entry" {
		t.Fatal("retention erased history")
	}

	requireChatSQL(t, db.Meetings().View(t.Context(), func(r meetings.Reader) error {
		stream, err := r.ChatStream(id)
		if err != nil {
			return err
		}

		if stream.RetainedAfter != 2 || stream.LatestSequence != 3 || stream.Epoch != "epoch" {
			t.Fatal("retention stream", stream)
		}

		hints, err := r.PendingChatHints(now, 100)
		if err != nil {
			return err
		}

		replaced := false
		for _, h := range hints {
			if h.ID == id+"-old" {
				t.Fatal("old hint survived")
			}

			replaced = replaced || (h.MeetingID == id && h.Invalidation && h.LatestSequence == 3)
		}

		if !replaced {
			t.Fatal("current invalidation absent")
		}

		return nil
	}))
	stop := errors.New("abort retention")
	err = db.Meetings().Update(t.Context(), func(w meetings.Writer) error {
		if _, err := w.TrimChatStream(id, now.Add(time.Second), 1); err != nil {
			return err
		}

		if err := w.DeleteChatHints([]string{id + "-old"}); err != nil {
			return err
		}

		return stop
	})
	if !errors.Is(err, stop) {
		t.Fatal(err)
	}

	requireChatSQL(t, db.Meetings().View(t.Context(), func(r meetings.Reader) error {
		stream, err := r.ChatStream(id)
		if err == nil && stream.RetainedAfter != 2 {
			t.Fatal("retention escaped rollback")
		}

		return err
	}))
	// Epoch mismatch is distinct from a malformed signature; authorization still precedes it.
	requireChatSQL(t, db.Meetings().Update(t.Context(), func(w meetings.Writer) error {
		_, err := w.(*transaction).exec("UPDATE meeting_streams SET epoch='restored-epoch' WHERE meeting_id=$1", id)
		return err
	}))
	_, err = app.Sync(t.Context(), owner, id, meetings.SyncQuery{Limit: 1, Cursor: fresh.ChangeCursor})
	if !errors.Is(err, meetings.ErrSyncResetRequired) {
		t.Fatal("old epoch accepted", err)
	}

	_, err = app.Sync(t.Context(), meetings.Actor{ID: "outsider", Name: "Other"}, id, meetings.SyncQuery{Limit: 1, Cursor: fresh.ChangeCursor})
	if !errors.Is(err, meetings.ErrForbidden) {
		t.Fatal("epoch bypassed access", err)
	}
}

func TestChatLegacyStreamInitializationIntegration(t *testing.T) {
	db, id, now := chatSQLFixture(t)
	actor := meetings.Actor{ID: id + "-owner", Name: "Owner"}
	requireChatSQL(t, db.Meetings().Update(t.Context(), func(w meetings.Writer) error { return w.SaveMeeting(meetings.Meeting{ID: id, OrganizerID: actor.ID}) }))
	app := meetings.NewService(db.Meetings(), func() time.Time { return now }, meetings.WithChatSyncKey([]byte(strings.Repeat("k", 32))))
	first, err := app.Sync(t.Context(), actor, id, meetings.SyncQuery{Limit: 1})
	requireChatSQL(t, err)
	requireChatSQL(t, db.Meetings().Update(t.Context(), func(w meetings.Writer) error {
		stream, err := w.EnsureChatStream(id, "must-not-replace")
		if err == nil && stream.Epoch != first.StreamEpoch {
			t.Fatal("concurrent initializer rotated epoch")
		}

		return err
	}))
	second, err := app.Sync(t.Context(), actor, id, meetings.SyncQuery{Limit: 1})
	requireChatSQL(t, err)
	if first.StreamEpoch == "" || first.StreamEpoch != second.StreamEpoch || second.ProjectionVersion != 0 {
		t.Fatal("legacy initial snapshot", second)
	}
}
