package postgres

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

func TestCallbackAuthFailurePreservesCancellation(t *testing.T) {
	for _, expired := range []bool{false, true} {
		name := "cancelled"
		ctx, cancel := context.WithCancel(t.Context())
		if expired {
			cancel()
			name = "deadline"
			ctx, cancel = context.WithDeadline(t.Context(), time.Now().Add(-time.Second))
		}

		cancel()
		t.Run(name, func(t *testing.T) {
			tx := &transaction{ctx: ctx}
			records := &identityTransaction{tx}
			// The context expires before QueryRow: Session reports no value, while
			// the transaction must preserve cancellation behind that boolean.
			if _, exists := records.Session("synthetic-session-hash"); exists {
				t.Fatal("cancelled lookup returned a session")
			}

			tx.close()
			err := tx.callbackError(identity.ErrUnauthenticated)
			if !errors.Is(err, ctx.Err()) || errors.Is(err, identity.ErrUnauthenticated) {
				t.Fatalf("cancelled lookup became a terminal auth error: %v", err)
			}
		})
	}
}

func TestCallbackAuthDenialWithoutCancellationRemainsTerminal(t *testing.T) {
	tx := &transaction{ctx: t.Context()}
	if err := tx.callbackError(identity.ErrUnauthenticated); !errors.Is(err, identity.ErrUnauthenticated) {
		t.Fatalf("real session denial changed: %v", err)
	}
}

func TestCallbackFailurePreservesStorageFailure(t *testing.T) {
	ctx, cancel := context.WithCancel(t.Context())
	cancel()
	tx := &transaction{ctx: ctx, err: ErrUnavailable}
	if err := tx.callbackError(identity.ErrUnauthenticated); !errors.Is(err, ErrUnavailable) {
		t.Fatalf("storage failure replaced by auth denial: %v", err)
	}
}
