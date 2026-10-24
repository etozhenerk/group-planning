package meetings

import (
	"context"
	"sync"
	"time"
)

// PlacePollWorker processes short, atomic mock jobs without holding a lease
// across external work. This execution model is not a persistent queue guarantee.
type PlacePollWorker struct {
	mu      sync.Mutex
	app     *Service
	options TransitionOptions
	observe func(PollObservation)
}

// NewPlacePollWorker reuses bounded queue settings and owns no detached goroutines.
func NewPlacePollWorker(app *Service, options TransitionOptions, observe func(PollObservation)) (*PlacePollWorker, error) {
	if err := options.Validate(); err != nil {
		return nil, err
	}

	if observe == nil {
		observe = func(PollObservation) {}
	}

	return &PlacePollWorker{app: app, options: options, observe: observe}, nil
}

// Run handles overdue jobs on startup and stops with its parent's context.
func (w *PlacePollWorker) Run(ctx context.Context) {
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
func (w *PlacePollWorker) Tick(parent context.Context) {
	w.mu.Lock()
	defer w.mu.Unlock()
	if parent.Err() != nil {
		return
	}

	ctx, cancel := context.WithTimeout(parent, w.options.Lease/2)
	defer cancel()
	if err := w.app.repairPlacePollJobs(ctx, w.options.BatchSize); err != nil {
		w.observe(PollObservation{Event: "place_poll_reconcile_failed", ErrorCode: "storage_error"})
		return
	}

	polls, failed, delay, err := w.app.duePlacePolls(ctx, w.options.BatchSize)
	if err != nil {
		w.observe(PollObservation{Event: "place_poll_read_failed", ErrorCode: "storage_error"})
		return
	}

	for _, poll := range polls {
		if ctx.Err() != nil {
			return
		}

		if err := w.app.ClosePlacePoll(ctx, poll.ID); err != nil {
			w.observe(PollObservation{Event: "place_poll_close_failed", PollID: poll.ID, ErrorCode: "storage_error"})
			if err := w.app.failPlacePollClose(ctx, poll.ID, w.options); err != nil {
				w.observe(PollObservation{Event: "place_poll_retry_save_failed", PollID: poll.ID, ErrorCode: "storage_error"})
			}
		}
	}

	if failed > 0 || delay > w.options.DelayThreshold {
		w.observe(PollObservation{Event: "place_poll_health_alarm", Failed: failed, OldestOverdue: delay})
	}
}
