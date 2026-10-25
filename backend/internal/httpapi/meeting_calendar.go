package httpapi

import (
	"net/http"
	"net/url"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type calendarSummaryResponse struct {
	meetingSummaryResponse
	LocalDate *string         `json:"local_date"`
	Period    meetings.Period `json:"period"`
}

type calendarCountsResponse struct {
	Upcoming int `json:"upcoming"`
	Past     int `json:"past"`
	Undated  int `json:"undated"`
}

type calendarDayResponse struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

type calendarPageResponse struct {
	Meetings            []calendarSummaryResponse `json:"meetings"`
	NextCursor          *string                   `json:"next_cursor"`
	AsOf                time.Time                 `json:"as_of"`
	RefreshAfterSeconds int                       `json:"refresh_after_seconds"`
	Counts              calendarCountsResponse    `json:"counts"`
	Days                []calendarDayResponse     `json:"days"`
	NextTransitionAt    *time.Time                `json:"next_transition_at"`
}

func (h meetingHandlers) calendar(w http.ResponseWriter, r *http.Request, actor meetings.Actor, values url.Values, limit int) {
	query := meetings.CalendarQuery{
		Period: meetings.Period(values.Get("period")), From: values.Get("from"), To: values.Get("to"),
		Limit: limit, Cursor: values.Get("cursor"),
	}
	if query.Validate() != nil || (values.Has("from") && query.From == "") || (values.Has("to") && query.To == "") {
		writeError(w, 400, "invalid_query", nil)
		return
	}

	page, err := h.app.Calendar(r.Context(), actor, query)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	response := calendarPageResponse{
		Meetings: []calendarSummaryResponse{}, NextCursor: optionalString(page.NextCursor),
		AsOf: page.AsOf, RefreshAfterSeconds: 5, Counts: calendarCountsResponse{page.Counts.Upcoming, page.Counts.Past, page.Counts.Undated},
		Days: []calendarDayResponse{}, NextTransitionAt: page.NextTransitionAt,
	}
	for _, item := range page.Meetings {
		response.Meetings = append(response.Meetings, calendarSummaryResponse{h.summaryDTO(item.Details), optionalString(item.LocalDate), item.Period})
	}

	for _, day := range page.Days {
		response.Days = append(response.Days, calendarDayResponse{day.Date, day.Count})
	}

	writeJSON(w, 200, response)
}
