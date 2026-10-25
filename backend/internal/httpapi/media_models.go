package httpapi

import (
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type mediaResponse struct {
	ID           string       `json:"id"`
	MeetingID    string       `json:"meeting_id"`
	FileName     string       `json:"file_name"`
	ContentType  string       `json:"content_type"`
	SizeBytes    int          `json:"size_bytes"`
	Kind         string       `json:"kind"`
	Purpose      string       `json:"purpose"`
	Status       string       `json:"status"`
	DownloadURL  *string      `json:"download_url"`
	ThumbnailURL *string      `json:"thumbnail_url"`
	CreatedAt    time.Time    `json:"created_at"`
	UploadedBy   userResponse `json:"uploaded_by"`
}

func mediaDTO(item meetings.Media, users map[string]identity.User) mediaResponse {
	result := mediaResponse{ID: item.ID, MeetingID: item.MeetingID, FileName: item.FileName, ContentType: item.ContentType, SizeBytes: item.SizeBytes, Kind: item.Kind, Purpose: item.Purpose, Status: item.Status, CreatedAt: item.CreatedAt, UploadedBy: userResponse{ID: item.UploadedBy.ID, DisplayName: item.UploadedBy.Name}}
	if user, ok := users[item.UploadedBy.ID]; ok {
		result.UploadedBy = publicUserDTO(user)
	}

	if item.Status == "published" {
		address := "/api/v1/meetings/" + item.MeetingID + "/media/" + item.ID + "/content"
		result.DownloadURL = &address
		if item.Kind == "photo" {
			result.ThumbnailURL = &address
		}
	}

	return result
}
