package memory

import (
	"errors"
	"math"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestIndependentReadSparseUint64MessageBoundary(t *testing.T) {
	s := New()
	now := time.Date(2026, 10, 27, 12, 0, 0, 0, time.UTC)
	id := "d3c50000-0000-4000-8000-000000029000"
	a := meetings.Actor{ID: "author", Name: "A"}
	b := meetings.Actor{ID: "reader", Name: "B"}
	run := func(fn func(meetings.Writer) error) {
		t.Helper()
		if err := s.Update(t.Context(), fn); err != nil {
			t.Fatal(err)
		}
	}
	run(func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: id, OrganizerID: a.ID}); err != nil {
			return err
		}
		if err := w.SaveRSVP(meetings.RSVP{MeetingID: id, UserID: b.ID, Answer: meetings.Going}); err != nil {
			return err
		}
		if _, err := w.EnsureChatStream(id, "independent-epoch"); err != nil {
			return err
		}
		for i, kind := range []string{"system", "message", "message"} {
			if _, err := w.AppendEntry(meetings.FeedEntry{ID: []string{"system", "d3c50000-0000-4000-8000-000000029001", "d3c50000-0000-4000-8000-000000029002"}[i], MeetingID: id, ActorID: a.ID, Kind: kind, Payload: []byte(`{}`)}); err != nil {
				return err
			}
		}
		return nil
	})
	s.data.feed[id][0].Sequence = 1
	s.data.feed[id][1].Sequence = 9007199254740993
	s.data.feed[id][2].Sequence = math.MaxUint64
	app := meetings.NewService(s, func() time.Time { return now }, meetings.WithChatSyncKey([]byte(strings.Repeat("q", 32))), meetings.WithChatReadState(true))
	if err := app.InitializeChatReadState(t.Context()); err != nil {
		t.Fatal(err)
	}
	for _, seq := range []uint64{0, 1, 2, 9007199254740992, math.MaxUint64 - 1} {
		_, err := app.MarkRead(t.Context(), b, id, seq)
		var invalid meetings.ValidationError
		if !errors.As(err, &invalid) {
			t.Fatalf("invalid sequence%d: %v", seq, err)
		}
	}
	state, err := app.MarkRead(t.Context(), b, id, math.MaxUint64)
	if err != nil {
		t.Fatal(err)
	}
	if state.Baseline != math.MaxUint64 || state.ReadThrough != math.MaxUint64 || state.UnreadCount != 0 {
		t.Fatal(state)
	}
	old, err := app.MarkRead(t.Context(), b, id, 9007199254740993)
	if err != nil || old.ReadThrough != math.MaxUint64 {
		t.Fatal(old, err)
	}
	counts, err := app.QueryReadReceipts(t.Context(), a, id, []string{"d3c50000-0000-4000-8000-000000029001", "d3c50000-0000-4000-8000-000000029002"})
	if err != nil {
		t.Fatal(err)
	}
	if len(counts.Receipts) != 2 || counts.Receipts[0].ReaderCount != 1 || counts.Receipts[1].ReaderCount != 1 {
		t.Fatal(counts)
	}
	t.Log("service actual=18446744073709551615 preserved; >2^53 valid lower retry no-op; gaps/system/zero denied; baseline alone not used for receipts")
}
