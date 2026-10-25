package memory

import (
	"maps"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type (
	responseKey struct{ meetingID, userID string }
	messageKey  struct{ meetingID, actorID, requestID string }
)

type state struct {
	media            map[string]meetings.Media
	removedUsers     map[string]bool
	reactions        map[meetings.Reaction]meetings.Reaction
	covers           map[string]meetings.Cover
	preparationTasks map[string]meetings.PreparationTask
	placePolls       map[string]meetings.PlacePoll
	polls            map[string]meetings.DatePoll
	meetings         map[string]meetings.Meeting
	invitations      map[string]meetings.Invitation
	inviteIDs        map[string]bool
	responses        map[responseKey]meetings.RSVP
	feed             map[string][]meetings.FeedEntry
	entryIDs         map[string]bool
	messageIDs       map[messageKey]bool
	jobs             map[transitionKey]meetings.TransitionJob
	receipts         map[meetings.RequestKey]meetings.Receipt
}

func newState() *state {
	return &state{
		media:            make(map[string]meetings.Media),
		removedUsers:     make(map[string]bool),
		reactions:        make(map[meetings.Reaction]meetings.Reaction),
		covers:           make(map[string]meetings.Cover),
		preparationTasks: make(map[string]meetings.PreparationTask),
		placePolls:       make(map[string]meetings.PlacePoll),
		polls:            make(map[string]meetings.DatePoll),
		meetings:         make(map[string]meetings.Meeting),
		invitations:      make(map[string]meetings.Invitation),
		inviteIDs:        make(map[string]bool),
		responses:        make(map[responseKey]meetings.RSVP),
		feed:             make(map[string][]meetings.FeedEntry),
		entryIDs:         make(map[string]bool),
		messageIDs:       make(map[messageKey]bool),
		jobs:             make(map[transitionKey]meetings.TransitionJob),
		receipts:         make(map[meetings.RequestKey]meetings.Receipt),
	}
}

func (s *state) clone() *state {
	copy := newState()
	copy.media = maps.Clone(s.media)
	copy.removedUsers = maps.Clone(s.removedUsers)
	copy.reactions = maps.Clone(s.reactions)
	// Payloads stay immutable inside storage; reads/writes clone the bytes.
	// Snapshotting unrelated meeting data only copies this index.
	copy.covers = maps.Clone(s.covers)
	for id, task := range s.preparationTasks {
		copy.preparationTasks[id] = clonePreparationTask(task)
	}

	for id, meeting := range s.meetings {
		copy.meetings[id] = cloneMeeting(meeting)
	}

	for id, poll := range s.polls {
		copy.polls[id] = cloneDatePoll(poll)
	}

	for id, poll := range s.placePolls {
		copy.placePolls[id] = clonePlacePoll(poll)
	}

	copy.invitations = maps.Clone(s.invitations)
	copy.inviteIDs = maps.Clone(s.inviteIDs)
	copy.responses = maps.Clone(s.responses)
	copy.entryIDs = maps.Clone(s.entryIDs)
	copy.messageIDs = maps.Clone(s.messageIDs)
	copy.receipts = maps.Clone(s.receipts)
	copy.jobs = maps.Clone(s.jobs)
	for id, entries := range s.feed {
		copy.feed[id] = cloneEntries(entries)
	}

	return copy
}

func cloneMeeting(meeting meetings.Meeting) meetings.Meeting {
	if meeting.StartsAt != nil {
		startsAt := *meeting.StartsAt
		meeting.StartsAt = &startsAt
	}

	if meeting.PastAt != nil {
		pastAt := *meeting.PastAt
		meeting.PastAt = &pastAt
	}

	return meeting
}

func cloneEntry(entry meetings.FeedEntry) meetings.FeedEntry {
	entry.Payload = append([]byte(nil), entry.Payload...)
	return entry
}

func cloneEntries(entries []meetings.FeedEntry) []meetings.FeedEntry {
	copy := make([]meetings.FeedEntry, len(entries))
	for i, entry := range entries {
		copy[i] = cloneEntry(entry)
	}

	return copy
}
