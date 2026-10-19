package meetings

import (
	"context"
	"errors"
	"time"
)

var (
	ErrNotFound          = errors.New("record not found")
	ErrAlreadyExists     = errors.New("record already exists")
	ErrInvalidRecord     = errors.New("invalid storage record")
	ErrReadOnly          = errors.New("read-only transaction")
	ErrTransactionClosed = errors.New("transaction closed")
)

// Store provides consistent reads and atomic writes. Callbacks must not nest
// operations on the same store or perform external I/O. Business rules, access
// checks and optimistic revision checks belong to the calling application operation.
type Store interface {
	View(context.Context, func(Reader) error) error
	Update(context.Context, func(Writer) error) error
}

// Reader returns independent copies. It is valid only for its callback's lifetime.
type Reader interface {
	Meeting(string) (Meeting, error)
	Meetings() ([]Meeting, error)
	InvitationByToken(string) (Invitation, error)
	InvitationForMeeting(string) (Invitation, error)
	RSVP(meetingID, userID string) (RSVP, error)
	RSVPs(meetingID string) ([]RSVP, error)
	Feed(meetingID string) ([]FeedEntry, error)
	Receipt(RequestKey) (Receipt, error)
}

// Writer extends a snapshot with changes published together when Update succeeds.
// SaveMeeting and SaveRSVP replace the record with the same key; the caller
// checks expected revisions within the callback. Other inserts reject duplicates.
type Writer interface {
	Reader
	SaveMeeting(Meeting) error
	InsertInvitation(Invitation) error
	SaveRSVP(RSVP) error
	AppendEntry(FeedEntry) (FeedEntry, error)
	InsertReceipt(Receipt) error
	PruneReceipts(time.Time) error
}
