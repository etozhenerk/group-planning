package server

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/identity/yandex"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func newIdentity(config AuthConfig, store meetings.Store) (*identity.Service, error) {
	if !config.Enabled {
		return nil, nil
	}

	provider := yandex.New(config.ClientID, config.ClientSecret, config.Identity.PublicOrigin+"/api/v1/auth/yandex/callback", nil)

	return identity.New(config.Identity, memory.NewIdentity(), provider, time.Now, func(ctx context.Context, token string) (bool, error) {
		_, err := meetings.Preview(ctx, store, token)
		if errors.Is(err, meetings.ErrNotFound) {
			return false, nil
		}

		return err == nil, err
	})
}

func cleanupIdentity(ctx context.Context, service *identity.Service, logger *slog.Logger) {
	if service == nil {
		return
	}

	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if _, err := service.Cleanup(ctx); err != nil && ctx.Err() == nil {
				logger.Error("auth_cleanup_failed")
			}
		}
	}
}
