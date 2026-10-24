package httpapi

import (
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestFeedSenderScope(t *testing.T) {
	for _, kind := range []string{"meeting_created", "meeting_updated", "participant_joined", "participant_left", "rsvp_changed", "meeting_time_unspecified", "preparation_task_accepted", "preparation_task_completed", "preparation_task_declined", "preparation_task_cancelled", "unknown"} {
		if entrySender(meetings.FeedEntry{Kind: kind}) != nil {
			t.Fatalf("%s must remain a system event", kind)
		}
	}

	for _, kind := range []string{"date_poll_applied", "date_poll_no_majority", "date_poll_choice_required", "date_poll_time_required", "date_poll_cancelled", "place_poll_result", "place_poll_cancelled"} {
		sender := entrySender(meetings.FeedEntry{Kind: kind})
		if sender == nil || sender.Kind != "bot" || sender.ID != meetings.BotID {
			t.Fatalf("%s must be attributed to the bot", kind)
		}
	}

	for _, kind := range []string{"message", "preparation_task_created", "date_poll_created", "place_poll_created"} {
		sender := entrySender(meetings.FeedEntry{Kind: kind, ActorID: "user", ActorName: "Саша"})
		if sender == nil || sender.Kind != "user" || sender.ID != "user" {
			t.Fatalf("%s must retain its author", kind)
		}
	}
}
