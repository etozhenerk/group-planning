package meetings

import (
	"encoding/json"
	"strings"
)

func (s *Service) syncProjection(r Reader, actor Actor, meeting Meeting, kind, id string, version uint64) (ChatProjection, error) {
	p := ChatProjection{ResourceKind: kind, ResourceID: id, Version: version}
	switch kind {
	case "entry":
		entry, err := r.FeedEntry(meeting.ID, id)
		if err != nil {
			return p, err
		}

		entries := []FeedEntry{entry}
		if err := hydrateMediaEntries(r, entries); err != nil {
			return p, err
		}

		return s.entrySyncProjection(r, actor, meeting, entries[0], version)
	case "date_poll":
		poll, err := r.DatePoll(id)
		if err != nil {
			return p, err
		}

		if poll.MeetingID != meeting.ID {
			return p, ErrNotFound
		}

		view, err := s.pollView(r, meeting, poll, actor.ID)
		p.DatePoll = &view

		return p, err
	case "place_poll":
		poll, err := r.PlacePoll(id)
		if err != nil {
			return p, err
		}

		if poll.MeetingID != meeting.ID {
			return p, ErrNotFound
		}

		view, err := s.placePollView(r, meeting, poll, actor.ID)
		p.PlacePoll = &view

		return p, err
	case "preparation_task":
		task, err := r.PreparationTask(id)
		if err != nil {
			return p, err
		}

		if task.MeetingID != meeting.ID {
			return p, ErrNotFound
		}

		view := preparationTaskView(meeting, task, actor.ID)
		p.PreparationTask = &view

		return p, nil
	}

	return p, ErrInvalidRecord
}

func (s *Service) entrySyncProjection(r Reader, actor Actor, meeting Meeting, entry FeedEntry, version uint64) (ChatProjection, error) {
	p := ChatProjection{ResourceKind: "entry", ResourceID: entry.ID, Version: version, Entry: &entry}
	var reference struct {
		PollID string `json:"poll_id"`
		TaskID string `json:"task_id"`
	}
	if json.Unmarshal(entry.Payload, &reference) != nil {
		return p, ErrInvalidRecord
	}

	kind, id := "", ""
	switch {
	case strings.HasPrefix(entry.Kind, "date_poll_"):
		kind, id = "date_poll", reference.PollID
	case strings.HasPrefix(entry.Kind, "place_poll_"):
		kind, id = "place_poll", reference.PollID
	case strings.HasPrefix(entry.Kind, "preparation_task_"):
		kind, id = "preparation_task", reference.TaskID
	}

	if id != "" {
		resource, err := s.syncProjection(r, actor, meeting, kind, id, version)
		if err != nil {
			return p, err
		}

		p.DatePoll, p.PlacePoll, p.PreparationTask = resource.DatePoll, resource.PlacePoll, resource.PreparationTask
	}

	if entry.Kind == "message" {
		views, err := reactionViews(syncReactionReader{Reader: r, ids: []string{entry.ID}}, meeting.ID, []string{entry.ID}, actor.ID)
		if err != nil {
			return p, err
		}

		p.Reactions = views
	}

	return p, nil
}

type syncReactionReader struct {
	Reader
	ids []string
}

func (r syncReactionReader) Reactions(id string) ([]Reaction, error) {
	return r.Reader.ReactionsForEntries(id, r.ids)
}
