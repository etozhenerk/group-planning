package meetings

import "time"

// BotID is the stable notification identity; its display name may change later.
const BotID = "b47f6000-0000-4000-8000-000000000001"

// PollSettings independently control ballot editing and result disclosure.
type PollSettings struct {
	MultipleAnswers bool
	AllowRevoting   bool
	AllowNewOptions bool
	Anonymous       bool
	HideResults     bool
}

// PollState distinguishes an open ballot from an immutable result.
type PollState string

const (
	PollOpen           PollState = "open"
	PollAwaitingChoice PollState = "awaiting_choice"
	PollAwaitingTime   PollState = "awaiting_time"
	PollApplied        PollState = "applied"
	PollNoMajority     PollState = "no_majority"
	PollCancelled      PollState = "cancelled"
)

// DateOption is immutable after publication. New options may be appended.
type DateOption struct{ ID, Date string }

// DateBallot preserves a user's last choice when they temporarily leave the chat.
type DateBallot struct {
	Actor     Actor
	OptionIDs []string
	Revision  uint64
}

// PollCloseJob is a transactional mock job. Execution is entirely inside Update,
// so it needs no separate lease or externally visible running state.
type PollCloseJob struct {
	State                                  TransitionState
	AvailableAt                            time.Time
	Attempts, TotalAttempts, ManualRetries int
	ErrorCode                              string
}

// DatePoll is private storage state; it must never be serialized as a response.
type DatePoll struct {
	ID, MeetingID                          string
	Author                                 Actor
	Settings                               PollSettings
	Options                                []DateOption
	Ballots                                map[string]DateBallot
	State                                  PollState
	Revision                               uint64
	CreatedAt, ClosesAt                    time.Time
	ClosedAt                               *time.Time
	FinalEligible                          []string
	Leaders                                []string
	AppliedOptionID                        string
	CreationRequestID, CreationRequestHash string
	CloseJob                               PollCloseJob
}

func (poll DatePoll) active() bool {
	return poll.State == PollOpen || poll.State == PollAwaitingChoice || poll.State == PollAwaitingTime
}

func botActor() Actor { return Actor{ID: BotID, Name: "Бот"} }
