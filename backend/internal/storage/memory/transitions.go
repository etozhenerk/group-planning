package memory

import (
	"slices"
	"strings"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type transitionKey struct {
	meetingID string
	version   uint64
}

func (tx *transaction) TransitionJob(id string, version uint64) (meetings.TransitionJob, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.TransitionJob{}, err
	}

	job, ok := tx.data.jobs[transitionKey{id, version}]
	if !ok {
		return meetings.TransitionJob{}, meetings.ErrNotFound
	}

	return job, nil
}

func (tx *transaction) SaveTransitionJob(job meetings.TransitionJob) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	if job.ID == "" || job.MeetingID == "" || job.ScheduleVersion == 0 || job.DueAt.IsZero() || job.Attempts < 0 {
		return meetings.ErrInvalidRecord
	}

	key := transitionKey{job.MeetingID, job.ScheduleVersion}
	if previous, exists := tx.data.jobs[key]; exists && previous.ID != job.ID {
		return meetings.ErrAlreadyExists
	}

	tx.data.jobs[key] = job

	return nil
}

func (tx *transaction) DueTransitions(now time.Time, limit int) ([]meetings.TransitionJob, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	if limit < 1 {
		return nil, meetings.ErrInvalidRecord
	}

	result := []meetings.TransitionJob{}
	for _, job := range tx.data.jobs {
		ready := job.State == meetings.TransitionPending && !job.AvailableAt.After(now)
		expired := job.State == meetings.TransitionRunning && !job.LeaseUntil.After(now)
		if !job.DueAt.After(now) && (ready || expired) {
			result = append(result, job)
		}
	}

	slices.SortFunc(result, func(a, b meetings.TransitionJob) int {
		if order := a.DueAt.Compare(b.DueAt); order != 0 {
			return order
		}

		return strings.Compare(a.ID, b.ID)
	})

	return result[:min(len(result), limit)], nil
}

func (tx *transaction) OverdueMeetings(after string, now time.Time, limit int) ([]meetings.Meeting, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	if limit < 1 {
		return nil, meetings.ErrInvalidRecord
	}

	result := []meetings.Meeting{}
	for _, meeting := range tx.data.meetings {
		if meeting.ID > after && meeting.Status == meetings.Upcoming && meeting.PastAt != nil && !meeting.PastAt.After(now) {
			result = append(result, cloneMeeting(meeting))
		}
	}

	slices.SortFunc(result, func(a, b meetings.Meeting) int { return strings.Compare(a.ID, b.ID) })

	return result[:min(len(result), limit)], nil
}

func (tx *transaction) TransitionStats(now time.Time) (meetings.TransitionStats, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.TransitionStats{}, err
	}

	var stats meetings.TransitionStats
	for _, job := range tx.data.jobs {
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

	for _, meeting := range tx.data.meetings {
		if meeting.Status == meetings.Upcoming && meeting.PastAt != nil && !meeting.PastAt.After(now) {
			stats.Overdue++
			stats.OldestOverdue = max(stats.OldestOverdue, now.Sub(*meeting.PastAt))
		}
	}

	return stats, nil
}
