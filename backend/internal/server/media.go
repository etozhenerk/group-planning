package server

import (
	"context"
	"log/slog"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func cleanupMedia(ctx context.Context, app *meetings.Service, logger *slog.Logger) {
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := app.PruneMedia(ctx); err != nil && ctx.Err() == nil {
				logger.Error("media_cleanup_failed")
			}
		}
	}
}
