package postgres

import (
	"context"
	"errors"
	"fmt"
	"math"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/jackc/pgx/v5/pgxpool"
)

func chatSQLFixture(t *testing.T) (*Database, string, time.Time) {
	t.Helper()
	db := integrationDB(t)
	id := fmt.Sprintf("chat-%x", randBytes(12))
	t.Cleanup(func() {
		ctx := context.Background()
		requireChatSQL(t, db.Meetings().Update(ctx, func(w meetings.Writer) error { return w.DeleteMeeting(id) }))
		_, err := db.pool.Exec(ctx, "DELETE FROM realtime_outbox WHERE meeting_id=$1", id)
		requireChatSQL(t, err)
		_, err = db.pool.Exec(ctx, "DELETE FROM removed_meeting_users WHERE user_id=$1", id+"-owner")
		requireChatSQL(t, err)
	})

	return db, id, time.Now().UTC().Truncate(time.Microsecond)
}

func requireChatSQL(t *testing.T, err error) {
	t.Helper()
	if err != nil {
		t.Fatal(err)
	}
}

func TestChatJournalAtomicRangeIntegration(t *testing.T) {
	db, id, now := chatSQLFixture(t)
	store := db.Meetings()
	change := meetings.ChatChange{MeetingID: id, Kind: "history_invalidated", CreatedAt: now}
	requireChatSQL(t, store.Update(t.Context(), func(w meetings.Writer) error { return w.SaveMeeting(meetings.Meeting{ID: id}) }))
	appendBatch := func(w meetings.Writer) error {
		if _, err := w.AppendChatChanges(id, "stable-epoch", []meetings.ChatChange{change, change, change}); err != nil {
			return err
		}

		return w.EnqueueChatHint(meetings.ChatHint{ID: id, Target: "meeting", TargetID: id, MeetingID: id, Epoch: "stable-epoch", LatestSequence: 3, SchemaVersion: 1, CreatedAt: now, AvailableAt: now})
	}
	stop := errors.New("rollback journal and outbox")
	err := store.Update(t.Context(), func(w meetings.Writer) error {
		if err := appendBatch(w); err != nil {
			return err
		}

		return stop
	})
	if !errors.Is(err, stop) {
		t.Fatal(err)
	}

	requireChatSQL(t, store.View(t.Context(), func(r meetings.Reader) error {
		if _, err := r.ChatStream(id); !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("rolled-back stream exists", err)
		}

		hints, err := r.PendingChatHints(now, 100)
		for _, hint := range hints {
			if hint.MeetingID == id {
				t.Fatal("rolled-back hint exists")
			}
		}

		return err
	}))
	requireChatSQL(t, store.Update(t.Context(), appendBatch))
	var retained meetings.Reader
	requireChatSQL(t, store.View(t.Context(), func(r meetings.Reader) error {
		retained = r
		stream, err := r.ChatStream(id)
		if err != nil {
			return err
		}

		page, err := r.ChatChanges(id, 0, stream.LatestSequence, 2)
		if err != nil {
			return err
		}

		if len(page.Changes) != 2 || !page.HasMore || page.Changes[1].Sequence != 2 {
			t.Fatal("bounded page", page)
		}

		page.Changes[0].Kind = "mutated-copy"
		done := make(chan error, 1)
		go func() {
			done <- store.Update(t.Context(), func(w meetings.Writer) error {
				_, err := w.AppendChatChanges(id, "ignored-epoch", []meetings.ChatChange{change})
				return err
			})
		}()
		if err := <-done; err != nil {
			return err
		}

		next, err := r.ChatChanges(id, 2, stream.LatestSequence, 2)
		if err != nil {
			return err
		}

		if len(next.Changes) != 1 || next.HasMore || next.Changes[0].Sequence != 3 {
			t.Fatal("through boundary", next)
		}

		current, err := r.ChatStream(id)
		if err != nil {
			return err
		}

		if current != stream {
			t.Fatal("snapshot changed", current)
		}

		original, err := r.ChatChanges(id, 0, 1, 1)
		if err != nil {
			return err
		}

		if original.Changes[0].Kind != change.Kind {
			t.Fatal("returned changes alias storage")
		}

		return nil
	}))
	if _, err := retained.ChatStream(id); !errors.Is(err, meetings.ErrTransactionClosed) {
		t.Fatal("closed reader", err)
	}

	pool, err := pgxpool.NewWithConfig(t.Context(), db.pool.Config().Copy())
	requireChatSQL(t, err)
	reopened := &Database{pool: pool}
	defer reopened.Close()
	requireChatSQL(t, reopened.Meetings().View(t.Context(), func(r meetings.Reader) error {
		stream, err := r.ChatStream(id)
		if err == nil && (stream.Epoch != "stable-epoch" || stream.LatestSequence != 4) {
			t.Fatal("epoch after pool restart", stream)
		}

		return err
	}))
	requireChatSQL(t, store.Update(t.Context(), func(w meetings.Writer) error {
		_, err := w.(*transaction).exec("UPDATE meeting_streams SET latest_change_sequence=$2::text::numeric,retained_after=$2::text::numeric WHERE meeting_id=$1", id, fmt.Sprint(uint64(math.MaxUint64-1)))
		return err
	}))
	requireChatSQL(t, store.Update(t.Context(), func(w meetings.Writer) error {
		_, err := w.AppendChatChanges(id, "ignored", []meetings.ChatChange{change})
		return err
	}))
	err = store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: id, Title: "must roll back"}); err != nil {
			return err
		}

		_, err := w.AppendChatChanges(id, "ignored", []meetings.ChatChange{change})

		return err
	})
	if !errors.Is(err, meetings.ErrInvalidRecord) {
		t.Fatal("overflow", err)
	}

	requireChatSQL(t, store.View(t.Context(), func(r meetings.Reader) error {
		m, err := r.Meeting(id)
		if err != nil {
			return err
		}

		if m.Title != "" {
			t.Fatal("overflow committed preceding write")
		}

		page, err := r.ChatChanges(id, math.MaxUint64-1, math.MaxUint64, 1)
		if err != nil {
			return err
		}

		if len(page.Changes) != 1 || page.Changes[0].Sequence != math.MaxUint64 || page.HasMore {
			t.Fatal("uint64 boundary", page)
		}

		if _, err := r.ChatChanges(id, 0, math.MaxUint64, 1); !errors.Is(err, meetings.ErrChangeCursorInvalid) {
			t.Fatal("expired cursor accepted", err)
		}

		return nil
	}))
	canceled, cancel := context.WithCancel(t.Context())
	err = store.View(canceled, func(r meetings.Reader) error { cancel(); _, err := r.PendingChatHints(now, 1); return err })
	if !errors.Is(err, context.Canceled) {
		t.Fatal("canceled read", err)
	}
}

func TestChatAccountOutboxIntegration(t *testing.T) {
	db, id, now := chatSQLFixture(t)
	owner, guest := id+"-owner", id+"-guest"
	requireChatSQL(t, db.Meetings().Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: id, OrganizerID: owner}); err != nil {
			return err
		}

		if err := w.SaveRSVP(meetings.RSVP{MeetingID: id, UserID: guest, Answer: meetings.Going}); err != nil {
			return err
		}

		if err := w.SaveRSVP(meetings.RSVP{MeetingID: id, UserID: id + "-observer", Answer: meetings.NotGoing}); err != nil {
			return err
		}

		if _, err := w.AppendEntry(meetings.FeedEntry{ID: id + "-entry", MeetingID: id, ActorID: owner, ActorName: "Original", Kind: "message", Payload: []byte(`{"text":"private"}`)}); err != nil {
			return err
		}

		if _, err := w.AppendChatChanges(id, "epoch", []meetings.ChatChange{{MeetingID: id, Kind: "history_invalidated", CreatedAt: now}}); err != nil {
			return err
		}

		for _, target := range []string{owner, guest} {
			if err := w.EnqueueChatHint(meetings.ChatHint{ID: target, Target: "user", TargetID: target, MeetingID: id, Epoch: "epoch", SchemaVersion: 1, CreatedAt: now, AvailableAt: now}); err != nil {
				return err
			}
		}

		return nil
	}))
	stop := errors.New("outer identity failure")
	remove := func(abort bool) error {
		return db.Identity().AccountUpdate(t.Context(), db.Meetings(), func(_ identity.Store, m meetings.Store) error {
			if err := meetings.NewService(m, func() time.Time { return now }).RemoveAccount(t.Context(), owner); err != nil {
				return err
			}

			if abort {
				return stop
			}

			return nil
		})
	}
	if err := remove(true); !errors.Is(err, stop) {
		t.Fatal(err)
	}

	requireChatSQL(t, db.Meetings().View(t.Context(), func(r meetings.Reader) error {
		stream, err := r.ChatStream(id)
		if err != nil {
			return err
		}

		if stream.LatestSequence != 1 {
			t.Fatal("outer rollback changed journal")
		}

		removed, err := r.UserRemoved(owner)
		if removed {
			t.Fatal("outer rollback removed user")
		}

		return err
	}))
	requireChatSQL(t, remove(false))
	requireChatSQL(t, db.Meetings().View(t.Context(), func(r meetings.Reader) error {
		stream, err := r.ChatStream(id)
		if err != nil {
			return err
		}

		page, err := r.ChatChanges(id, 1, stream.LatestSequence, 100)
		if err != nil {
			return err
		}

		invalidated := false
		for _, change := range page.Changes {
			invalidated = invalidated || change.Kind == "history_invalidated"
		}

		if stream.Epoch != "epoch" || stream.LatestSequence <= 1 || !invalidated {
			t.Fatal("account invalidation missing", page)
		}

		hints, err := r.PendingChatHints(now, 100)
		if err != nil {
			return err
		}

		for _, hint := range hints {
			if hint.Target == "user" && hint.TargetID == owner {
				t.Fatal("deleted recipient retained")
			}
		}

		return nil
	}))
	requireChatSQL(t, meetings.NewService(db.Meetings(), func() time.Time { return now }).RemoveAccount(t.Context(), guest))
	requireChatSQL(t, db.Meetings().View(t.Context(), func(r meetings.Reader) error {
		if _, err := r.ChatStream(id); !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("deleted meeting stream retained", err)
		}

		return nil
	}))
	requireChatSQL(t, db.Meetings().View(t.Context(), func(r meetings.Reader) error {
		hints, err := r.PendingChatHints(now, 100)
		if err != nil {
			return err
		}

		for _, hint := range hints {
			if hint.Target == "user" && hint.TargetID == id+"-observer" && hint.Terminal && hint.MeetingID == id && hint.Epoch == "epoch" {
				return nil
			}
		}

		return errors.New("terminal hint lost with deleted meeting")
	}))
	_, err := db.pool.Exec(t.Context(), "DELETE FROM removed_meeting_users WHERE user_id=$1", guest)
	requireChatSQL(t, err)
}
