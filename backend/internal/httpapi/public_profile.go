package httpapi

import (
	"context"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

// Public DTOs deliberately whitelist fields; provider contacts remain private.
func publicUserDTO(user identity.User) userResponse {
	return userResponse{ID: user.ID, DisplayName: user.DisplayName, AvatarURL: optionalString(user.AvatarURL)}
}

func (h meetingHandlers) summaryUsers(ctx context.Context, details []meetings.Details) (map[string]identity.User, error) {
	ids := []string{}
	seen := map[string]bool{}
	for _, detail := range details {
		for _, item := range detail.MemoryPreview {
			if !seen[item.UploadedBy.ID] {
				ids = append(ids, item.UploadedBy.ID)
				seen[item.UploadedBy.ID] = true
			}
		}

		for _, id := range detail.ParticipantIDs {
			if !seen[id] {
				ids = append(ids, id)
				seen[id] = true
			}
		}
	}

	return h.identity.Users(ctx, ids)
}
