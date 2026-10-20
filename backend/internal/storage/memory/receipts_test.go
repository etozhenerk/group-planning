package memory_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestReceiptPruningBoundaryAndTransactionGuards(t *testing.T) {
	store := memory.New()
	ctx := context.Background()
	now := time.Now()
	key := meetings.RequestKey{UserID: "owner", Operation: "create", Key: "request"}
	must := func(err error) {
		t.Helper()
		if err != nil {
			t.Fatal(err)
		}
	}
	must(store.Update(ctx, func(w meetings.Writer) error {
		return w.InsertReceipt(meetings.Receipt{Key: key, RequestHash: "hash", ResourceID: "meeting", ExpiresAt: now})
	}))
	rollback := errors.New("rollback")
	if err := store.Update(ctx, func(w meetings.Writer) error {
		if err := w.PruneReceipts(now); err != nil {
			return err
		}

		return rollback
	}); !errors.Is(err, rollback) {
		t.Fatal(err)
	}

	must(store.View(ctx, func(r meetings.Reader) error {
		if err := r.(meetings.Writer).PruneReceipts(now); !errors.Is(err, meetings.ErrReadOnly) {
			t.Fatal("read-only prune", err)
		}

		_, err := r.Receipt(key)

		return err
	}))
	var retained meetings.Writer
	must(store.Update(ctx, func(w meetings.Writer) error { retained = w; return w.PruneReceipts(now) }))
	if err := retained.PruneReceipts(now); !errors.Is(err, meetings.ErrTransactionClosed) {
		t.Fatal("closed prune", err)
	}

	must(store.View(ctx, func(r meetings.Reader) error {
		_, err := r.Receipt(key)
		if !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("expiry boundary", err)
		}

		return nil
	}))
}
