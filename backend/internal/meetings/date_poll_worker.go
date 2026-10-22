package meetings

import (
	"context"
	"sync"
	"time"
)

// PollObservation contains safe operational identifiers, never ballots or text.
type PollObservation struct {
	Event, PollID, ErrorCode string
	Failed                   int
	OldestOverdue            time.Duration
}

// DatePollWorker processes short, atomic mock jobs without holding a lease
// across external work. This execution model is not a persistent queue guarantee.
type DatePollWorker struct {
	mu      sync.Mutex
	app     *Service
	options TransitionOptions
	observe func(PollObservation)
}

// NewDatePollWorker reuses bounded queue settings and owns no detached goroutines.
func NewDatePollWorker(app *Service, options TransitionOptions, observe func(PollObservation)) (*DatePollWorker, error) {
	if err := options.Validate(); err != nil {
		return nil, err
	}

	if observe == nil {
		observe = func(PollObservation) {}
	}

	return &DatePollWorker{app: app, options: options, observe: observe}, nil
}

// Run handles overdue jobs on startup and stops with its parent's context.
func (w *DatePollWorker) Run(ctx context.Context) {
	w.Tick(ctx)
	ticker := time.NewTicker(w.options.PollInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			w.Tick(ctx)
		}
	}
}

// Tick is exposed for deterministic clock and failure tests.
func (w *DatePollWorker) Tick(parent context.Context) {
	w.mu.Lock()
	defer w.mu.Unlock()
	if parent.Err() != nil {
		return
	}

	ctx, cancel := context.WithTimeout(parent, w.options.Lease/2)
	defer cancel()
	if err := w.app.repairDatePollJobs(ctx, w.options.BatchSize); err != nil {
		w.observe(PollObservation{Event: "date_poll_reconcile_failed", ErrorCode: "storage_error"})
		return
	}

	polls, failed, delay, err := w.app.dueDatePolls(ctx, w.options.BatchSize)
	if err != nil {
		w.observe(PollObservation{Event: "date_poll_read_failed", ErrorCode: "storage_error"})
		return
	}

	for _, poll := range polls {
		if ctx.Err() != nil {
			return
		}

		if err := w.app.CloseDatePoll(ctx, poll.ID); err != nil {
			w.observe(PollObservation{Event: "date_poll_close_failed", PollID: poll.ID, ErrorCode: "storage_error"})
			if err := w.app.failDatePollClose(ctx, poll.ID, w.options); err != nil {
				w.observe(PollObservation{Event: "date_poll_retry_save_failed", PollID: poll.ID, ErrorCode: "storage_error"})
			}
		}
	}

	if failed > 0 || delay > w.options.DelayThreshold {
		w.observe(PollObservation{Event: "date_poll_health_alarm", Failed: failed, OldestOverdue: delay})
	}
}
