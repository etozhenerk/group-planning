package meetings_test

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestIndependentReadActivationLegacyReceipts(t *testing.T) {
	store := memory.New()
	now := time.Date(2026, 10, 27, 12, 0, 0, 0, time.UTC)
	id := key(5000)
	must(t, store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: id, OrganizerID: owner.ID}); err != nil {
			return err
		}
		if err := w.SaveRSVP(meetings.RSVP{MeetingID: id, UserID: guest.ID, Answer: meetings.Going}); err != nil {
			return err
		}
		for i := range 10000 {
			if _, err := w.AppendEntry(meetings.FeedEntry{ID: key(6000 + i), MeetingID: id, ActorID: owner.ID, Kind: "message", Payload: []byte(`{"text":"legacy"}`)}); err != nil {
				return err
			}
		}
		return nil
	}))
	app := meetings.NewService(store, func() time.Time { return now }, meetings.WithChatSyncKey([]byte(strings.Repeat("r", 32))), meetings.WithChatReadState(true))
	must(t, app.InitializeChatReadState(t.Context()))
	must(t, store.View(t.Context(), func(r meetings.Reader) error {
		s, err := r.ChatReadState(id, guest.ID)
		if err == nil && (s.Baseline != 10000 || s.ReadThrough != 0 || s.UnreadCount != 0) {
			t.Fatal(s)
		}
		return err
	}))
	counts, err := app.QueryReadReceipts(t.Context(), owner, id, []string{key(15999)})
	t.Logf("after activation before any sync: receipts=%+v error=%v", counts, err)
	if err != nil {
		t.Errorf("activated legacy meeting rejects author receipts before sync: %v", err)
	} else if len(counts.Receipts) != 1 || counts.Receipts[0].ReaderCount != 0 {
		t.Error(counts)
	}
	readers, err := app.MessageReaders(t.Context(), owner, id, key(15999), "", 50)
	t.Logf("after activation before any sync: readers=%+v error=%v", readers, err)
	if err != nil {
		t.Errorf("activated legacy meeting rejects author readers before sync: %v", err)
	}
	_, err = app.Sync(t.Context(), owner, id, meetings.SyncQuery{Limit: 1})
	must(t, err)
	counts, err = app.QueryReadReceipts(t.Context(), owner, id, []string{key(15999)})
	must(t, err)
	t.Logf("same receipt query after unrelated sync: %+v", counts)
}

type independentReadHintFault struct {
	meetings.Store
	calls int
}
type independentReadWriter struct {
	meetings.Writer
	parent *independentReadHintFault
}

var independentReadFailure = errors.New("independent second hint failure")

func (s *independentReadHintFault) Update(ctx context.Context, fn func(meetings.Writer) error) error {
	return s.Store.Update(ctx, func(w meetings.Writer) error { return fn(independentReadWriter{w, s}) })
}
func (w independentReadWriter) EnqueueChatHint(h meetings.ChatHint) error {
	w.parent.calls++
	if w.parent.calls == 2 {
		return independentReadFailure
	}
	return w.Writer.EnqueueChatHint(h)
}

func TestIndependentReadLateHintRollbackAndNoop(t *testing.T) {
	f := readFixture(t)
	id := f.created.Details.Meeting.ID
	e, err := f.app.SendMessage(ctx, owner, id, "new", key(16001), key(16001))
	must(t, err)
	var before meetings.ReadState
	must(t, f.store.View(ctx, func(r meetings.Reader) error { var err error; before, err = r.ChatReadState(id, guest.ID); return err }))
	stream, changes, hints := chatState(t, f)
	fault := &independentReadHintFault{Store: f.store}
	app := meetings.NewService(fault, func() time.Time { return time.Unix(f.clock.Load(), 0) }, meetings.WithChatSyncKey([]byte(strings.Repeat("r", 32))), meetings.WithChatReadState(true))
	_, err = app.MarkRead(ctx, guest, id, e.Sequence)
	assertError(t, err, independentReadFailure)
	afterStream, afterChanges, afterHints := chatState(t, f)
	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		s, err := r.ChatReadState(id, guest.ID)
		if err == nil && !reflect.DeepEqual(before, s) {
			t.Fatal("marker survived rollback", s)
		}
		return err
	}))
	if stream != afterStream || !reflect.DeepEqual(changes, afterChanges) || !reflect.DeepEqual(hints, afterHints) {
		t.Fatal("partial journal/outbox survived")
	}
	accepted, err := f.app.MarkRead(ctx, guest, id, e.Sequence)
	must(t, err)
	stream, changes, hints = chatState(t, f)
	f.clock.Add(60)
	noop, err := f.app.MarkRead(ctx, guest, id, e.Sequence)
	must(t, err)
	if !reflect.DeepEqual(accepted, noop) {
		t.Fatalf("noop changed marker/timestamp: before=%+v after=%+v", accepted, noop)
	}
	afterStream, afterChanges, afterHints = chatState(t, f)
	if stream != afterStream || !reflect.DeepEqual(changes, afterChanges) || !reflect.DeepEqual(hints, afterHints) {
		t.Fatal("noop created effects")
	}
	t.Logf("second-hint failure rolled back marker/journal/outbox; successful marker=%d; +60s noop unchanged", accepted.ReadThrough)
}

func TestIndependentReadersPaginationRevokeAndScopedCursor(t *testing.T) {
	f := readFixture(t)
	id := f.created.Details.Meeting.ID
	e, err := f.app.SendMessage(ctx, owner, id, "readers", key(16002), key(16002))
	must(t, err)
	must(t, f.store.Update(ctx, func(w meetings.Writer) error {
		for i := range 103 {
			u := fmt.Sprintf("reader-%03d", i)
			if err := w.SaveRSVP(meetings.RSVP{MeetingID: id, UserID: u, Answer: meetings.Going}); err != nil {
				return err
			}
			if _, err := w.EnsureChatReadMarker(id, u, time.Now()); err != nil {
				return err
			}
			if _, _, err := w.AdvanceChatReadMarker(id, u, e.Sequence, time.Now()); err != nil {
				return err
			}
		}
		return nil
	}))
	page, err := f.app.MessageReaders(ctx, owner, id, e.ID, "", 50)
	must(t, err)
	if len(page.UserIDs) != 50 || page.ReaderCount != 103 || page.NextCursor == "" {
		t.Fatal(page)
	}
	// The saved cursor must not resurrect removed readers on subsequent pages.
	must(t, f.store.Update(ctx, func(w meetings.Writer) error {
		if err := w.SaveRSVP(meetings.RSVP{MeetingID: id, UserID: "reader-050", Answer: meetings.NotGoing}); err != nil {
			return err
		}
		return nil
	}))
	must(t, meetings.NewService(f.store, time.Now).RemoveAccount(ctx, "reader-051"))
	next, err := f.app.MessageReaders(ctx, owner, id, e.ID, page.NextCursor, 50)
	must(t, err)
	if len(next.UserIDs) != 50 || next.ReaderCount != 101 || next.UserIDs[0] != "reader-052" || next.NextCursor == "" {
		t.Fatal(next)
	}
	last, err := f.app.MessageReaders(ctx, owner, id, e.ID, next.NextCursor, 50)
	must(t, err)
	if len(last.UserIDs) != 1 || last.UserIDs[0] != "reader-102" || last.NextCursor != "" {
		t.Fatal(last)
	}
	_, err = f.app.MessageReaders(ctx, guest, id, e.ID, page.NextCursor, 50)
	assertError(t, err, meetings.ErrForbidden)
	_, err = f.app.MessageReaders(ctx, outsider, id, e.ID, page.NextCursor, 50)
	assertError(t, err, meetings.ErrForbidden)
	f.clock.Add(int64(7 * 24 * time.Hour / time.Second))
	_, err = f.app.MessageReaders(ctx, owner, id, e.ID, page.NextCursor, 50)
	assertError(t, err, meetings.ErrSyncResetRequired)
	t.Log("103 readers -> current101 after revoke/delete; pages 50/50/1; nonauthor/outsider denied; exact 7d expiry reset")
}

func TestIndependentReadDisableReenablePreservesBaseline(t *testing.T) {
	f := readFixture(t)
	id := f.created.Details.Meeting.ID
	e, err := f.app.SendMessage(ctx, owner, id, "before flag off", key(16500), key(16500))
	must(t, err)
	initial, err := f.app.MarkRead(ctx, guest, id, e.Sequence)
	must(t, err)
	off := meetings.NewService(f.store, func() time.Time { return time.Unix(f.clock.Load(), 0) }, meetings.WithChatSyncKey([]byte(strings.Repeat("r", 32))))
	_, err = off.MarkRead(ctx, guest, id, e.Sequence)
	assertError(t, err, meetings.ErrNotFound)
	if off.ChatReadStateEnabled() {
		t.Fatal("disabled flag true")
	}
	newer, err := off.SendMessage(ctx, owner, id, "arrived while disabled", key(16501), key(16501))
	must(t, err)
	must(t, f.app.InitializeChatReadState(ctx))
	must(t, f.app.InitializeChatReadState(ctx))
	snapshot, err := f.app.Sync(ctx, guest, id, meetings.SyncQuery{Limit: 10})
	must(t, err)
	if snapshot.ReadState.Baseline != initial.Baseline || snapshot.ReadState.ReadThrough != initial.ReadThrough || snapshot.ReadState.UnreadCount != 1 || snapshot.ReadState.FirstUnread != newer.ID {
		t.Fatal("reenable reset", snapshot.ReadState)
	}
	if meetings.NewService(f.store, time.Now, meetings.WithChatReadState(true)).ChatReadStateEnabled() {
		t.Fatal("read without signing key enabled")
	}
	t.Log("disabled endpoint denied; two reactivations preserve baseline/actual and disabled-period message remains unread")
}
