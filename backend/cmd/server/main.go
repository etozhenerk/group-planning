// Command server starts the API with explicitly selected storage.
package main

import (
	"context"
	"log/slog"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/server"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
	"github.com/etozhenerk/group-planning/backend/internal/storage/postgres"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stderr, nil))
	if err := run(logger); err != nil {
		// Error values may contain bind addresses; never log request/provider data here.
		logger.Error("server_stopped", "error", err.Error())
		os.Exit(1)
	}
}

func run(logger *slog.Logger) error {
	config, err := server.LoadConfig(os.Getenv)
	if err != nil {
		return err
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if config.Storage == "postgres" {
		return runPersistent(ctx, config, logger)
	}

	listener, err := net.Listen("tcp", config.Address)
	if err != nil {
		return err
	}

	logger.Info("server_started", "address", listener.Addr().String(), "storage", "memory",
		"data_survives_restart", false, "authentication_enabled", config.Auth.Enabled)

	return server.Serve(ctx, listener, memory.New(), config, logger)
}

func runPersistent(ctx context.Context, config server.Config, logger *slog.Logger) error {
	startup, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	db, err := postgres.Open(startup, config.DatabaseURL)
	if err != nil {
		return err
	}
	defer db.Close()
	if err := db.Check(startup); err != nil {
		return err
	}

	listener, err := net.Listen("tcp", config.Address)
	if err != nil {
		return err
	}

	logger.Info("server_started", "storage", "postgres", "data_survives_restart", true, "authentication_enabled", config.Auth.Enabled)

	return server.ServeWithStorage(ctx, listener, db.Meetings(), db.Identity(), db.Check, config, logger, meetings.WithMediaContent(db.MediaContent()))
}
