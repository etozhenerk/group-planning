package memory

import (
	"maps"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type responseKey struct{ meetingID, userID string }
type messageKey struct{ meetingID, actorID, requestID string }

type state struct {
	meetings    map[string]meetings.Meeting
	invitations map[string]meetings.Invitation
	inviteIDs   map[string]bool
	responses   map[responseKey]meetings.RSVP
	feed        map[string][]meetings.FeedEntry
	entryIDs    map[string]bool
	messageIDs  map[messageKey]bool
	receipts    map[meetings.RequestKey]meetings.Receipt
}

func newState() *state {
	return &state{
		meetings:    make(map[string]meetings.Meeting),
		invitations: make(map[string]meetings.Invitation),
		inviteIDs:   make(map[string]bool),
		responses:   make(map[responseKey]meetings.RSVP),
		feed:        make(map[string][]meetings.FeedEntry),
		entryIDs:    make(map[string]bool),
		messageIDs:  make(map[messageKey]bool),
		receipts:    make(map[meetings.RequestKey]meetings.Receipt),
	}
}

func (s *state) clone() *state {
	copy := newState()
	for id, meeting := range s.meetings {
		copy.meetings[id] = cloneMeeting(meeting)
	}
	copy.invitations = maps.Clone(s.invitations)
	copy.inviteIDs = maps.Clone(s.inviteIDs)
	copy.responses = maps.Clone(s.responses)
	copy.entryIDs = maps.Clone(s.entryIDs)
	copy.messageIDs = maps.Clone(s.messageIDs)
	copy.receipts = maps.Clone(s.receipts)
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
