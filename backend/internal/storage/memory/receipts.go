package memory

import (
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) Receipt(key meetings.RequestKey) (meetings.Receipt, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.Receipt{}, err
	}

	receipt, ok := tx.data.receipts[key]
	if !ok {
		return meetings.Receipt{}, meetings.ErrNotFound
	}

	return receipt, nil
}

func (tx *transaction) InsertReceipt(receipt meetings.Receipt) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	if receipt.Key.UserID == "" || receipt.Key.Operation == "" || receipt.Key.Key == "" || receipt.RequestHash == "" {
		return meetings.ErrInvalidRecord
	}

	if _, ok := tx.data.receipts[receipt.Key]; ok {
		return meetings.ErrAlreadyExists
	}

	tx.data.receipts[receipt.Key] = receipt

	return nil
}

func (tx *transaction) PruneReceipts(now time.Time) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	for key, receipt := range tx.data.receipts {
		if !now.Before(receipt.ExpiresAt) {
			delete(tx.data.receipts, key)
		}
	}

	return nil
}
