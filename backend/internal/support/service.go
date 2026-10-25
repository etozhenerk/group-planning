package support

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"regexp"
	"strings"
	"time"
)

var uuidPattern = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

// Service owns acceptance and delivery policy; all state lives in its store.
type Service struct {
	store    Store
	delivery Delivery
	now      func() time.Time
}

// New binds storage, an optional delivery adapter and a controlled clock.
func New(store Store, delivery Delivery, now func() time.Time) *Service {
	return &Service{store: store, delivery: delivery, now: now}
}

// Submit returns the same receipt after a lost response, before charging limits.
func (s *Service) Submit(ctx context.Context, input Input, key, source string) (Receipt, error) {
	if !uuidPattern.MatchString(key) || input.ClientRequestID != key {
		return Receipt{}, ValidationError{map[string]string{"client_request_id": "must_match_idempotency_key"}}
	}

	normalized, screenshot, err := validate(input)
	if err != nil {
		return Receipt{}, err
	}

	encoded, err := json.Marshal(normalized)
	if err != nil {
		return Receipt{}, ErrUnavailable
	}

	digest := sha256.Sum256(encoded)
	hash := hex.EncodeToString(digest[:])
	rateDigest := sha256.Sum256([]byte(source))
	rateKey := hex.EncodeToString(rateDigest[:])
	var result Receipt
	err = s.store.Update(ctx, func(records Records) error {
		previous, exists, err := records.ByKey(key)
		if err != nil {
			return err
		}

		if exists {
			if previous.RequestHash != hash {
				return ErrIdempotencyConflict
			}

			result = Receipt{previous.ID, previous.Reference}

			return nil
		}

		now := s.now().UTC()
		if err := records.PruneRates(now); err != nil {
			return err
		}

		rate, exists, err := records.Rate(rateKey)
		if err != nil {
			return err
		}

		if exists && rate.Count >= 5 {
			return ErrRateLimited
		}

		all, err := records.All()
		if err != nil {
			return err
		}

		size := 0
		for _, item := range all {
			size += len(item.Description) + len(item.Email)
			if item.Screenshot != nil {
				size += len(item.Screenshot.Data)
			}
		}

		size += len(normalized.Description)
		if normalized.Email != nil {
			size += len(*normalized.Email)
		}

		if screenshot != nil {
			size += len(screenshot.Data)
		}

		if len(all) >= 1000 || size > MaxStoredBytes {
			return ErrUnavailable
		}

		id := newID()
		email := ""
		if normalized.Email != nil {
			email = *normalized.Email
		}

		record := Feedback{ID: id, Key: key, RequestHash: hash, Reference: "SW-" + strings.ToUpper(strings.ReplaceAll(id, "-", "")[:12]), Kind: normalized.Kind, Description: normalized.Description, Screen: normalized.Screen, Email: email, Screenshot: screenshot, Diagnostics: normalized.Diagnostics, CreatedAt: now, NextAttemptAt: now}
		if err := records.Put(record); err != nil {
			return err
		}

		if !exists {
			rate = RateWindow{Key: rateKey, ExpiresAt: now.Add(10 * time.Minute)}
		}

		rate.Count++
		if err := records.PutRate(rate); err != nil {
			return err
		}

		result = Receipt{id, record.Reference}

		return nil
	})

	return result, err
}

func newID() string {
	var data [16]byte
	_, _ = rand.Read(data[:])
	data[6] = data[6]&0x0f | 0x40
	data[8] = data[8]&0x3f | 0x80
	value := hex.EncodeToString(data[:])

	return value[:8] + "-" + value[8:12] + "-" + value[12:16] + "-" + value[16:20] + "-" + value[20:]
}
