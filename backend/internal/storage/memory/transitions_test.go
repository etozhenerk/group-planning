package memory_test

import (
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestTransitionJobsShareAtomicSnapshot(t *testing.T) {
	store := memory.New()
	due := time.Date(2026, 10, 25, 0, 0, 0, 0, time.UTC)
	meeting := meetings.Meeting{ID: "meeting", Status: meetings.Upcoming, ScheduleVersion: 1, PastAt: &due}
	job := meetings.TransitionJob{ID: "job", MeetingID: meeting.ID, ScheduleVersion: 1, DueAt: due, AvailableAt: due, State: meetings.TransitionPending}
	failure := errors.New("rollback")
	err := store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meeting); err != nil {
			return err
		}

		if err := w.SaveTransitionJob(job); err != nil {
			return err
		}

		return failure
	})
	if !errors.Is(err, failure) {
		t.Fatal(err)
	}

	err = store.View(t.Context(), func(r meetings.Reader) error {
		_, err := r.TransitionJob(meeting.ID, 1)
		if !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("job survived rollback")
		}

		all, err := r.Meetings()
		if len(all) != 0 {
			t.Fatal("meeting survived rollback")
		}

		return err
	})
	if err != nil {
		t.Fatal(err)
	}

	var expired meetings.Writer
	err = store.Update(t.Context(), func(w meetings.Writer) error {
		expired = w
		if err := w.SaveMeeting(meeting); err != nil {
			return err
		}

		return w.SaveTransitionJob(job)
	})
	if err != nil {
		t.Fatal(err)
	}

	if err := expired.SaveTransitionJob(job); !errors.Is(err, meetings.ErrTransactionClosed) {
		t.Fatal("expired writer mutated queue")
	}

	err = store.Update(t.Context(), func(w meetings.Writer) error {
		duplicate := job
		duplicate.ID = "another"
		if err := w.SaveTransitionJob(duplicate); !errors.Is(err, meetings.ErrAlreadyExists) {
			t.Fatal("duplicate schedule replaced job")
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	err = store.View(t.Context(), func(r meetings.Reader) error {
		copy, err := r.Meeting(meeting.ID)
		if err != nil {
			return err
		}

		*copy.PastAt = time.Time{}
		job, err := r.TransitionJob(meeting.ID, 1)
		job.State = meetings.TransitionCompleted

		return err
	})
	if err != nil {
		t.Fatal(err)
	}

	err = store.View(t.Context(), func(r meetings.Reader) error {
		copy, err := r.Meeting(meeting.ID)
		if err != nil {
			return err
		}

		job, err := r.TransitionJob(meeting.ID, 1)
		if !copy.PastAt.Equal(due) || job.State != meetings.TransitionPending {
			t.Fatal("read snapshot mutated stored records")
		}

		return err
	})
	if err != nil {
		t.Fatal(err)
	}
}
