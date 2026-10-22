package httpapi

import "github.com/etozhenerk/group-planning/backend/internal/meetings"

type senderResponse struct {
	Kind        string `json:"kind"`
	ID          string `json:"id"`
	DisplayName string `json:"display_name"`
}

func entrySender(entry meetings.FeedEntry) senderResponse {
	switch entry.Kind {
	case "meeting_time_unspecified", "meeting_created", "meeting_updated", "participant_joined", "participant_left", "rsvp_changed", "date_poll_applied", "date_poll_no_majority", "date_poll_choice_required", "date_poll_time_required", "date_poll_cancelled":
		return senderResponse{Kind: "bot", ID: meetings.BotID, DisplayName: "Бот"}
	default:
		return senderResponse{Kind: "user", ID: entry.ActorID, DisplayName: entry.ActorName}
	}
}
