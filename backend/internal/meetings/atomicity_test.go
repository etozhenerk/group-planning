package meetings_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

var receiptFailure = errors.New("receipt failure")

type failedReceiptWriter struct{ meetings.Writer }

func (failedReceiptWriter) InsertReceipt(meetings.Receipt) error {
	return receiptFailure
}

type failedReceiptStore struct{ meetings.Store }

func (s failedReceiptStore) Update(ctx context.Context, callback func(meetings.Writer) error) error {
	return s.Store.Update(ctx, func(w meetings.Writer) error { return callback(failedReceiptWriter{w}) })
}

func TestReceiptFailureRollsBackEveryOperation(t *testing.T) {
	store := memory.New()
	app := meetings.NewService(failedReceiptStore{store}, time.Now)
	_, err := app.Create(ctx, owner, validInput(), key(1))
	assertError(t, err, receiptFailure)
	must(t, store.View(ctx, func(r meetings.Reader) error {
		all, err := r.Meetings()
		if len(all) != 0 {
			t.Fatal("partially committed creation")
		}

		return err
	}))
	f := setup(t)
	broken := meetings.NewService(failedReceiptStore{f.store}, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	id := f.created.Details.Meeting.ID
	_, err = broken.Respond(ctx, guest, "", f.created.InvitationToken, meetings.Going, 0, key(2))
	assertError(t, err, receiptFailure)
	if len(feed(t, f).Entries) != 1 || feed(t, f).Details.ParticipantCount != 1 {
		t.Fatal("partially committed RSVP")
	}

	_, err = broken.Update(ctx, owner, id, meetings.UpdateInput{Title: meetings.Field{Present: true, Value: "Changed"}, ExpectedRevision: 1}, key(3))
	assertError(t, err, receiptFailure)
	_, err = broken.SendMessage(ctx, owner, id, "Привет", key(4), key(4))
	assertError(t, err, receiptFailure)
	if p := feed(t, f); len(p.Entries) != 1 || p.Details.Meeting.Revision != 1 || p.Details.Meeting.Title != "Настолки" {
		t.Fatal("event or settings survived rollback")
	}
}
