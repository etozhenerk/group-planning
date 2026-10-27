package meetings_test

import (
	"context"
	"errors"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func readFixture(t *testing.T) *fixture {
	t.Helper()
	f := setup(t)
	respond(t, f, meetings.Going, 0, 2)
	_, err := f.app.SendMessage(ctx, owner, f.created.Details.Meeting.ID, "before enable", key(2200), key(2200))
	must(t, err)
	f.app = meetings.NewService(boundedStore{f.store}, func() time.Time { return time.Unix(f.clock.Load(), 0) }, meetings.WithChatSyncKey([]byte(strings.Repeat("r", 32))), meetings.WithChatReadState(true))
	must(t, f.app.InitializeChatReadState(ctx))

	return f
}

func TestChatReadBaselineActualMaxAndNoOp(t *testing.T) {
	f := readFixture(t)
	id := f.created.Details.Meeting.ID
	initial, err := f.app.Sync(ctx, guest, id, meetings.SyncQuery{Limit: 10})
	must(t, err)
	if initial.ReadState == nil || initial.ReadState.ReadThrough != 0 || initial.ReadState.Baseline != initial.LatestSequence || initial.ReadState.UnreadCount != 0 {
		t.Fatal("baseline fabricated reading", initial.ReadState)
	}

	oldID := initial.Entries[len(initial.Entries)-1].ID
	counts, err := f.app.QueryReadReceipts(ctx, owner, id, []string{oldID})
	must(t, err)
	if counts.Receipts[0].ReaderCount != 0 {
		t.Fatal("baseline became receipt")
	}

	first, err := f.app.SendMessage(ctx, owner, id, "new one", key(2201), key(2201))
	must(t, err)
	_, err = f.app.SendMessage(ctx, guest, id, "own", key(2202), key(2202))
	must(t, err)
	last, err := f.app.SendMessage(ctx, owner, id, "new two", key(2203), key(2203))
	must(t, err)
	before, err := f.app.Sync(ctx, guest, id, meetings.SyncQuery{Limit: 10})
	must(t, err)
	if before.ReadState.UnreadCount != 2 || before.ReadState.FirstUnread != first.ID {
		t.Fatal("mixed unread", before.ReadState)
	}

	var group sync.WaitGroup
	for _, sequence := range []uint64{last.Sequence, first.Sequence} {
		group.Go(func() {
			_, err := f.app.MarkRead(ctx, guest, id, sequence)
			if err != nil {
				t.Error(err)
			}
		})
	}

	group.Wait()
	read, err := f.app.MarkRead(ctx, guest, id, first.Sequence)
	must(t, err)
	if read.ReadThrough != last.Sequence || read.UnreadCount != 0 {
		t.Fatal("max lost", read)
	}

	after, err := f.app.Sync(ctx, guest, id, meetings.SyncQuery{Limit: 10})
	must(t, err)
	_, err = f.app.MarkRead(ctx, guest, id, last.Sequence)
	must(t, err)
	noop, err := f.app.Sync(ctx, guest, id, meetings.SyncQuery{Limit: 10, Cursor: after.ChangeCursor})
	must(t, err)
	if len(noop.Changes) != 0 || noop.ProjectionVersion != after.ProjectionVersion {
		t.Fatal("read/sync loop", noop.Changes)
	}

	counts, err = f.app.QueryReadReceipts(ctx, owner, id, []string{first.ID, last.ID})
	must(t, err)
	if len(counts.Receipts) != 2 || counts.Receipts[0].ReaderCount != 1 || counts.Receipts[1].ReaderCount != 1 {
		t.Fatal("actual receipts", counts)
	}

	_, err = f.app.MarkRead(ctx, guest, id, last.Sequence+1)
	var invalid meetings.ValidationError
	if !errors.As(err, &invalid) {
		t.Fatal("future accepted", err)
	}

	_, err = f.app.QueryReadReceipts(ctx, guest, id, []string{first.ID})
	assertError(t, err, meetings.ErrForbidden)
	_, err = f.app.MarkRead(ctx, outsider, id, last.Sequence)
	assertError(t, err, meetings.ErrForbidden)
}

func TestChatReadRejoinReadersAndAccountRemoval(t *testing.T) {
	f := readFixture(t)
	id := f.created.Details.Meeting.ID
	entry, err := f.app.SendMessage(ctx, owner, id, "read me", key(2220), key(2220))
	must(t, err)
	read, err := f.app.MarkRead(ctx, guest, id, entry.Sequence)
	must(t, err)
	readers, err := f.app.MessageReaders(ctx, owner, id, entry.ID, "", 1)
	must(t, err)
	if len(readers.UserIDs) != 1 || readers.UserIDs[0] != guest.ID || readers.ReaderCount != 1 {
		t.Fatal("readers", readers)
	}

	respond(t, f, meetings.NotGoing, 1, 2221)
	readers, err = f.app.MessageReaders(ctx, owner, id, entry.ID, "", 1)
	must(t, err)
	if len(readers.UserIDs) != 0 || readers.ReaderCount != 0 {
		t.Fatal("left participant visible", readers)
	}

	respond(t, f, meetings.Going, 2, 2222)
	rejoin, err := f.app.MarkRead(ctx, guest, id, entry.Sequence)
	must(t, err)
	if rejoin.Baseline != read.Baseline || rejoin.ReadThrough != read.ReadThrough {
		t.Fatal("rejoin reset", rejoin)
	}

	must(t, meetings.NewService(f.store, time.Now).RemoveAccount(ctx, guest.ID))
	readers, err = f.app.MessageReaders(ctx, owner, id, entry.ID, "", 1)
	must(t, err)
	if readers.ReaderCount != 0 || len(readers.UserIDs) != 0 {
		t.Fatal("deleted account exposed", readers)
	}

	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		_, err := r.ChatReadMarker(id, guest.ID)
		if !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("marker retained", err)
		}

		return nil
	}))
}

func TestChatReadSnapshotAnchorCursorScopeAndPrivateHints(t *testing.T) {
	f := readFixture(t)
	id := f.created.Details.Meeting.ID
	first, err := f.app.SendMessage(ctx, owner, id, "first unread", key(2240), key(2240))
	must(t, err)
	for i := range 105 {
		_, err := f.app.SendMessage(ctx, owner, id, "later", key(2241+i), key(2241+i))
		must(t, err)
	}

	snapshot, err := f.app.Sync(ctx, guest, id, meetings.SyncQuery{Limit: 10})
	must(t, err)
	if snapshot.ReadState.FirstUnread != first.ID || len(snapshot.Entries) > 10 || !snapshot.HasNewer {
		t.Fatal("did not anchor near unread", snapshot)
	}

	found := false
	for _, entry := range snapshot.Entries {
		found = found || entry.ID == first.ID
	}

	if !found {
		t.Fatal("unread outside initial window")
	}

	_, err = f.app.MarkRead(ctx, guest, id, first.Sequence)
	must(t, err)
	_, changes, _ := chatState(t, f)
	// Existing fixture backlog can exceed the read limit; inspect new durable hints
	// by clearing only fixture hints before the next advance.
	must(t, f.store.Update(ctx, func(w meetings.Writer) error {
		for {
			hints, err := w.PendingChatHints(time.Unix(f.clock.Load(), 0), 100)
			if err != nil {
				return err
			}

			if len(hints) == 0 {
				return nil
			}

			ids := []string{}
			for _, h := range hints {
				ids = append(ids, h.ID)
			}

			if err := w.DeleteChatHints(ids); err != nil {
				return err
			}
		}
	}))
	if changes[len(changes)-1].Kind != "receipts_changed" {
		t.Fatal("missing receipt invalidation")
	}

	last := snapshot.LatestSequence
	_, err = f.app.MarkRead(ctx, guest, id, last)
	must(t, err)
	_, _, hints := chatState(t, f)
	if len(hints) != 2 {
		t.Fatal("read invalidation fanout", hints)
	}

	for _, hint := range hints {
		if hint.Target == "user" && hint.TargetID != guest.ID {
			t.Fatal("other user's list invalidated", hint)
		}
	}

	_, err = f.app.MarkRead(ctx, guest, id, last)
	must(t, err)
	_, _, noop := chatState(t, f)
	if len(noop) != len(hints) {
		t.Fatal("noop hint loop")
	}

	// Add one more current reader and page by user ID, with cursor scope bound to entry.
	must(t, f.store.Update(ctx, func(w meetings.Writer) error {
		return w.SaveRSVP(meetings.RSVP{MeetingID: id, UserID: outsider.ID, Answer: meetings.Going})
	}))
	_, err = f.app.MarkRead(ctx, outsider, id, last)
	must(t, err)
	page, err := f.app.MessageReaders(ctx, owner, id, first.ID, "", 1)
	must(t, err)
	if len(page.UserIDs) != 1 || page.NextCursor == "" || page.ReaderCount != 2 {
		t.Fatal("reader page", page)
	}

	next, err := f.app.MessageReaders(ctx, owner, id, first.ID, page.NextCursor, 1)
	must(t, err)
	if len(next.UserIDs) != 1 || next.NextCursor != "" || next.UserIDs[0] == page.UserIDs[0] {
		t.Fatal("duplicate reader", next)
	}

	other, err := f.app.SendMessage(ctx, owner, id, "different message", key(2390), key(2390))
	must(t, err)
	_, err = f.app.MessageReaders(ctx, owner, id, other.ID, page.NextCursor, 1)
	assertError(t, err, meetings.ErrSyncCursorInvalid)
	_, err = f.app.MessageReaders(ctx, owner, id, first.ID, page.NextCursor+"x", 1)
	assertError(t, err, meetings.ErrSyncCursorInvalid)
}

type rollbackReadStore struct {
	meetings.Store
	err error
}

func (s rollbackReadStore) Update(ctx context.Context, fn func(meetings.Writer) error) error {
	return s.Store.Update(ctx, func(w meetings.Writer) error {
		if err := fn(w); err != nil {
			return err
		}

		return s.err
	})
}

func TestChatReadCommitFailureRollsBackMarkerJournalAndHints(t *testing.T) {
	f := readFixture(t)
	id := f.created.Details.Meeting.ID
	entry, err := f.app.SendMessage(ctx, owner, id, "pending", key(2400), key(2400))
	must(t, err)
	before, _, hintsBefore := chatState(t, f)
	failure := errors.New("commit failed")
	failed := meetings.NewService(rollbackReadStore{f.store, failure}, time.Now, meetings.WithChatSyncKey([]byte(strings.Repeat("r", 32))), meetings.WithChatReadState(true))
	_, err = failed.MarkRead(ctx, guest, id, entry.Sequence)
	assertError(t, err, failure)
	after, _, hintsAfter := chatState(t, f)
	if before != after || len(hintsBefore) != len(hintsAfter) {
		t.Fatal("rolled-back notification survived")
	}

	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		state, err := r.ChatReadState(id, guest.ID)
		if err == nil && (state.ReadThrough != 0 || state.UnreadCount != 1) {
			t.Fatal("rolled-back read survived", state)
		}

		return err
	}))
}

func TestChatReadActivationRacesMessageWithoutInventedReceipt(t *testing.T) {
	for range 12 {
		f := setup(t)
		id := f.created.Details.Meeting.ID
		respond(t, f, meetings.Going, 0, 2)
		app := meetings.NewService(f.store, time.Now, meetings.WithChatSyncKey([]byte(strings.Repeat("r", 32))), meetings.WithChatReadState(true))
		start := make(chan struct{})
		done := make(chan error, 1)
		go func() { <-start; done <- app.InitializeChatReadState(ctx) }()
		close(start)
		entry, err := f.app.SendMessage(ctx, owner, id, "during activation", key(2420), key(2420))
		must(t, err)
		must(t, <-done)
		must(t, f.store.View(ctx, func(r meetings.Reader) error {
			state, err := r.ChatReadState(id, guest.ID)
			if err != nil {
				return err
			}

			expected := uint64(0)
			if state.Baseline < entry.Sequence {
				expected = 1
			}

			if state.ReadThrough != 0 || state.UnreadCount != expected {
				t.Fatal("activation lost or read message", state, entry.Sequence)
			}

			return nil
		}))
	}
}
