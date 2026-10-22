package meetings

import (
	"context"
	"errors"
	"sync"
	"time"
)

// TransitionHealth contains only operational counters and timestamps.
type TransitionHealth struct {
	Queue                                    TransitionStats
	StartedAt, LastReconcileSuccess          time.Time
	ReconcileErrors, StorageErrors, Repaired uint64
	FailedAlarm, DelayAlarm, ReconcileAlarm  bool
}

// TransitionObservation never contains user text, credentials or raw errors.
type TransitionObservation struct {
	Event, ErrorCode string
	Job              TransitionJob
	Health           TransitionHealth
}

// TransitionWorker runs against the same store as the API. Tick is also usable
// with a controlled clock. Concurrent ticks are serialized for bounded work.
type TransitionWorker struct {
	mu            sync.Mutex
	app           *Service
	options       TransitionOptions
	observe       func(TransitionObservation)
	health        TransitionHealth
	after         string
	nextReconcile time.Time
}

// NewTransitionWorker binds background operations and a safe diagnostics sink.
func NewTransitionWorker(app *Service, options TransitionOptions, observe func(TransitionObservation)) (*TransitionWorker, error) {
	if err := options.Validate(); err != nil {
		return nil, err
	}

	if observe == nil {
		observe = func(TransitionObservation) {}
	}

	return &TransitionWorker{app: app, options: options, observe: observe, health: TransitionHealth{StartedAt: app.now().UTC()}}, nil
}

// Run reconciles on startup, polls until cancellation and owns no detached goroutines.
func (worker *TransitionWorker) Run(ctx context.Context) {
	worker.Tick(ctx)
	ticker := time.NewTicker(worker.options.PollInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			worker.Tick(ctx)
		}
	}
}

// Health returns the last observation without exposing mutable worker state.
func (worker *TransitionWorker) Health() TransitionHealth {
	worker.mu.Lock()
	defer worker.mu.Unlock()

	return worker.health
}

// Tick bounds database waits to half a lease, preserving recovery after a crash.
func (worker *TransitionWorker) Tick(parent context.Context) {
	worker.mu.Lock()
	defer worker.mu.Unlock()
	if parent.Err() != nil {
		return
	}

	ctx, cancel := context.WithTimeout(parent, worker.options.Lease/2)
	defer cancel()
	now := worker.app.now().UTC()
	if worker.after != "" || !now.Before(worker.nextReconcile) {
		worker.reconcile(ctx, now)
	}

	for range worker.options.BatchSize {
		if ctx.Err() != nil {
			break
		}

		job, err := worker.app.ClaimTransition(ctx, worker.options)
		if errors.Is(err, ErrNotFound) {
			break
		}

		if err != nil {
			worker.storageError("claim_failed", err)
			break
		}

		if job.State == TransitionFailed {
			worker.observe(TransitionObservation{Event: "transition_failed", ErrorCode: job.ErrorCode, Job: job})
			continue
		}

		if job.ErrorCode == "lease_expired" {
			worker.observe(TransitionObservation{Event: "lease_recovered", Job: job})
		}

		if err := worker.app.CompleteTransition(ctx, job); err != nil {
			worker.observe(TransitionObservation{Event: "transition_attempt_failed", ErrorCode: transitionError(err), Job: job})
			if failErr := worker.app.FailTransition(ctx, job, worker.options, err); failErr != nil {
				worker.storageError("retry_save_failed", failErr)
			}
		} else {
			worker.observe(TransitionObservation{Event: "transition_completed", Job: job})
		}
	}

	stats, err := worker.app.ReadTransitionStats(ctx)
	if err != nil {
		worker.storageError("metrics_failed", err)
	} else {
		worker.health.Queue = stats
	}

	worker.health.FailedAlarm = worker.health.Queue.Failed > 0
	worker.health.DelayAlarm = worker.health.Queue.OldestOverdue > worker.options.DelayThreshold
	last := worker.health.LastReconcileSuccess
	if last.IsZero() {
		last = worker.health.StartedAt
	}

	worker.health.ReconcileAlarm = worker.health.ReconcileErrors > 0 && worker.health.LastReconcileSuccess.IsZero() || now.Sub(last) > worker.options.ReconcileStale
	worker.observe(TransitionObservation{Event: "transition_health", Health: worker.health})
}

func (worker *TransitionWorker) reconcile(ctx context.Context, now time.Time) {
	next, repaired, err := worker.app.ReconcileTransitions(ctx, worker.after, worker.options.BatchSize)
	worker.nextReconcile = now.Add(worker.options.ReconcileInterval)
	if err != nil {
		worker.health.ReconcileErrors++
		worker.observe(TransitionObservation{Event: "reconciliation_failed", ErrorCode: transitionError(err)})

		return
	}

	worker.after = next
	worker.health.Repaired += uint64(repaired)
	if next == "" {
		worker.health.LastReconcileSuccess = now
	}
}

func (worker *TransitionWorker) storageError(event string, err error) {
	worker.health.StorageErrors++
	worker.observe(TransitionObservation{Event: event, ErrorCode: transitionError(err)})
}
