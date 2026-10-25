package postgres

import (
	"strconv"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) TransitionJob(id string, version uint64) (meetings.TransitionJob, error) {
	return one[meetings.TransitionJob](tx, "SELECT document FROM transition_jobs WHERE meeting_id=$1 AND schedule_version=$2::numeric", id, strconv.FormatUint(version, 10))
}

func (tx *transaction) SaveTransitionJob(value meetings.TransitionJob) error {
	if value.ID == "" || value.MeetingID == "" || value.ScheduleVersion == 0 || value.DueAt.IsZero() || value.Attempts < 0 {
		return meetings.ErrInvalidRecord
	}

	previous, err := tx.TransitionJob(value.MeetingID, value.ScheduleVersion)
	if err != nil && err != meetings.ErrNotFound {
		return err
	}

	if err == nil && previous.ID != value.ID {
		return meetings.ErrAlreadyExists
	}

	return tx.save(value, `INSERT INTO transition_jobs(meeting_id,schedule_version,id,state,due_at,available_at,lease_until,document) VALUES($1,$2::numeric,$3,$4,$5,$6,$7,$8)
		ON CONFLICT(meeting_id,schedule_version) DO UPDATE SET state=EXCLUDED.state,due_at=EXCLUDED.due_at,available_at=EXCLUDED.available_at,lease_until=EXCLUDED.lease_until,document=EXCLUDED.document`,
		value.MeetingID, strconv.FormatUint(value.ScheduleVersion, 10), value.ID, value.State, value.DueAt, value.AvailableAt, value.LeaseUntil)
}

func (tx *transaction) DueTransitions(now time.Time, limit int) ([]meetings.TransitionJob, error) {
	if limit < 1 {
		return nil, meetings.ErrInvalidRecord
	}

	return many[meetings.TransitionJob](tx, `SELECT document FROM transition_jobs WHERE due_at <= $1 AND
		((state='pending' AND available_at <= $1) OR (state='running' AND lease_until <= $1)) ORDER BY due_at,id LIMIT $2`, now, limit)
}

func (tx *transaction) OverdueMeetings(after string, now time.Time, limit int) ([]meetings.Meeting, error) {
	if limit < 1 {
		return nil, meetings.ErrInvalidRecord
	}

	return many[meetings.Meeting](tx, "SELECT document FROM meetings WHERE id > $1 AND status=$2 AND past_at <= $3 ORDER BY id LIMIT $4", after, meetings.Upcoming, now, limit)
}

func (tx *transaction) TransitionStats(now time.Time) (meetings.TransitionStats, error) {
	jobs, err := many[meetings.TransitionJob](tx, "SELECT document FROM transition_jobs")
	if err != nil {
		return meetings.TransitionStats{}, err
	}

	stats := meetings.TransitionStats{}
	for _, job := range jobs {
		stats.Retries += max(job.TotalAttempts-1, 0)
		switch job.State {
		case meetings.TransitionPending:
			stats.Pending++
		case meetings.TransitionRunning:
			stats.Running++
			if !job.LeaseUntil.After(now) {
				stats.ExpiredLeases++
			}
		case meetings.TransitionCompleted:
			stats.Completed++
		case meetings.TransitionFailed:
			stats.Failed++
		}
	}

	overdue, err := many[meetings.Meeting](tx, "SELECT document FROM meetings WHERE status=$1 AND past_at <= $2", meetings.Upcoming, now)
	if err != nil {
		return meetings.TransitionStats{}, err
	}

	stats.Overdue = len(overdue)
	for _, meeting := range overdue {
		if meeting.PastAt != nil {
			stats.OldestOverdue = max(stats.OldestOverdue, now.Sub(*meeting.PastAt))
		}
	}

	return stats, nil
}
