package meetings

import (
	"errors"
	"time"
)

// ErrChangeCursorInvalid rejects ranges outside the retained stream snapshot.
var ErrChangeCursorInvalid = errors.New("invalid chat change cursor")

// ChatStream is persistent stream identity, independent of feed/read positions.
// RetainedAfter is the lowest cursor from which a complete replay is possible.
type ChatStream struct {
	MeetingID, Epoch              string
	LatestSequence, RetainedAfter uint64
}

// ChatChange references current authorized projections, never their private data.
// Sequence is also the projection version for this resource invalidation.
type ChatChange struct {
	MeetingID, Kind, EntryID, ResourceKind, ResourceID string
	Sequence                                           uint64
	CreatedAt                                          time.Time
}

// Valid reports whether the record contains one supported reference shape.
func (c ChatChange) Valid() bool {
	if c.MeetingID == "" || c.CreatedAt.IsZero() {
		return false
	}

	switch c.Kind {
	case "entry_upsert", "entry_removed":
		switch c.ResourceKind {
		case "entry":
			return c.ResourceID != "" && c.EntryID == c.ResourceID
		case "date_poll", "place_poll", "preparation_task":
			return c.ResourceID != "" && c.EntryID == ""
		}
	case "meeting_changed":
		return c.ResourceKind == "meeting" && c.ResourceID == c.MeetingID && c.EntryID == ""
	case "history_invalidated", "receipts_changed":
		return c.ResourceKind == "" && c.ResourceID == "" && c.EntryID == ""
	}

	return false
}

// ChatChangesPage is an ascending bounded page within one fixed through boundary.
type ChatChangesPage struct {
	Changes []ChatChange
	HasMore bool
}

// ChatHint is the durable notification intent; no message, name, vote or token.
// Personal terminal hints intentionally survive deletion of their meeting.
// Dispatch/lease processing is a separate application operation.
type ChatHint struct {
	Invalidation                           bool
	ID, Target, TargetID, MeetingID, Epoch string
	LatestSequence                         uint64
	SchemaVersion                          uint32
	Terminal                               bool
	CreatedAt, AvailableAt                 time.Time
	Attempts                               int
	DispatchedAt                           *time.Time
	LeaseID                                string
	LeaseUntil                             *time.Time
}

// Valid checks the notification envelope before it enters durable storage.
func (h ChatHint) Valid() bool {
	return h.LeaseID == "" && h.LeaseUntil == nil && h.ID != "" && h.MeetingID != "" && h.TargetID != "" && h.SchemaVersion == 1 && !h.CreatedAt.IsZero() && !h.AvailableAt.IsZero() && h.Attempts >= 0 &&
		((h.Target == "meeting" && h.TargetID == h.MeetingID && h.Epoch != "" && !h.Terminal) || (h.Target == "user" && (h.Terminal || h.Epoch != "")))
}
