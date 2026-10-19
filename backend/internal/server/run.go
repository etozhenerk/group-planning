package server

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/httpapi"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

// Serve binds the supplied store to HTTP and drains requests on cancellation.
// The caller owns the listener; Serve closes it on return.
func Serve(ctx context.Context, listener net.Listener, store meetings.Store, config Config, logger *slog.Logger) error {
	defer listener.Close()
	if config.ShutdownTimeout < time.Second || config.ShutdownTimeout > 30*time.Second {
		return fmt.Errorf("invalid shutdown timeout")
	}
	if err := ctx.Err(); err != nil {
		return nil
	}
	service, err := newIdentity(config.Auth, store)
	if err != nil {
		return err
	}
	cleanupCtx, stopCleanup := context.WithCancel(ctx)
	cleanupDone := make(chan struct{})
	go func() { defer close(cleanupDone); cleanupIdentity(cleanupCtx, service, logger) }()
	defer func() { stopCleanup(); <-cleanupDone }()
	server := &http.Server{
		Handler: httpapi.NewWithIdentity(store, service, logger), ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout: 10 * time.Second, WriteTimeout: 15 * time.Second,
		IdleTimeout: 60 * time.Second, MaxHeaderBytes: 16 << 10,
		// net/http's default panic logger can include raw panic values. The middleware
		// handles application panics and suppresses secrets; connection errors are silent.
		ErrorLog: slog.NewLogLogger(slog.NewTextHandler(discardWriter{}, nil), slog.LevelError),
	}
	finished := make(chan error, 1)
	go func() { finished <- server.Serve(listener) }()
	select {
	case err := <-finished:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return fmt.Errorf("serve HTTP: %w", err)
	case <-ctx.Done():
		deadline, cancel := context.WithTimeout(context.Background(), config.ShutdownTimeout)
		defer cancel()
		if err := server.Shutdown(deadline); err != nil {
			_ = server.Close()
			<-finished
			return fmt.Errorf("shutdown HTTP: %w", err)
		}
		err := <-finished
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	}
}

type discardWriter struct{}

func (discardWriter) Write(data []byte) (int, error) { return len(data), nil }
