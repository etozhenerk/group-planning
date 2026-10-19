// Command server starts the temporary single-process API without a database.
package main

import (
	"context"
	"log/slog"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/etozhenerk/group-planning/backend/internal/server"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
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
	listener, err := net.Listen("tcp", config.Address)
	if err != nil {
		return err
	}
	logger.Info("server_started", "address", listener.Addr().String(), "storage", "memory",
		"data_survives_restart", false, "authentication_enabled", config.Auth.Enabled)
	return server.Serve(ctx, listener, memory.New(), config, logger)
}
