package postgres

import (
	"errors"
	"math"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestChatReadStateAtomicIntegration(t *testing.T) {
	db, id, now := chatSQLFixture(t)
	store := db.Meetings()
	owner, guest := id+"-owner", id+"-guest"
	requireChatSQL(t, store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: id, OrganizerID: owner}); err != nil {
			return err
		}

		if err := w.SaveRSVP(meetings.RSVP{MeetingID: id, UserID: guest, Answer: meetings.Going}); err != nil {
			return err
		}

		_, err := w.EnsureChatStream(id, "read-epoch")

		return err
	}))
	app := meetings.NewService(store, func() time.Time { return now }, meetings.WithChatSyncKey([]byte(strings.Repeat("r", 32))), meetings.WithChatReadState(true))
	requireChatSQL(t, app.InitializeChatReadState(t.Context()))
	entry, err := app.SendMessage(t.Context(), meetings.Actor{ID: owner, Name: "Owner"}, id, "visible", "11000000-0000-4000-8000-000000000001", "11000000-0000-4000-8000-000000000001")
	requireChatSQL(t, err)
	state, err := app.MarkRead(t.Context(), meetings.Actor{ID: guest, Name: "Guest"}, id, entry.Sequence)
	requireChatSQL(t, err)
	if state.ReadThrough != entry.Sequence || state.UnreadCount != 0 {
		t.Fatal("marker", state)
	}

	counts, err := app.QueryReadReceipts(t.Context(), meetings.Actor{ID: owner, Name: "Owner"}, id, []string{entry.ID})
	requireChatSQL(t, err)
	if len(counts.Receipts) != 1 || counts.Receipts[0].ReaderCount != 1 {
		t.Fatal("receipt", counts)
	}

	abort := errors.New("rollback")
	err = store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.RemoveUser(guest); err != nil {
			return err
		}

		return abort
	})
	if !errors.Is(err, abort) {
		t.Fatal(err)
	}

	requireChatSQL(t, store.Update(t.Context(), func(w meetings.Writer) error {
		m, err := w.ChatReadMarker(id, guest)
		if err != nil {
			return err
		}

		if m.ReadThrough != entry.Sequence {
			t.Fatal("rollback changed marker", m)
		}

		_, _, err = w.AdvanceChatReadMarker(id, guest, math.MaxUint64, now)

		return err
	}))
	requireChatSQL(t, store.View(t.Context(), func(r meetings.Reader) error {
		m, err := r.ChatReadMarker(id, guest)
		if err != nil {
			return err
		}

		if m.ReadThrough != math.MaxUint64 {
			t.Fatal("uint64 truncated", m)
		}

		m.ReadThrough = 0
		again, err := r.ChatReadMarker(id, guest)
		if err == nil && again.ReadThrough != math.MaxUint64 {
			t.Fatal("copy aliased")
		}

		return err
	}))
	requireChatSQL(t, store.Update(t.Context(), func(w meetings.Writer) error { return w.RemoveUser(guest) }))
	requireChatSQL(t, store.View(t.Context(), func(r meetings.Reader) error {
		_, err := r.ChatReadMarker(id, guest)
		if !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("removed marker", err)
		}

		return nil
	}))
	_, err = db.pool.Exec(t.Context(), "DELETE FROM removed_meeting_users WHERE user_id=$1", guest)
	requireChatSQL(t, err)
}
