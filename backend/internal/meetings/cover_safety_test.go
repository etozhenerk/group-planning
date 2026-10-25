package meetings_test

import (
	"errors"
	"image/color"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestCoverWritesRollbackWithMeetingAndEvent(t *testing.T) {
	f := setup(t)
	broken := meetings.NewService(failedReceiptStore{f.store}, time.Now)
	input := validInput()
	input.Cover = coverInput(t, color.RGBA{R: 255, A: 255})
	_, err := broken.Create(ctx, owner, input, key(100))
	assertError(t, err, receiptFailure)
	created, err := f.app.Create(ctx, owner, input, key(100))
	must(t, err)
	id, version := created.Details.Meeting.ID, created.Details.Meeting.CoverVersion
	for i, value := range []*meetings.CoverInput{nil, coverInput(t, color.RGBA{B: 255, A: 255})} {
		_, err = broken.Update(ctx, owner, id, meetings.UpdateInput{ExpectedRevision: 1, Cover: &meetings.CoverChange{Value: value}}, key(101+i))
		assertError(t, err, receiptFailure)
		details, err := f.app.Details(ctx, owner, id)
		must(t, err)
		if details.Meeting.CoverVersion != version || details.Meeting.Revision != 1 {
			t.Fatal("failed write changed meeting")
		}

		_, err = f.app.ReadCover(ctx, owner, id, version)
		must(t, err)
	}

	f.created = created
	if len(feed(t, f).Entries) != 1 {
		t.Fatal("failed image write left an event")
	}

	must(t, f.store.View(ctx, func(r meetings.Reader) error {
		all, err := r.Meetings()
		if len(all) != 2 {
			t.Fatal("failed creation left a meeting")
		}

		return err
	}))
}

func TestConcurrentCoverReplacementsHaveOneWinner(t *testing.T) {
	f := setup(t)
	values := []*meetings.CoverInput{coverInput(t, color.RGBA{R: 255, A: 255}), coverInput(t, color.RGBA{B: 255, A: 255})}
	results := make(chan error, 2)
	var workers sync.WaitGroup
	for i, value := range values {
		workers.Go(func() {
			_, err := f.app.Update(ctx, owner, f.created.Details.Meeting.ID, meetings.UpdateInput{ExpectedRevision: 1, Cover: &meetings.CoverChange{Value: value}}, key(100+i))
			results <- err
		})
	}

	workers.Wait()
	close(results)
	winners, conflicts := 0, 0
	for err := range results {
		var conflict *meetings.Conflict
		switch {
		case err == nil:
			winners++
		case errors.As(err, &conflict):
			conflicts++
		default:
			t.Fatal(err)
		}
	}

	if winners != 1 || conflicts != 1 || len(feed(t, f).Entries) != 2 {
		t.Fatal("concurrent photo change was lost or duplicated")
	}
}
