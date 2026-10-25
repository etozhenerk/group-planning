package httpapi

import (
	"net/http"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type pollSettingsRequest struct {
	MultipleAnswers *bool `json:"multiple_answers"`
	AllowRevoting   *bool `json:"allow_revoting"`
	AllowNewOptions *bool `json:"allow_new_options"`
	Anonymous       bool  `json:"anonymous"`
	HideResults     bool  `json:"hide_results"`
}

func enabledByDefault(value *bool) bool { return value == nil || *value }

func (h meetingHandlers) createDatePoll(w http.ResponseWriter, r *http.Request) {
	call, ok := h.pollContext(w, r, http.MethodPost, false)
	if !ok {
		return
	}

	var input struct {
		Dates    []string            `json:"dates"`
		ClosesAt string              `json:"closes_at"`
		Settings pollSettingsRequest `json:"settings"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}

	settings := input.Settings
	view, err := h.app.CreateDatePoll(r.Context(), call.Actor, call.MeetingID, meetings.CreateDatePollInput{
		Dates:    input.Dates,
		ClosesAt: input.ClosesAt,
		Settings: meetings.PollSettings{
			MultipleAnswers: enabledByDefault(settings.MultipleAnswers),
			AllowRevoting:   enabledByDefault(settings.AllowRevoting),
			AllowNewOptions: enabledByDefault(settings.AllowNewOptions),
			Anonymous:       settings.Anonymous,
			HideResults:     settings.HideResults,
		},
	}, call.Key)
	h.writeDatePoll(w, view, err, 201)
}
