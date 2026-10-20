package meetings

import (
	"errors"
	"time"
)

func (s *Service) receipt(reader Reader, key RequestKey, hash string) (Receipt, bool, error) {
	receipt, err := reader.Receipt(key)
	if errors.Is(err, ErrNotFound) {
		return Receipt{}, false, nil
	}

	if err != nil {
		return Receipt{}, false, err
	}

	if !s.now().Before(receipt.ExpiresAt) {
		return Receipt{}, false, nil
	}

	if receipt.RequestHash != hash {
		return Receipt{}, false, ErrIdempotencyConflict
	}

	return receipt, true, nil
}

func (s *Service) remember(writer Writer, key RequestKey, hash, resourceID string) error {
	return writer.InsertReceipt(Receipt{
		Key:         key,
		RequestHash: hash,
		ResourceID:  resourceID,
		ExpiresAt:   s.now().Add(30 * 24 * time.Hour),
	})
}
