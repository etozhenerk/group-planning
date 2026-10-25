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
	UserRemoved(string) (bool, error)
	Reactions(string) ([]Reaction, error)
	Media(string) (Media, error)
	MeetingMedia(string) ([]Media, error)
	AllMedia() ([]Media, error)
	Cover(string) (Cover, error)
	PreparationTask(string) (PreparationTask, error)
	PreparationTasks(string) ([]PreparationTask, error)
	Meeting(string) (Meeting, error)
	PlacePoll(string) (PlacePoll, error)
	PlacePolls() ([]PlacePoll, error)
	DatePoll(string) (DatePoll, error)
	DatePolls() ([]DatePoll, error)
	Meetings() ([]Meeting, error)
	TransitionJob(string, uint64) (TransitionJob, error)
	DueTransitions(time.Time, int) ([]TransitionJob, error)
	OverdueMeetings(string, time.Time, int) ([]Meeting, error)
	TransitionStats(time.Time) (TransitionStats, error)
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
	RemoveUser(string) error
	SaveReaction(Reaction, bool) error
	SaveMedia(Media) error
	DeleteMedia(string) error
	DeleteMeeting(string) error
	DeleteRSVP(string, string) error
	AnonymizeFeed(string, string, string) error
	SaveMeeting(Meeting) error
	SaveCover(Cover) error
	DeleteCover(string) error
	SavePlacePoll(PlacePoll) error
	SavePreparationTask(PreparationTask) error
	SaveDatePoll(DatePoll) error
	SaveTransitionJob(TransitionJob) error
	InsertInvitation(Invitation) error
	SaveRSVP(RSVP) error
	AppendEntry(FeedEntry) (FeedEntry, error)
	InsertReceipt(Receipt) error
	PruneReceipts(time.Time) error
}
