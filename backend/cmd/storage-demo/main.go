// Command storage-demo demonstrates process-local storage without a database.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func main() {
	if err := run(context.Background()); err != nil {
		log.Fatal(err)
	}
}

func run(ctx context.Context) error {
	store := memory.New()
	if err := store.Update(ctx, func(tx meetings.Writer) error {
		if err := tx.SaveMeeting(meetings.Meeting{ID: "demo", OrganizerID: "owner", Title: "Вечер с друзьями"}); err != nil {
			return err
		}
		_, err := tx.AppendEntry(meetings.FeedEntry{
			ID: "created", MeetingID: "demo", ActorID: "owner", Kind: "meeting_created",
			PayloadVersion: 1, Payload: json.RawMessage(`{"title":"Вечер с друзьями"}`),
		})
		return err
	}); err != nil {
		return err
	}
	if err := store.Update(ctx, func(tx meetings.Writer) error {
		if err := tx.SaveRSVP(meetings.RSVP{MeetingID: "demo", UserID: "friend", Answer: meetings.Going}); err != nil {
			return err
		}
		_, err := tx.AppendEntry(meetings.FeedEntry{
			ID: "joined", MeetingID: "demo", ActorID: "friend", Kind: "participant_joined",
			PayloadVersion: 1, Payload: json.RawMessage(`{"answer":"going"}`),
		})
		return err
	}); err != nil {
		return err
	}
	return store.View(ctx, func(tx meetings.Reader) error {
		meeting, err := tx.Meeting("demo")
		if err != nil {
			return err
		}
		responses, err := tx.RSVPs("demo")
		if err != nil {
			return err
		}
		feed, err := tx.Feed("demo")
		if err != nil {
			return err
		}
		fmt.Printf("%s: ответов — %d, событий — %d\n", meeting.Title, len(responses), len(feed))
		return nil
	})
}
