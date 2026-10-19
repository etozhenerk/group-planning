package memory_test

import (
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func entry(id string) meetings.FeedEntry {
	return meetings.FeedEntry{ID: id, MeetingID: "meeting", ActorID: "friend", Kind: "message", Payload: json.RawMessage(`{"text":"hello"}`)}
}

func createMeeting(t *testing.T, store *memory.Store) {
	t.Helper()
	err := store.Update(t.Context(), func(tx meetings.Writer) error {
		return tx.SaveMeeting(meetings.Meeting{ID: "meeting", OrganizerID: "owner", Title: "Together"})
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestAtomicCommitAndRollback(t *testing.T) {
	store := memory.New()
	failure := errors.New("operation failed")
	key := meetings.RequestKey{UserID: "friend", Operation: "rsvp:meeting", Key: "request"}
	write := func(tx meetings.Writer) error {
		if err := tx.SaveMeeting(meetings.Meeting{ID: "meeting", Title: "Together"}); err != nil {
			return err
		}
		if err := tx.InsertInvitation(meetings.Invitation{ID: "invite", MeetingID: "meeting", Token: "private-test-token"}); err != nil {
			return err
		}
		if err := tx.SaveRSVP(meetings.RSVP{MeetingID: "meeting", UserID: "friend", Answer: meetings.Going}); err != nil {
			return err
		}
		if _, err := tx.AppendEntry(entry("message")); err != nil {
			return err
		}
		return tx.InsertReceipt(meetings.Receipt{Key: key, RequestHash: "body", ResourceID: "meeting"})
	}
	err := store.Update(t.Context(), func(tx meetings.Writer) error {
		if err := write(tx); err != nil {
			return err
		}
		return failure
	})
	if !errors.Is(err, failure) {
		t.Fatalf("rollback error: %v", err)
	}
	err = store.View(t.Context(), func(tx meetings.Reader) error {
		for _, lookup := range []func() error{
			func() error { _, err := tx.Meeting("meeting"); return err },
			func() error { _, err := tx.InvitationByToken("private-test-token"); return err },
			func() error { _, err := tx.RSVP("meeting", "friend"); return err },
			func() error { _, err := tx.Receipt(key); return err },
		} {
			if err := lookup(); !errors.Is(err, meetings.ErrNotFound) {
				return fmt.Errorf("rolled-back record remains: %v", err)
			}
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	// Reusing every ID proves rollback includes indexes and the feed sequence.
	if err := store.Update(t.Context(), write); err != nil {
		t.Fatal(err)
	}
	err = store.View(t.Context(), func(tx meetings.Reader) error {
		all, err := tx.Meetings()
		if err != nil || len(all) != 1 {
			return fmt.Errorf("committed meetings: %v, %v", all, err)
		}
		responses, err := tx.RSVPs("meeting")
		if err != nil || len(responses) != 1 || responses[0].Answer != meetings.Going {
			return fmt.Errorf("committed responses: %v, %v", responses, err)
		}
		feed, err := tx.Feed("meeting")
		if err != nil || len(feed) != 1 || feed[0].Sequence != 1 {
			return fmt.Errorf("committed feed: %v, %v", feed, err)
		}
		_, err = tx.Receipt(key)
		return err
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestCopiesDoNotModifyStorage(t *testing.T) {
	store := memory.New()
	startsAt := time.Date(2026, 10, 24, 16, 0, 0, 0, time.UTC)
	expected := startsAt
	message := entry("message")
	err := store.Update(t.Context(), func(tx meetings.Writer) error {
		if err := tx.SaveMeeting(meetings.Meeting{ID: "meeting", StartsAt: &startsAt}); err != nil {
			return err
		}
		written, err := tx.AppendEntry(message)
		if err != nil {
			return err
		}
		written.Payload[0] = '!'
		message.Payload[0] = '?'
		startsAt = startsAt.Add(time.Hour)
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	for range 2 {
		err = store.View(t.Context(), func(tx meetings.Reader) error {
			meeting, err := tx.Meeting("meeting")
			if err != nil || meeting.StartsAt == nil || !meeting.StartsAt.Equal(expected) {
				return fmt.Errorf("changed stored date: %+v, %v", meeting, err)
			}
			*meeting.StartsAt = meeting.StartsAt.Add(24 * time.Hour)
			feed, err := tx.Feed("meeting")
			if err != nil || len(feed) != 1 || string(feed[0].Payload) != `{"text":"hello"}` {
				return fmt.Errorf("changed stored payload: %+v, %v", feed, err)
			}
			feed[0].Payload[0] = '!'
			return nil
		})
		if err != nil {
			t.Fatal(err)
		}
	}
}

func TestConcurrentUpdatesPreserveAllChanges(t *testing.T) {
	store := memory.New()
	createMeeting(t, store)
	const workers = 40
	var group sync.WaitGroup
	errorsCh := make(chan error, workers)
	for i := range workers {
		group.Go(func() {
			err := store.Update(t.Context(), func(tx meetings.Writer) error {
				meeting, err := tx.Meeting("meeting")
				if err != nil {
					return err
				}
				meeting.Revision++
				if err := tx.SaveMeeting(meeting); err != nil {
					return err
				}
				_, err = tx.AppendEntry(entry(fmt.Sprintf("message-%d", i)))
				return err
			})
			errorsCh <- err
		})
	}
	group.Wait()
	close(errorsCh)
	for err := range errorsCh {
		if err != nil {
			t.Fatal(err)
		}
	}
	err := store.View(t.Context(), func(tx meetings.Reader) error {
		meeting, err := tx.Meeting("meeting")
		if err != nil || meeting.Revision != workers {
			return fmt.Errorf("lost update: %+v, %v", meeting, err)
		}
		feed, err := tx.Feed("meeting")
		if err != nil || len(feed) != workers {
			return fmt.Errorf("lost entries: %d, %v", len(feed), err)
		}
		for i, item := range feed {
			if item.Sequence != uint64(i+1) {
				return fmt.Errorf("out-of-order entry: %+v", item)
			}
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestReadSnapshotAndClosedTransactions(t *testing.T) {
	store := memory.New()
	createMeeting(t, store)
	var retained meetings.Reader
	err := store.View(t.Context(), func(tx meetings.Reader) error {
		retained = tx
		if err := tx.(meetings.Writer).SaveMeeting(meetings.Meeting{ID: "wrong"}); !errors.Is(err, meetings.ErrReadOnly) {
			return fmt.Errorf("write through read-only view: %v", err)
		}
		committed := make(chan error, 1)
		go func() {
			committed <- store.Update(t.Context(), func(writer meetings.Writer) error {
				return writer.SaveMeeting(meetings.Meeting{ID: "meeting", Title: "Changed"})
			})
		}()
		if err := <-committed; err != nil {
			return err
		}
		meeting, err := tx.Meeting("meeting")
		if err != nil || meeting.Title != "Together" {
			return fmt.Errorf("view is not a snapshot: %+v, %v", meeting, err)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := retained.Meeting("meeting"); !errors.Is(err, meetings.ErrTransactionClosed) {
		t.Fatalf("retained reader: %v", err)
	}
	var retainedWriter meetings.Writer
	if err := store.Update(t.Context(), func(tx meetings.Writer) error { retainedWriter = tx; return nil }); err != nil {
		t.Fatal(err)
	}
	if err := retainedWriter.SaveMeeting(meetings.Meeting{ID: "late"}); !errors.Is(err, meetings.ErrTransactionClosed) {
		t.Fatalf("retained writer: %v", err)
	}
}

func TestNewInstanceStartsEmpty(t *testing.T) {
	first := memory.New()
	createMeeting(t, first)
	err := memory.New().View(t.Context(), func(tx meetings.Reader) error {
		_, err := tx.Meeting("meeting")
		return err
	})
	if !errors.Is(err, meetings.ErrNotFound) {
		t.Fatalf("state leaked into another instance: %v", err)
	}
}
