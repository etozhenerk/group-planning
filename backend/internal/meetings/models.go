// Package meetings defines meeting data and the storage port used by application operations.
package meetings

import (
	"encoding/json"
	"time"
)

// Meeting is the current state of a gathering, independent of HTTP and storage.
type Meeting struct {
	ID                  string
	OrganizerID         string
	Title               string
	Description         string
	StartsAt            *time.Time
	Timezone            string
	Place               string
	Revision            uint64
	CreatedAt           time.Time
	CreationRequestID   string
	CreationRequestHash string
}

// Invitation identifies a meeting by its private sharing token.
type Invitation struct {
	ID        string
	MeetingID string
	Token     string
	CreatedAt time.Time
}

// Answer is a guest's current response, not an authorization decision.
type Answer string

const (
	Going    Answer = "going"
	Maybe    Answer = "maybe"
	NotGoing Answer = "not_going"
)

// RSVP records one response for a meeting and user.
type RSVP struct {
	MeetingID string
	UserID    string
	Answer    Answer
	Revision  uint64
	UpdatedAt time.Time
}

// FeedEntry contains a message or a versioned domain event.
type FeedEntry struct {
	ID              string
	MeetingID       string
	Sequence        uint64
	Kind            string
	ActorID         string
	ActorName       string
	OccurredAt      time.Time
	PayloadVersion  uint32
	Payload         json.RawMessage
	ClientRequestID string
}

// RequestKey scopes an idempotency key to its caller and operation/resource.
type RequestKey struct {
	UserID    string
	Operation string
	Key       string
}

// Receipt references an applied request without caching access permissions.
type Receipt struct {
	Key         RequestKey
	RequestHash string
	ResourceID  string
	ExpiresAt   time.Time
}
