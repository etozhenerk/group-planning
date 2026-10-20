package memory_test

import (
	"errors"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestDuplicatesDoNotOverwriteOriginalRecords(t *testing.T) {
	store := memory.New()
	createMeeting(t, store)
	err := store.Update(t.Context(), func(tx meetings.Writer) error {
		message := entry("original")
		message.ClientRequestID = "same-intent"
		if _, err := tx.AppendEntry(message); err != nil {
			return err
		}

		if _, err := tx.AppendEntry(message); !errors.Is(err, meetings.ErrAlreadyExists) {
			return errors.New("duplicate entry ID accepted")
		}

		message.ID = "new-id-same-request"
		if _, err := tx.AppendEntry(message); !errors.Is(err, meetings.ErrAlreadyExists) {
			return errors.New("duplicate message request accepted")
		}

		invitation := meetings.Invitation{ID: "invitation", MeetingID: "meeting", Token: "test-token"}
		if err := tx.InsertInvitation(invitation); err != nil {
			return err
		}

		invitation.ID = "new-id-same-token"
		if err := tx.InsertInvitation(invitation); !errors.Is(err, meetings.ErrAlreadyExists) {
			return errors.New("duplicate invitation token accepted")
		}

		key := meetings.RequestKey{UserID: "friend", Operation: "send:meeting", Key: "request"}
		receipt := meetings.Receipt{Key: key, RequestHash: "original", ResourceID: "original"}
		if err := tx.InsertReceipt(receipt); err != nil {
			return err
		}

		receipt.RequestHash = "replacement"
		if err := tx.InsertReceipt(receipt); !errors.Is(err, meetings.ErrAlreadyExists) {
			return errors.New("duplicate receipt accepted")
		}

		saved, err := tx.Receipt(key)
		if err != nil || saved.RequestHash != "original" {
			return errors.New("duplicate overwrote the original receipt")
		}

		feed, err := tx.Feed("meeting")
		if err != nil || len(feed) != 1 {
			return errors.New("duplicates changed the feed")
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestRelatedRecordsRequireMeeting(t *testing.T) {
	store := memory.New()
	err := store.Update(t.Context(), func(tx meetings.Writer) error {
		if err := tx.SaveRSVP(meetings.RSVP{MeetingID: "missing", UserID: "friend", Answer: meetings.Going}); !errors.Is(err, meetings.ErrNotFound) {
			return errors.New("response for missing meeting accepted")
		}

		if err := tx.InsertInvitation(meetings.Invitation{ID: "invite", Token: "test-token", MeetingID: "missing"}); !errors.Is(err, meetings.ErrNotFound) {
			return errors.New("invitation for missing meeting accepted")
		}

		if _, err := tx.AppendEntry(entry("message")); !errors.Is(err, meetings.ErrNotFound) {
			return errors.New("entry for missing meeting accepted")
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}
