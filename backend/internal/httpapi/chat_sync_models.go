package httpapi

import (
	"context"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type (
	chatCapabilitiesResponse struct {
		ProtocolVersion int  `json:"protocol_version"`
		Sync            bool `json:"sync"`
		ReadState       bool `json:"read_state"`
		Realtime        bool `json:"realtime"`
	}
	chatRangeResponse struct {
		FirstSequence *string `json:"first_sequence"`
		LastSequence  *string `json:"last_sequence"`
	}
	chatMeetingResponse struct {
		ID               string          `json:"id"`
		OrganizerID      string          `json:"organizer_id"`
		Title            string          `json:"title"`
		Description      *string         `json:"description"`
		StartsOn         *string         `json:"starts_on"`
		StartsAt         *time.Time      `json:"starts_at"`
		Timezone         string          `json:"timezone"`
		Place            *string         `json:"place"`
		CoverURL         *string         `json:"cover_url"`
		Period           meetings.Period `json:"period"`
		Revision         string          `json:"revision"`
		ParticipantCount int             `json:"participant_count"`
		MyRSVP           *string         `json:"my_rsvp"`
		MyRSVPRevision   string          `json:"my_rsvp_revision"`
	}
)

type chatProjectionResponse struct {
	ResourceKind      string                     `json:"resource_kind"`
	ResourceID        string                     `json:"resource_id"`
	ProjectionVersion string                     `json:"projection_version"`
	Entry             *feedEntryResponse         `json:"entry,omitempty"`
	DatePoll          *datePollResponse          `json:"date_poll,omitempty"`
	PlacePoll         *placePollResponse         `json:"place_poll,omitempty"`
	PreparationTask   *preparationTaskResponse   `json:"preparation_task,omitempty"`
	Reactions         []messageReactionsResponse `json:"reactions,omitempty"`
}
type (
	chatChangeResponse struct {
		Kind              string                  `json:"kind"`
		EntryID           *string                 `json:"entry_id,omitempty"`
		ResourceKind      *string                 `json:"resource_kind,omitempty"`
		ResourceID        *string                 `json:"resource_id,omitempty"`
		ProjectionVersion string                  `json:"projection_version"`
		Projection        *chatProjectionResponse `json:"projection,omitempty"`
	}
	chatSnapshotResponse struct {
		Mode              string                   `json:"mode"`
		StreamEpoch       string                   `json:"stream_epoch"`
		ChangeCursor      string                   `json:"change_cursor"`
		Entries           []feedEntryResponse      `json:"entries"`
		Projections       []chatProjectionResponse `json:"projections"`
		Meeting           chatMeetingResponse      `json:"meeting"`
		ProjectionVersion string                   `json:"projection_version"`
		LatestSequence    string                   `json:"latest_sequence"`
		Range             chatRangeResponse        `json:"range"`
		HasOlder          bool                     `json:"has_older"`
		HasNewer          bool                     `json:"has_newer"`
		UnreadBaseline    *string                  `json:"unread_baseline_sequence,omitempty"`
		UnreadCount       *string                  `json:"unread_count,omitempty"`
		MyReadState       *string                  `json:"my_read_state"`
		FirstUnread       *string                  `json:"first_unread"`
	}
)

type chatChangesResponse struct {
	MyReadState       *string              `json:"my_read_state,omitempty"`
	UnreadBaseline    *string              `json:"unread_baseline_sequence,omitempty"`
	UnreadCount       *string              `json:"unread_count,omitempty"`
	FirstUnread       **string             `json:"first_unread,omitempty"`
	Mode              string               `json:"mode"`
	StreamEpoch       string               `json:"stream_epoch"`
	NextCursor        string               `json:"next_cursor"`
	ThroughCursor     string               `json:"through_cursor"`
	HasMore           bool                 `json:"has_more"`
	Changes           []chatChangeResponse `json:"changes"`
	Meeting           chatMeetingResponse  `json:"meeting"`
	ProjectionVersion string               `json:"projection_version"`
}

func feedRangeDTO(entries []meetings.FeedEntry) chatRangeResponse {
	result := chatRangeResponse{}
	if len(entries) > 0 {
		a, b := decimal(entries[0].Sequence), decimal(entries[len(entries)-1].Sequence)
		result.FirstSequence, result.LastSequence = &a, &b
	}

	return result
}

func (h meetingHandlers) chatMeetingDTO(d meetings.Details) chatMeetingResponse {
	m := d.Meeting
	return chatMeetingResponse{ID: m.ID, OrganizerID: m.OrganizerID, Title: m.Title, Description: optionalString(m.Description), StartsOn: optionalString(m.StartsOn), StartsAt: m.StartsAt, Timezone: m.Timezone, Place: optionalString(m.Place), CoverURL: h.coverURL("meetings/"+m.ID, m.CoverVersion), Period: m.Status, Revision: decimal(m.Revision), ParticipantCount: d.ParticipantCount, MyRSVP: optionalString(string(d.MyResponse.Answer)), MyRSVPRevision: decimal(d.MyResponse.Revision)}
}

func (h meetingHandlers) chatProjectionDTO(ctx context.Context, p meetings.ChatProjection) (chatProjectionResponse, error) {
	result := chatProjectionResponse{ResourceKind: p.ResourceKind, ResourceID: p.ResourceID, ProjectionVersion: decimal(p.Version)}
	if p.Entry != nil {
		entries, err := h.chatEntriesDTO(ctx, []meetings.FeedEntry{*p.Entry})
		if err != nil {
			return result, err
		}

		result.Entry = &entries[0]
	}

	if p.DatePoll != nil {
		view := datePollDTO(*p.DatePoll)
		result.DatePoll = &view
	}

	if p.PlacePoll != nil {
		view := placePollDTO(*p.PlacePoll)
		result.PlacePoll = &view
	}

	if p.PreparationTask != nil {
		view, err := h.preparationTaskDTO(ctx, *p.PreparationTask)
		if err != nil {
			return result, err
		}

		result.PreparationTask = &view
	}

	if p.Reactions != nil {
		views, err := h.reactionDTOs(ctx, p.Reactions)
		if err != nil {
			return result, err
		}

		result.Reactions = views
	}

	return result, nil
}
