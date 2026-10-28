package meetings_test

import (
	"context"
	"errors"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func independentLegacyReadFixture(t *testing.T) (*memory.Store, *meetings.Service, string, string) {
	t.Helper()
	store := memory.New()
	id, entry := key(30000), key(30001)
	now := time.Date(2026, 10, 27, 12, 0, 0, 0, time.UTC)
	must(t, store.Update(ctx, func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: id, OrganizerID: owner.ID}); err != nil {
			return err
		}
		if err := w.SaveRSVP(meetings.RSVP{MeetingID: id, UserID: guest.ID, Answer: meetings.Going}); err != nil {
			return err
		}
		_, err := w.AppendEntry(meetings.FeedEntry{ID: entry, MeetingID: id, ActorID: owner.ID, Kind: "message", Payload: []byte(`{"text":"legacy"}`)})
		return err
	}))
	app := meetings.NewService(store, func() time.Time { return now }, meetings.WithChatSyncKey([]byte(strings.Repeat("r", 32))), meetings.WithChatReadState(true))
	must(t, app.InitializeChatReadState(ctx))
	return store, app, id, entry
}

func independentStreamAbsent(t *testing.T, s meetings.Store, id string) {
	t.Helper()
	must(t, s.View(ctx, func(r meetings.Reader) error {
		_, err := r.ChatStream(id)
		if !errors.Is(err, meetings.ErrNotFound) {
			t.Fatalf("unauthorized or invalid call created stream: %v", err)
		}
		hints, err := r.PendingChatHints(time.Now(), 100)
		if err == nil && len(hints) != 0 {
			t.Fatal("unexpected hints", hints)
		}
		return err
	}))
}

func TestIndependentLegacyReadInitAuthorizationAndNoEffects(t *testing.T) {
	for _, first := range []string{"receipts", "readers"} {
		t.Run(first, func(t *testing.T) {
			store, app, id, entry := independentLegacyReadFixture(t)
			for _, actor := range []meetings.Actor{guest, outsider} {
				_, err := app.QueryReadReceipts(ctx, actor, id, []string{entry})
				assertError(t, err, meetings.ErrForbidden)
				_, err = app.MessageReaders(ctx, actor, id, entry, "", 1)
				assertError(t, err, meetings.ErrForbidden)
			}
			_, err := app.QueryReadReceipts(ctx, owner, id, []string{entry, key(30002)})
			assertError(t, err, meetings.ErrNotFound)
			_, err = app.MessageReaders(ctx, owner, id, entry, "orphaned-cursor", 1)
			assertError(t, err, meetings.ErrSyncResetRequired)
			independentStreamAbsent(t, store, id)
			var markerBefore meetings.ReadMarker
			must(t, store.View(ctx, func(r meetings.Reader) error {
				var err error
				markerBefore, err = r.ChatReadMarker(id, owner.ID)
				return err
			}))
			if first == "receipts" {
				q, err := app.QueryReadReceipts(ctx, owner, id, []string{entry})
				must(t, err)
				if len(q.Receipts) != 1 || q.Receipts[0].ReaderCount != 0 {
					t.Fatal(q)
				}
			} else {
				q, err := app.MessageReaders(ctx, owner, id, entry, "", 1)
				must(t, err)
				if len(q.UserIDs) != 0 || q.ReaderCount != 0 {
					t.Fatal(q)
				}
			}
			var initialized meetings.ChatStream
			must(t, store.View(ctx, func(r meetings.Reader) error { var err error; initialized, err = r.ChatStream(id); return err }))
			for range 3 {
				_, err := app.QueryReadReceipts(ctx, owner, id, []string{entry})
				must(t, err)
				_, err = app.MessageReaders(ctx, owner, id, entry, "", 1)
				must(t, err)
			}
			must(t, store.View(ctx, func(r meetings.Reader) error {
				s, err := r.ChatStream(id)
				if err != nil {
					return err
				}
				if initialized != s || s.Epoch == "" || s.LatestSequence != 0 {
					t.Fatal("epoch changed or journal created", s)
				}
				m, err := r.ChatReadMarker(id, owner.ID)
				if err != nil {
					return err
				}
				if !reflect.DeepEqual(m, markerBefore) || m.ReadThrough != 0 || m.Baseline != 1 {
					t.Fatal("initialization invented reading", m)
				}
				h, err := r.PendingChatHints(time.Now(), 100)
				if err != nil {
					return err
				}
				if len(h) != 0 {
					t.Fatal("read-only init wrote hints", h)
				}
				changes, err := r.ChatChanges(id, 0, 0, 100)
				if err == nil && len(changes.Changes) != 0 {
					t.Fatal(changes)
				}
				return err
			}))
			t.Log("forbidden/invalid/continuation calls created no stream; authorized first operation initialized stable epoch, baseline1 actual0, zero journal/hints")
		})
	}
}

type independentRevokeAtReadBoundary struct {
	meetings.Store
	afterView, afterUpdate func()
}

func (s *independentRevokeAtReadBoundary) View(c context.Context, fn func(meetings.Reader) error) error {
	err := s.Store.View(c, fn)
	if f := s.afterView; f != nil {
		s.afterView = nil
		f()
	}
	return err
}
func (s *independentRevokeAtReadBoundary) Update(c context.Context, fn func(meetings.Writer) error) error {
	err := s.Store.Update(c, fn)
	if f := s.afterUpdate; f != nil {
		s.afterUpdate = nil
		f()
	}
	return err
}

func TestIndependentLegacyReadInitRechecksAccessAcrossTransactions(t *testing.T) {
	for _, boundary := range []string{"before-init", "after-init"} {
		t.Run(boundary, func(t *testing.T) {
			store, _, id, entry := independentLegacyReadFixture(t)
			wrapped := &independentRevokeAtReadBoundary{Store: store}
			revoke := func() {
				must(t, store.Update(ctx, func(w meetings.Writer) error {
					return w.SaveMeeting(meetings.Meeting{ID: id, OrganizerID: outsider.ID})
				}))
			}
			if boundary == "before-init" {
				wrapped.afterView = revoke
			} else {
				wrapped.afterUpdate = revoke
			}
			app := meetings.NewService(wrapped, time.Now, meetings.WithChatSyncKey([]byte(strings.Repeat("r", 32))), meetings.WithChatReadState(true))
			result, err := app.QueryReadReceipts(ctx, owner, id, []string{entry})
			assertError(t, err, meetings.ErrForbidden)
			if len(result.Receipts) != 0 {
				t.Fatal("partial projection leaked", result)
			}
			if boundary == "before-init" {
				independentStreamAbsent(t, store, id)
			}
			t.Logf("%s revoke rejected before result; no unauthorized aggregate", boundary)
		})
	}
}
