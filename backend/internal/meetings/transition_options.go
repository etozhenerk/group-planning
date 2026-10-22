package meetings

import "time"

// TransitionOptions bounds queue work, retries and operational warning thresholds.
type TransitionOptions struct {
	PollInterval, Lease, RetryBase, RetryMax, ReconcileInterval, DelayThreshold, ReconcileStale time.Duration
	MaxAttempts, BatchSize                                                                      int
}

// DefaultTransitionOptions is suitable for a single development process.
func DefaultTransitionOptions() TransitionOptions {
	return TransitionOptions{
		PollInterval: time.Second, Lease: 30 * time.Second, RetryBase: 5 * time.Second,
		RetryMax: 5 * time.Minute, ReconcileInterval: time.Minute, DelayThreshold: time.Minute,
		ReconcileStale: 5 * time.Minute, MaxAttempts: 5, BatchSize: 100,
	}
}

// Validate rejects unbounded loops, hot retries and leases shorter than a poll.
func (o TransitionOptions) Validate() error {
	if o.PollInterval < 10*time.Millisecond || o.PollInterval > time.Minute || o.Lease < o.PollInterval || o.Lease > time.Hour ||
		o.RetryBase < time.Millisecond || o.RetryMax < o.RetryBase || o.RetryMax > 24*time.Hour ||
		o.ReconcileInterval < o.PollInterval || o.ReconcileInterval > time.Hour || o.DelayThreshold <= 0 ||
		o.ReconcileStale < o.ReconcileInterval || o.MaxAttempts < 1 || o.MaxAttempts > 100 || o.BatchSize < 1 || o.BatchSize > 1000 {
		return ErrInvalidRecord
	}

	return nil
}

func (o TransitionOptions) retryDelay(attempt int) time.Duration {
	delay := o.RetryBase
	for i := 1; i < attempt; i++ {
		if delay >= o.RetryMax/2 {
			return o.RetryMax
		}

		delay *= 2
	}

	return min(delay, o.RetryMax)
}
