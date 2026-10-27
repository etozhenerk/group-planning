package httpapi

import (
	"context"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (h meetingHandlers) chatEntriesDTO(ctx context.Context, entries []meetings.FeedEntry) ([]feedEntryResponse, error) {
	ids := []string{}
	seen := map[string]bool{}
	add := func(id string) {
		if id != "" && !seen[id] {
			ids = append(ids, id)
			seen[id] = true
		}
	}
	for _, entry := range entries {
		add(entry.ActorID)
		for _, media := range entry.Attachments {
			add(media.UploadedBy.ID)
		}
	}

	users, err := h.identity.Users(ctx, ids)
	if err != nil {
		return nil, err
	}

	result := make([]feedEntryResponse, 0, len(entries))
	for _, entry := range entries {
		result = append(result, entryDTO(entry, users))
	}

	return result, nil
}
