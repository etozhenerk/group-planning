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
	"github.com/etozhenerk/group-planning/backend/internal/webui"
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

	app := meetings.NewService(store, time.Now)
	service, err := newIdentity(config.Auth, app.InvitationExists)
	if err != nil {
		return err
	}

	var handler http.Handler = httpapi.NewWithIdentity(app, service, logger)
	if config.WebDirectory != "" {
		site, err := webui.New(app, config.WebDirectory, config.WebOrigin)
		if err != nil {
			return err
		}

		mux := http.NewServeMux()
		mux.Handle("/api/", handler)
		mux.Handle("/healthz", handler)
		mux.Handle("/", site)
		handler = mux
	}

	options := config.Transitions
	if options == (meetings.TransitionOptions{}) {
		options = meetings.DefaultTransitionOptions()
	}

	worker, err := meetings.NewTransitionWorker(app, options, transitionLogger(logger))
	if err != nil {
		return err
	}

	workerCtx, stopWorker := context.WithCancel(ctx)
	workerDone := make(chan struct{})
	go func() { defer close(workerDone); worker.Run(workerCtx) }()
	defer func() { stopWorker(); <-workerDone }()

	pollWorker, err := meetings.NewDatePollWorker(app, options, func(event meetings.PollObservation) {
		logger.Error("date poll jobs", "event", event.Event, "poll_id", event.PollID, "error_code", event.ErrorCode, "failed", event.Failed, "oldest_overdue_seconds", event.OldestOverdue.Seconds())
	})
	if err != nil {
		return err
	}

	pollCtx, stopPollWorker := context.WithCancel(ctx)
	pollDone := make(chan struct{})
	go func() { defer close(pollDone); pollWorker.Run(pollCtx) }()
	defer func() { stopPollWorker(); <-pollDone }()

	placeWorker, err := meetings.NewPlacePollWorker(app, options, func(event meetings.PollObservation) {
		logger.Error("place poll jobs", "event", event.Event, "poll_id", event.PollID, "error_code", event.ErrorCode, "failed", event.Failed, "oldest_overdue_seconds", event.OldestOverdue.Seconds())
	})
	if err != nil {
		return err
	}

	placeCtx, stopPlaceWorker := context.WithCancel(ctx)
	placeDone := make(chan struct{})
	go func() { defer close(placeDone); placeWorker.Run(placeCtx) }()
	defer func() { stopPlaceWorker(); <-placeDone }()

	cleanupCtx, stopCleanup := context.WithCancel(ctx)
	cleanupDone := make(chan struct{})
	go func() { defer close(cleanupDone); cleanupIdentity(cleanupCtx, service, logger) }()
	defer func() { stopCleanup(); <-cleanupDone }()
	server := &http.Server{
		Handler: handler, ReadHeaderTimeout: 5 * time.Second,
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

func (discardWriter) Write(data []byte) (int, error) {
	return len(data), nil
}
