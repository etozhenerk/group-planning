package meetings

import (
	"context"
	"encoding/json"
	"errors"
	"time"
)

var (
	ErrForbidden           = errors.New("meeting access denied")
	ErrUnauthenticated     = errors.New("actor required")
	ErrIdempotencyConflict = errors.New("idempotency key reused")
)

// ValidationError contains safe field codes, never submitted values.
type ValidationError struct{ Fields map[string]string }

func (e ValidationError) Error() string { return "invalid meeting fields" }

// Conflict reports the current state without granting access from a failed write.
type Conflict struct {
	Code     string
	Current  *Details
	Response *ResponseState
}

func (e *Conflict) Error() string { return e.Code }

// Actor must come from the verified server session, not a client-supplied user ID.
type Actor struct{ ID, Name string }

// Details is an application snapshot, separate from both storage and HTTP DTOs.
type Details struct {
	Meeting          Meeting
	MyResponse       RSVP
	ParticipantCount int
}

// Created includes the original invitation for a newly created or retried meeting.
type Created struct {
	Details         Details
	InvitationToken string
}

// ResponseState describes the caller's current answer and access.
type ResponseState struct {
	MeetingID                 string
	Answer                    Answer
	Revision, MeetingRevision uint64
	CanAccessFeed             bool
}

// Participant includes respondents even when their current answer is not going.
type Participant struct {
	UserID, Role string
	Answer       Answer
	Revision     uint64
}

// FeedPage contains entries and metadata read from one snapshot.
type FeedPage struct {
	Entries        []FeedEntry
	HasMore        bool
	Details        Details
	LatestSequence uint64
}

// ListPage has a stable time/ID cursor, without defining past/future boundaries.
type ListPage struct {
	Meetings   []Details
	NextCursor string
}

// Service coordinates meeting operations against the injected transactional store.
type Service struct {
	store Store
	now   func() time.Time
}

// NewService builds application operations without depending on HTTP or identity.
func NewService(store Store, now func() time.Time) *Service { return &Service{store: store, now: now} }

func (s *Service) update(ctx context.Context, callback func(Writer) error) error {
	return s.store.Update(ctx, func(writer Writer) error {
		if err := writer.PruneReceipts(s.now()); err != nil {
			return err
		}
		return callback(writer)
	})
}

func checkActor(actor Actor) error {
	if actor.ID == "" || actor.Name == "" {
		return ErrUnauthenticated
	}
	return nil
}
func snapshot(reader Reader, meeting Meeting, userID string) (Details, error) {
	result := Details{Meeting: meeting, ParticipantCount: 1}
	responses, err := reader.RSVPs(meeting.ID)
	if err != nil {
		return Details{}, err
	}
	for _, response := range responses {
		if response.UserID == userID {
			result.MyResponse = response
		}
		if response.Answer == Going && response.UserID != meeting.OrganizerID {
			result.ParticipantCount++
		}
	}
	return result, nil
}
func allowed(details Details, userID string) bool {
	return details.Meeting.OrganizerID == userID || details.MyResponse.Answer == Going
}
func privateSnapshot(reader Reader, id, userID string) (Details, error) {
	meeting, err := reader.Meeting(id)
	if err != nil {
		return Details{}, err
	}
	result, err := snapshot(reader, meeting, userID)
	if err != nil {
		return Details{}, err
	}
	if !allowed(result, userID) {
		return Details{}, ErrForbidden
	}
	return result, nil
}
func responseState(details Details, userID string) ResponseState {
	return ResponseState{MeetingID: details.Meeting.ID, Answer: details.MyResponse.Answer, Revision: details.MyResponse.Revision, MeetingRevision: details.Meeting.Revision, CanAccessFeed: allowed(details, userID)}
}
func increment(revision uint64) (uint64, error) {
	if revision == ^uint64(0) {
		return 0, ErrInvalidRecord
	}
	return revision + 1, nil
}
func (s *Service) entry(writer Writer, meetingID, kind string, actor Actor, payload any, requestID string) (FeedEntry, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return FeedEntry{}, err
	}
	return writer.AppendEntry(FeedEntry{ID: randomUUID(), MeetingID: meetingID, Kind: kind, ActorID: actor.ID, ActorName: actor.Name, OccurredAt: s.now().UTC(), PayloadVersion: 1, Payload: data, ClientRequestID: requestID})
}
