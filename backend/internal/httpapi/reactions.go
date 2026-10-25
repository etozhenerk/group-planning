package httpapi

import (
	"context"
	"net/http"
	"net/url"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type reactionResponse struct {
	Emoji string         `json:"emoji"`
	Count int            `json:"count"`
	Mine  bool           `json:"mine"`
	Users []userResponse `json:"users"`
}
type messageReactionsResponse struct {
	EntryID   string             `json:"entry_id"`
	Reactions []reactionResponse `json:"reactions"`
}

func (h meetingHandlers) reactionDTOs(ctx context.Context, views []meetings.MessageReactions) ([]messageReactionsResponse, error) {
	ids := []string{}
	seen := map[string]bool{}
	for _, view := range views {
		for _, group := range view.Reactions {
			for _, id := range group.UserIDs {
				if !seen[id] {
					ids = append(ids, id)
					seen[id] = true
				}
			}
		}
	}

	users, err := h.identity.Users(ctx, ids)
	if err != nil {
		return nil, err
	}

	result := make([]messageReactionsResponse, 0, len(views))
	for _, view := range views {
		item := messageReactionsResponse{EntryID: view.EntryID, Reactions: []reactionResponse{}}
		for _, group := range view.Reactions {
			reaction := reactionResponse{Emoji: group.Emoji, Count: len(group.UserIDs), Mine: group.Mine, Users: []userResponse{}}
			for _, id := range group.UserIDs {
				reaction.Users = append(reaction.Users, publicUserDTO(users[id]))
			}

			item.Reactions = append(item.Reactions, reaction)
		}

		result = append(result, item)
	}

	return result, nil
}

func (h meetingHandlers) reactions(w http.ResponseWriter, r *http.Request) {
	if !getOnly(w, r) {
		return
	}

	actor, ok := h.actor(w, r, false)
	if !ok {
		return
	}

	id, ok := parseMeetingID(w, r)
	if !ok {
		return
	}

	values, err := url.ParseQuery(r.URL.RawQuery)
	if err != nil || len(values) != 1 || len(values["entry_id"]) == 0 || len(values["entry_id"]) > 50 {
		writeError(w, 400, "invalid_query", nil)
		return
	}

	views, err := h.app.Reactions(r.Context(), actor, id, values["entry_id"])
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	response, err := h.reactionDTOs(r.Context(), views)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	writeJSON(w, 200, struct {
		Entries []messageReactionsResponse `json:"entries"`
	}{response})
}

func (h meetingHandlers) setReaction(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodPut) {
		return
	}

	actor, ok := h.actor(w, r, true)
	if !ok {
		return
	}

	id, ok := parseMeetingID(w, r)
	if !ok {
		return
	}

	if _, ok := closedQuery(w, r); !ok {
		return
	}

	entryID, err := meetings.ParseUUID(r.PathValue("entry_id"))
	if err != nil {
		writeError(w, 404, "not_found", nil)
		return
	}

	key, ok := requestKey(w, r)
	if !ok {
		return
	}

	var input struct {
		Emoji  string `json:"emoji"`
		Active *bool  `json:"active"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}

	if input.Active == nil {
		writeError(w, 422, "validation_failed", map[string]string{"active": "required"})
		return
	}

	view, err := h.app.SetReaction(r.Context(), actor, id, entryID, input.Emoji, *input.Active, key)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	result, err := h.reactionDTOs(r.Context(), []meetings.MessageReactions{view})
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	writeJSON(w, 200, result[0])
}
