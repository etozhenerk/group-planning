package server

import (
	"log/slog"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func transitionLogger(logger *slog.Logger) func(meetings.TransitionObservation) {
	return func(event meetings.TransitionObservation) {
		health := event.Health
		level := slog.LevelInfo
		if event.ErrorCode != "" || event.Event == "transition_failed" || health.FailedAlarm || health.DelayAlarm || health.ReconcileAlarm {
			level = slog.LevelError
		}

		args := []any{"event", event.Event}
		if event.Job.ID != "" {
			args = append(args, "job_id", event.Job.ID, "meeting_id", event.Job.MeetingID, "schedule_version", event.Job.ScheduleVersion, "attempt", event.Job.Attempts, "total_attempts", event.Job.TotalAttempts)
		}

		if event.ErrorCode != "" {
			args = append(args, "error_code", event.ErrorCode)
		}

		if event.Event == "transition_health" {
			args = append(args, "pending", health.Queue.Pending, "running", health.Queue.Running, "completed", health.Queue.Completed,
				"failed", health.Queue.Failed, "retries", health.Queue.Retries, "expired_leases", health.Queue.ExpiredLeases,
				"overdue", health.Queue.Overdue, "oldest_overdue_seconds", health.Queue.OldestOverdue.Seconds(),
				"last_reconcile_success", health.LastReconcileSuccess, "reconcile_errors", health.ReconcileErrors,
				"storage_errors", health.StorageErrors, "repaired", health.Repaired,
				"failed_alarm", health.FailedAlarm, "delay_alarm", health.DelayAlarm, "reconcile_alarm", health.ReconcileAlarm)
		}

		logger.Log(nil, level, "meeting transitions", args...)
	}
}
