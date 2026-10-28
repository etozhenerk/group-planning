package memory

import (
	"context"
	"maps"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/support"
)

// Support is a bounded process-local queue. Restart loses accepted records.
type Support struct {
	gate    chan struct{}
	records map[string]support.Feedback
	rates   map[string]support.RateWindow
}

// NewSupport creates a separate queue, without access to identity or meetings.
func NewSupport() *Support {
	return &Support{gate: make(chan struct{}, 1), records: map[string]support.Feedback{}, rates: map[string]support.RateWindow{}}
}

// Update publishes the complete transaction only after success and cancellation checks.
func (s *Support) Update(ctx context.Context, callback func(support.Records) error) error {
	select {
	case s.gate <- struct{}{}:
	case <-ctx.Done():
		return ctx.Err()
	}

	defer func() { <-s.gate }()
	if err := ctx.Err(); err != nil {
		return err
	}

	tx := &supportTransaction{records: maps.Clone(s.records), rates: maps.Clone(s.rates), active: true}
	defer func() { tx.active = false }()
	if err := callback(tx); err != nil {
		return err
	}

	if err := ctx.Err(); err != nil {
		return err
	}

	s.records = tx.records
	s.rates = tx.rates

	return nil
}

type supportTransaction struct {
	records map[string]support.Feedback
	rates   map[string]support.RateWindow
	active  bool
}

func (tx *supportTransaction) ByKey(key string) (support.Feedback, bool, error) {
	if !tx.active {
		return support.Feedback{}, false, support.ErrUnavailable
	}

	v, ok := tx.records[key]

	return cloneFeedback(v), ok, nil
}

func (tx *supportTransaction) All() ([]support.Feedback, error) {
	if !tx.active {
		return nil, support.ErrUnavailable
	}

	items := make([]support.Feedback, 0, len(tx.records))
	for _, v := range tx.records {
		items = append(items, cloneFeedback(v))
	}

	return items, nil
}

func (tx *supportTransaction) Put(v support.Feedback) error {
	if !tx.active {
		return support.ErrUnavailable
	}

	tx.records[v.Key] = cloneFeedback(v)

	return nil
}

func (tx *supportTransaction) Rate(key string) (support.RateWindow, bool, error) {
	if !tx.active {
		return support.RateWindow{}, false, support.ErrUnavailable
	}

	v, ok := tx.rates[key]

	return v, ok, nil
}

func (tx *supportTransaction) PutRate(v support.RateWindow) error {
	if !tx.active {
		return support.ErrUnavailable
	}

	tx.rates[v.Key] = v

	return nil
}

func (tx *supportTransaction) PruneRates(now time.Time) error {
	if !tx.active {
		return support.ErrUnavailable
	}

	for key, v := range tx.rates {
		if !now.Before(v.ExpiresAt) {
			delete(tx.rates, key)
		}
	}

	return nil
}

func (tx *supportTransaction) PruneFeedback(before time.Time) error {
	if !tx.active {
		return support.ErrUnavailable
	}

	for key, value := range tx.records {
		if !value.CreatedAt.After(before) {
			delete(tx.records, key)
		}
	}

	return nil
}

func cloneFeedback(v support.Feedback) support.Feedback {
	if v.Screenshot != nil {
		copy := *v.Screenshot
		copy.Data = append([]byte(nil), copy.Data...)
		v.Screenshot = &copy
	}

	if v.Diagnostics != nil {
		copy := *v.Diagnostics
		if copy.Viewport != nil {
			viewport := *copy.Viewport
			copy.Viewport = &viewport
		}

		v.Diagnostics = &copy
	}

	return v
}
