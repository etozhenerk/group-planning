package server

import (
	"context"
	"encoding/base64"
	"errors"
	"log/slog"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func loadChatSyncKey(value string) ([]byte, error) {
	if value == "" {
		return nil, nil
	}

	key, err := base64.StdEncoding.DecodeString(value)
	if err != nil || len(key) != 32 || base64.StdEncoding.EncodeToString(key) != value {
		return nil, errors.New("SOMEWHERE_CHAT_SYNC_KEY must be canonical base64 of 32 bytes")
	}

	return key, nil
}

func maintainChat(ctx context.Context, app *meetings.Service, logger *slog.Logger) {
	for {
		if ctx.Err() != nil {
			return
		}

		run, cancel := context.WithTimeout(ctx, 15*time.Second)
		more, err := app.MaintainChatBatches(run)
		cancel()
		if err != nil && ctx.Err() == nil {
			logger.Error("chat maintenance failed", "error_code", "storage_unavailable")
		}

		delay := time.Minute
		if more {
			delay = 100 * time.Millisecond
		}

		timer := time.NewTimer(delay)
		select {
		case <-ctx.Done():
			timer.Stop()
			return
		case <-timer.C:
		}
	}
}

func dispatchChat(ctx context.Context, app *meetings.Service, publisher meetings.ChatPublisher, logger *slog.Logger) {
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()
	for {
		if ctx.Err() != nil {
			return
		}

		run, cancel := context.WithTimeout(ctx, 2*time.Second)
		stats, err := app.DispatchChat(run, publisher)
		cancel()
		if err != nil && ctx.Err() == nil {
			logger.Error("chat dispatch interrupted", "error_code", "dispatch_unavailable", "claimed", stats.Claimed, "acknowledged", stats.Acknowledged)
		}

		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}
