package httpapi

import (
	"encoding/json"
	"strconv"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type meetingSummaryResponse struct {
	MemoryPhotoCount   int             `json:"memory_photo_count"`
	MemoryPreview      []mediaResponse `json:"memory_preview"`
	OrganizerID        string          `json:"organizer_id"`
	Period             meetings.Period `json:"period"`
	ParticipantPreview []userResponse  `json:"participant_preview"`
	ID                 string          `json:"id"`
	Title              string          `json:"title"`
	StartsOn           *string         `json:"starts_on"`
	StartsAt           *time.Time      `json:"starts_at"`
	Timezone           string          `json:"timezone"`
	Place              *string         `json:"place"`
	CoverURL           *string         `json:"cover_url"`
	ParticipantCount   int             `json:"participant_count"`
	Revision           string          `json:"revision"`
	MyRSVP             *string         `json:"my_rsvp"`
	MyRSVPRevision     string          `json:"my_rsvp_revision"`
}
type meetingResponse struct {
	meetingSummaryResponse
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}
type createdMeetingResponse struct {
	Meeting       meetingResponse `json:"meeting"`
	Role          string          `json:"role"`
	InvitationURL string          `json:"invitation_url"`
}
type meetingsPageResponse struct {
	Meetings   []meetingSummaryResponse `json:"meetings"`
	NextCursor *string                  `json:"next_cursor"`
}
type rsvpResponse struct {
	MeetingID       string  `json:"meeting_id"`
	RSVP            *string `json:"rsvp"`
	RSVPRevision    string  `json:"rsvp_revision"`
	CanAccessFeed   bool    `json:"can_access_feed"`
	MeetingRevision string  `json:"meeting_revision"`
}
type participantResponse struct {
	User         userResponse `json:"user"`
	Role         string       `json:"role"`
	RSVP         *string      `json:"rsvp"`
	RSVPRevision string       `json:"rsvp_revision"`
}
type feedEntryResponse struct {
	ID              string          `json:"id"`
	MeetingID       string          `json:"meeting_id"`
	Sequence        string          `json:"sequence"`
	Kind            string          `json:"kind"`
	PayloadVersion  uint32          `json:"payload_version"`
	Actor           userResponse    `json:"actor"`
	Sender          *senderResponse `json:"sender,omitempty"`
	OccurredAt      time.Time       `json:"occurred_at"`
	Payload         json.RawMessage `json:"payload"`
	ClientRequestID *string         `json:"client_request_id"`
}
type feedPageResponse struct {
	Entries          []feedEntryResponse `json:"entries"`
	HasMore          bool                `json:"has_more"`
	MeetingRevision  string              `json:"meeting_revision"`
	ParticipantCount int                 `json:"participant_count"`
	MyRSVP           *string             `json:"my_rsvp"`
	MyRSVPRevision   string              `json:"my_rsvp_revision"`
	LatestSequence   string              `json:"latest_sequence"`
}

func decimal(value uint64) string {
	return strconv.FormatUint(value, 10)
}

func optionalString(value string) *string {
	if value == "" {
		return nil
	}

	return &value
}

func (h meetingHandlers) summaryDTO(details meetings.Details, users ...map[string]identity.User) meetingSummaryResponse {
	m := details.Meeting
	mediaPreview := []mediaResponse{}
	var profiles map[string]identity.User
	if len(users) > 0 {
		profiles = users[0]
	}

	for _, item := range details.MemoryPreview {
		mediaPreview = append(mediaPreview, mediaDTO(item, profiles))
	}

	preview := []userResponse{}
	if len(users) > 0 {
		for _, id := range details.ParticipantIDs {
			preview = append(preview, publicUserDTO(users[0][id]))
		}
	}

	return meetingSummaryResponse{
		MemoryPhotoCount: details.MemoryPhotoCount, MemoryPreview: mediaPreview,
		ID:          m.ID,
		OrganizerID: m.OrganizerID, Period: m.Status, ParticipantPreview: preview,
		Title:            m.Title,
		StartsOn:         optionalString(m.StartsOn),
		StartsAt:         m.StartsAt,
		Timezone:         m.Timezone,
		Place:            optionalString(m.Place),
		CoverURL:         h.coverURL("meetings/"+m.ID, m.CoverVersion),
		ParticipantCount: details.ParticipantCount,
		Revision:         decimal(m.Revision),
		MyRSVP:           optionalString(string(details.MyResponse.Answer)),
		MyRSVPRevision:   decimal(details.MyResponse.Revision),
	}
}

func (h meetingHandlers) meetingDTO(details meetings.Details, users ...map[string]identity.User) meetingResponse {
	return meetingResponse{
		meetingSummaryResponse: h.summaryDTO(details, users...),
		Description:            optionalString(details.Meeting.Description),
		CreatedAt:              details.Meeting.CreatedAt,
	}
}

func rsvpDTO(state meetings.ResponseState) rsvpResponse {
	return rsvpResponse{state.MeetingID, optionalString(string(state.Answer)), decimal(state.Revision), state.CanAccessFeed, decimal(state.MeetingRevision)}
}

func entryDTO(entry meetings.FeedEntry, profiles ...map[string]identity.User) feedEntryResponse {
	var users map[string]identity.User
	if len(profiles) > 0 {
		users = profiles[0]
	}

	actor := userResponse{ID: entry.ActorID, DisplayName: entry.ActorName, AvatarURL: optionalString(users[entry.ActorID].AvatarURL)}
	if len(entry.Attachments) > 0 {
		var payload map[string]json.RawMessage
		if json.Unmarshal(entry.Payload, &payload) == nil {
			attachments := make([]mediaResponse, 0, len(entry.Attachments))
			for _, item := range entry.Attachments {
				attachments = append(attachments, mediaDTO(item, users))
			}

			raw, err := json.Marshal(attachments)
			if err == nil {
				delete(payload, "media_ids")
				payload["attachments"] = raw
				if value, err := json.Marshal(payload); err == nil {
					entry.Payload = value
				}
			}
		}
	}

	return feedEntryResponse{entry.ID, entry.MeetingID, decimal(entry.Sequence), entry.Kind, entry.PayloadVersion, actor, entrySender(entry), entry.OccurredAt, entry.Payload, optionalString(entry.ClientRequestID)}
}
