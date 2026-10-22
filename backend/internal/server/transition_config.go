package server

import (
	"fmt"
	"strconv"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func loadTransitionOptions(getenv func(string) string) (meetings.TransitionOptions, error) {
	options := meetings.DefaultTransitionOptions()
	durations := map[string]*time.Duration{
		"POLL_INTERVAL": &options.PollInterval, "LEASE": &options.Lease,
		"RETRY_BASE": &options.RetryBase, "RETRY_MAX": &options.RetryMax,
		"RECONCILE_INTERVAL": &options.ReconcileInterval, "DELAY_THRESHOLD": &options.DelayThreshold,
		"RECONCILE_STALE": &options.ReconcileStale,
	}
	for key, target := range durations {
		name := "SOMEWHERE_TRANSITION_" + key
		if value := getenv(name); value != "" {
			parsed, err := time.ParseDuration(value)
			if err != nil {
				return options, fmt.Errorf("invalid %s", name)
			}

			*target = parsed
		}
	}

	for key, target := range map[string]*int{"MAX_ATTEMPTS": &options.MaxAttempts, "BATCH_SIZE": &options.BatchSize} {
		name := "SOMEWHERE_TRANSITION_" + key
		if value := getenv(name); value != "" {
			parsed, err := strconv.Atoi(value)
			if err != nil {
				return options, fmt.Errorf("invalid %s", name)
			}

			*target = parsed
		}
	}

	if err := options.Validate(); err != nil {
		return options, fmt.Errorf("invalid transition worker limits")
	}

	return options, nil
}
