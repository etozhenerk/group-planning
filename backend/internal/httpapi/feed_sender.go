package httpapi

import "github.com/etozhenerk/group-planning/backend/internal/meetings"

type senderResponse struct {
	Kind        string `json:"kind"`
	ID          string `json:"id"`
	DisplayName string `json:"display_name"`
}

func entrySender(entry meetings.FeedEntry) *senderResponse {
	switch entry.Kind {
	case "date_poll_applied", "date_poll_no_majority", "date_poll_choice_required", "date_poll_time_required", "date_poll_cancelled":
		return &senderResponse{Kind: "bot", ID: meetings.BotID, DisplayName: "Бот"}
	case "message", "date_poll_created":
		return &senderResponse{Kind: "user", ID: entry.ActorID, DisplayName: entry.ActorName}
	default:
		return nil
	}
}
