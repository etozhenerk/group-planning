package meetings_test

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func chatState(t *testing.T, f *fixture) (meetings.ChatStream, []meetings.ChatChange, []meetings.ChatHint) {
	t.Helper()
	var stream meetings.ChatStream
	var changes []meetings.ChatChange
	var hints []meetings.ChatHint
	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		var err error
		stream, err = r.ChatStream(f.created.Details.Meeting.ID)
		if err != nil {
			return err
		}

		after := uint64(0)
		for {
			page, err := r.ChatChanges(stream.MeetingID, after, stream.LatestSequence, 100)
			if err != nil {
				return err
			}

			changes = append(changes, page.Changes...)
			if !page.HasMore {
				break
			}

			after = page.Changes[len(page.Changes)-1].Sequence
		}

		hints, err = r.PendingChatHints(time.Unix(f.clock.Load(), 0), 100)

		return err
	}))

	return stream, changes, hints
}

func TestChatJournalMessageCommitAndNoop(t *testing.T) {
	f := setup(t)
	id := f.created.Details.Meeting.ID
	initial, _, beforeHints := chatState(t, f)
	// Guard inherited full Feed as in the bounded regression: journaling must not
	// reintroduce a history scan on every message.
	f.app = meetings.NewService(boundedStore{f.store}, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	entry, err := f.app.SendMessage(ctx, owner, id, "secret message", key(900), key(900))
	must(t, err)
	stream, changes, hints := chatState(t, f)
	if stream.Epoch == "" || stream.Epoch != initial.Epoch || stream.LatestSequence != initial.LatestSequence+1 {
		t.Fatal("stream identity/order", stream)
	}

	last := changes[len(changes)-1]
	if last.Kind != "entry_upsert" || last.EntryID != entry.ID || last.ResourceID != entry.ID || last.Sequence != stream.LatestSequence {
		t.Fatal("missing entry reference", last)
	}

	if len(hints) != len(beforeHints)+2 {
		t.Fatal("one meeting + one private hint expected", len(hints))
	}

	for _, expired := range []bool{false, true} {
		if expired {
			f.clock.Add(int64(31 * 24 * time.Hour / time.Second))
		}

		_, err = f.app.SendMessage(ctx, owner, id, "secret message", key(900), key(900))
		must(t, err)
		replay, _, retryHints := chatState(t, f)
		if replay != stream || len(retryHints) != len(hints) {
			t.Fatal("retry emitted changes", expired)
		}
	}

	_, err = f.app.SendMessage(ctx, owner, id, "changed", key(900), key(900))
	assertError(t, err, meetings.ErrIdempotencyConflict)
}

var errChatOutbox = errors.New("outbox unavailable")

type (
	failedOutboxStore  struct{ meetings.Store }
	failedOutboxWriter struct{ meetings.Writer }
)

func (w failedOutboxWriter) EnqueueChatHint(meetings.ChatHint) error { return errChatOutbox }
func (s failedOutboxStore) Update(c context.Context, fn func(meetings.Writer) error) error {
	return s.Store.Update(c, func(w meetings.Writer) error { return fn(failedOutboxWriter{w}) })
}

func TestChatJournalOutboxFailureRollsBackMessage(t *testing.T) {
	f := setup(t)
	before, _, hints := chatState(t, f)
	app := meetings.NewService(failedOutboxStore{f.store}, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	_, err := app.SendMessage(ctx, owner, before.MeetingID, "secret", key(901), key(901))
	assertError(t, err, errChatOutbox)
	after, _, pending := chatState(t, f)
	if before != after || len(hints) != len(pending) {
		t.Fatal("journal/outbox escaped rollback")
	}

	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		_, err := r.MessageByRequest(before.MeetingID, owner.ID, key(901))
		if !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("message escaped rollback", err)
		}

		return nil
	}))
}

func TestChatJournalReferencePrivacy(t *testing.T) {
	f := setup(t)
	_, err := f.app.SendMessage(ctx, owner, f.created.Details.Meeting.ID, "sensitive-body", key(902), key(902))
	must(t, err)
	_, changes, hints := chatState(t, f)
	data, err := json.Marshal(struct {
		Changes []meetings.ChatChange
		Hints   []meetings.ChatHint
	}{changes, hints})
	must(t, err)
	for _, secret := range []string{"sensitive-body", owner.Name, f.created.InvitationToken} {
		if strings.Contains(string(data), secret) {
			t.Fatal("private projection copied into journal")
		}
	}
}

func journalSince(t *testing.T, f *fixture, after uint64) []meetings.ChatChange {
	t.Helper()
	_, all, _ := chatState(t, f)
	result := []meetings.ChatChange{}
	for _, c := range all {
		if c.Sequence > after {
			result = append(result, c)
		}
	}

	return result
}

func TestChatJournalCardsNoopsAndWorker(t *testing.T) {
	f := setup(t)
	respond(t, f, meetings.Going, 0, 2)
	poll := newPoll(t, f, true, true)
	before, _, _ := chatState(t, f)
	pollVote(t, f, owner, poll, []string{poll.Options[0].Option.ID}, 0, 930)
	changes := journalSince(t, f, before.LatestSequence)
	if len(changes) != 1 || changes[0].ResourceKind != "date_poll" || changes[0].ResourceID != poll.ID {
		t.Fatal("private vote must invalidate the old card only", changes)
	}

	before, _, _ = chatState(t, f)
	pollVote(t, f, owner, poll, []string{poll.Options[0].Option.ID}, 1, 931)
	if len(journalSince(t, f, before.LatestSequence)) != 0 {
		t.Fatal("no-op ballot emitted a change")
	}

	// Job bookkeeping must not masquerade as a visible poll change.
	must(t, f.store.Update(ctx, func(w meetings.Writer) error {
		p, err := w.DatePoll(poll.ID)
		if err != nil {
			return err
		}

		p.CloseJob.State = meetings.TransitionFailed

		return w.SaveDatePoll(p)
	}))
	must(t, f.app.RetryDatePollClose(ctx, poll.ID))
	if len(journalSince(t, f, before.LatestSequence)) != 0 {
		t.Fatal("poll retry lease emitted a change")
	}

	f.clock.Store(poll.ClosesAt.Unix())
	must(t, f.app.CloseDatePoll(ctx, poll.ID))
	changes = journalSince(t, f, before.LatestSequence)
	found := false
	for _, change := range changes {
		if change.ResourceKind == "date_poll" && change.ResourceID == poll.ID {
			found = true
		}
	}

	if !found {
		t.Fatal("close worker omitted old card", changes)
	}

	before, _, _ = chatState(t, f)
	must(t, f.app.CloseDatePoll(ctx, poll.ID))
	if len(journalSince(t, f, before.LatestSequence)) != 0 {
		t.Fatal("duplicate close emitted a change")
	}

	f2 := setup(t)
	f2.clock.Store(currentMeeting(t, f2).PastAt.Unix())
	baseline, _, _ := chatState(t, f2)
	job, err := f2.app.ClaimTransition(ctx, meetings.DefaultTransitionOptions())
	must(t, err)
	if len(journalSince(t, f2, baseline.LatestSequence)) != 0 {
		t.Fatal("claim emitted chat event")
	}

	must(t, f2.app.CompleteTransition(ctx, job))
	changes = journalSince(t, f2, baseline.LatestSequence)
	if len(changes) != 1 || changes[0].Kind != "meeting_changed" {
		t.Fatal("completion omitted status", changes)
	}
}

func TestChatJournalMediaReactionAndLeaving(t *testing.T) {
	f, _ := mediaFixture(t)
	id := f.created.Details.Meeting.ID
	respond(t, f, meetings.Going, 0, 2)
	entry, err := f.app.SendMessage(ctx, owner, id, "message", key(940), key(940))
	must(t, err)
	before, _, _ := chatState(t, f)
	_, err = f.app.SetReaction(ctx, guest, id, entry.ID, "👍", true, key(941))
	must(t, err)
	changes := journalSince(t, f, before.LatestSequence)
	if len(changes) != 1 || changes[0].EntryID != entry.ID {
		t.Fatal("reaction not tied to original entry", changes)
	}

	before, _, _ = chatState(t, f)
	_, err = f.app.SetReaction(ctx, guest, id, entry.ID, "👍", true, key(942))
	must(t, err)
	if len(journalSince(t, f, before.LatestSequence)) != 0 {
		t.Fatal("same reaction emitted change")
	}

	item := reservePhoto(t, f, guest, "message", 943)
	_, err = f.app.UploadMedia(ctx, guest, id, item.ID, "image/png", mediaPhoto(t))
	must(t, err)
	if len(journalSince(t, f, before.LatestSequence)) != 0 {
		t.Fatal("pending upload emitted chat change")
	}

	published, err := f.app.PublishMedia(ctx, guest, id, item.ID, key(944))
	must(t, err)
	changes = journalSince(t, f, before.LatestSequence)
	if len(changes) != 1 || published.Entry == nil || changes[0].EntryID != published.Entry.ID {
		t.Fatal("media must coalesce onto committed entry", changes)
	}

	before, _, _ = chatState(t, f)
	for _, expired := range []bool{false, true} {
		if expired {
			f.clock.Add(int64(31 * 24 * time.Hour / time.Second))
		}

		_, err = f.app.PublishMedia(ctx, guest, id, item.ID, key(944))
		must(t, err)
		if len(journalSince(t, f, before.LatestSequence)) != 0 {
			t.Fatal("media retry emitted change", expired)
		}
	}

	respond(t, f, meetings.NotGoing, 1, 945)
	changes = journalSince(t, f, before.LatestSequence)
	invalidated := false
	for _, change := range changes {
		if change.Kind == "history_invalidated" {
			invalidated = true
		}
	}

	_, _, hints := chatState(t, f)
	notified := false
	for _, hint := range hints {
		if hint.Target == "user" && hint.TargetID == guest.ID && hint.LatestSequence > before.LatestSequence {
			notified = true
		}
	}

	if !invalidated || !notified {
		t.Fatal("revoked member/projections not invalidated")
	}
}

func TestChatJournalCoalescesEveryResourceOnAccountRemoval(t *testing.T) {
	f := setup(t)
	id := f.created.Details.Meeting.ID
	respond(t, f, meetings.Going, 0, 2)
	taskIDs := map[string]bool{}
	for i := range 2 {
		task, err := f.app.CreatePreparationTask(ctx, owner, id, meetings.CreatePreparationTaskInput{Title: "private task"}, key(950+i))
		must(t, err)
		taskIDs[task.Task.ID] = true
	}

	date := newPoll(t, f, true, true)
	place := newPlacePoll(t, f)
	before, _, _ := chatState(t, f)
	must(t, f.app.RemoveAccount(ctx, owner.ID))
	changes := journalSince(t, f, before.LatestSequence)
	invalidated := false
	resources := map[string]bool{}
	for _, change := range changes {
		resources[change.ResourceID] = true
		if change.Kind == "history_invalidated" {
			invalidated = true
		}
	}

	for id := range taskIDs {
		if !resources[id] {
			t.Fatal("coalescing lost task", id)
		}
	}

	if !resources[date.ID] || !resources[place.ID] || !invalidated {
		t.Fatal("coalescing lost poll/history invalidation", changes)
	}

	_, _, hints := chatState(t, f)
	for _, hint := range hints {
		if hint.Target == "user" && hint.TargetID == owner.ID {
			t.Fatal("removed recipient survived")
		}
	}

	before, _, _ = chatState(t, f)
	must(t, f.app.RemoveAccount(ctx, owner.ID))
	if len(journalSince(t, f, before.LatestSequence)) != 0 {
		t.Fatal("repeat deletion emitted changes")
	}
}

func TestChatAroundChecksAccessBeforeAnchor(t *testing.T) {
	f := setup(t)
	id := f.created.Details.Meeting.ID
	entries := []meetings.FeedEntry{}
	for i := range 8 {
		entry, err := f.app.SendMessage(ctx, owner, id, "line", key(960+i), key(960+i))
		must(t, err)
		entries = append(entries, entry)
	}

	f.app = meetings.NewService(boundedStore{f.store}, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	window, err := f.app.FeedAround(ctx, owner, id, entries[3].ID, 5)
	must(t, err)
	if len(window.Entries) != 5 || window.Entries[2].ID != entries[3].ID || !window.HasOlder || !window.HasNewer {
		t.Fatal("around did not center", window)
	}

	_, err = f.app.FeedAround(ctx, outsider, id, "missing", 5)
	assertError(t, err, meetings.ErrForbidden)
	_, err = f.app.FeedAround(ctx, owner, id, "missing", 5)
	assertError(t, err, meetings.ErrNotFound)
}

func TestChatJournalTerminalHintAfterMeetingRemoval(t *testing.T) {
	f := setup(t)
	id := f.created.Details.Meeting.ID
	respond(t, f, meetings.Going, 0, 2)
	_, err := f.app.Respond(ctx, outsider, "", f.created.InvitationToken, meetings.NotGoing, 0, key(980))
	must(t, err)
	before, _, _ := chatState(t, f)
	must(t, f.app.RemoveAccount(ctx, owner.ID))
	must(t, f.app.RemoveAccount(ctx, guest.ID))
	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		if _, err := r.ChatStream(id); !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("deleted stream", err)
		}

		hints, err := r.PendingChatHints(time.Unix(f.clock.Load(), 0), 100)
		if err != nil {
			return err
		}

		terminal := false
		for _, hint := range hints {
			if hint.MeetingID != id {
				continue
			}

			if hint.Target == "meeting" || hint.TargetID == owner.ID || hint.TargetID == guest.ID {
				t.Fatal("stale target survived", hint)
			}

			terminal = terminal || (hint.Target == "user" && hint.TargetID == outsider.ID && hint.Terminal && hint.Epoch == before.Epoch)
		}

		if !terminal {
			t.Fatal("remaining private client did not receive terminal invalidation")
		}

		return nil
	}))
}
