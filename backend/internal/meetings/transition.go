package meetings

import (
	"errors"
	"time"
)

// ErrTransitionLeaseLost tells an old worker that another delivery owns the job.
var ErrTransitionLeaseLost = errors.New("transition lease lost")

// TransitionState is the lifecycle of one schedule-version job.
type TransitionState string

const (
	TransitionPending   TransitionState = "pending"
	TransitionRunning   TransitionState = "running"
	TransitionCompleted TransitionState = "completed"
	TransitionFailed    TransitionState = "failed"
)

// TransitionJob contains operational identifiers only, never meeting content.
// MeetingID and ScheduleVersion form its unique key. LeaseToken fences old workers.
type TransitionJob struct {
	ID, MeetingID           string
	ScheduleVersion         uint64
	DueAt, AvailableAt      time.Time
	State                   TransitionState
	Attempts, ManualRetries int
	TotalAttempts           int
	LastFailureCode         string
	LastFailedAt            time.Time
	LeaseToken              string
	LeaseUntil              time.Time
	ErrorCode               string
}

// TransitionStats describes the queue and persisted overdue meetings.
type TransitionStats struct {
	Pending, Running, Completed, Failed, ExpiredLeases, Retries, Overdue int
	OldestOverdue                                                        time.Duration
}

func (s *Service) schedule(writer Writer, meeting *Meeting) error {
	version, err := increment(meeting.ScheduleVersion)
	if err != nil {
		return err
	}

	meeting.ScheduleVersion = version
	meeting.Status = Undated
	meeting.PastAt = nil
	if meeting.StartsAt == nil && meeting.StartsOn == "" {
		return nil
	}

	location, err := loadZone(meeting.Timezone)
	if err != nil {
		return err
	}

	start, err := scheduleStart(*meeting, location)
	if err != nil {
		return err
	}

	meeting.StartsOn = start.Format(time.DateOnly)
	due := nextLocalDay(*start)
	meeting.PastAt = &due
	meeting.Status = Past
	if !due.After(s.now()) {
		return nil
	}

	meeting.Status = Upcoming

	return ensureTransition(writer, *meeting)
}

func ensureTransition(writer Writer, meeting Meeting) error {
	_, err := writer.TransitionJob(meeting.ID, meeting.ScheduleVersion)
	if err == nil {
		return nil
	}

	if !errors.Is(err, ErrNotFound) {
		return err
	}

	return writer.SaveTransitionJob(TransitionJob{
		ID: randomUUID(), MeetingID: meeting.ID, ScheduleVersion: meeting.ScheduleVersion,
		DueAt: *meeting.PastAt, AvailableAt: *meeting.PastAt, State: TransitionPending,
	})
}
