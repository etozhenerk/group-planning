package server

import (
	"context"
	"log/slog"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/identity/yandex"
)

func newIdentity(config AuthConfig, store identity.Store, invitationExists func(context.Context, string) (bool, error)) (*identity.Service, error) {
	if !config.Enabled {
		return nil, nil
	}

	provider := yandex.New(config.ClientID, config.ClientSecret, config.Identity.PublicOrigin+"/api/v1/auth/yandex/callback", nil)

	return identity.New(config.Identity, store, provider, time.Now, invitationExists)
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
