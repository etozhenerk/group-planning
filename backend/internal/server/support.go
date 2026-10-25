package server

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
	"github.com/etozhenerk/group-planning/backend/internal/support"
	"github.com/etozhenerk/group-planning/backend/internal/support/telegram"
)

// SupportConfig holds server-only delivery credentials; never log this value.
type SupportConfig struct{ BotToken, ChatID string }

func loadSupportConfig(getenv func(string) string) (SupportConfig, error) {
	config := SupportConfig{BotToken: getenv("SOMEWHERE_SUPPORT_BOT_TOKEN"), ChatID: getenv("SOMEWHERE_SUPPORT_CHAT_ID")}
	if config.BotToken == "" && config.ChatID == "" {
		return config, nil
	}

	if _, err := telegram.New(config.BotToken, config.ChatID); err != nil {
		return SupportConfig{}, fmt.Errorf("invalid support delivery configuration")
	}

	return config, nil
}

func newSupport(config Config) (*support.Service, error) {
	// Persistent acceptance and retention are the explicitly deferred cloud step.
	// Never acknowledge a public production submission into an ephemeral queue.
	if config.Storage == "postgres" {
		if config.Support.BotToken != "" {
			return nil, fmt.Errorf("persistent support storage is not configured")
		}

		return nil, nil
	}

	var delivery support.Delivery
	if config.Support.BotToken != "" {
		adapter, err := telegram.New(config.Support.BotToken, config.Support.ChatID)
		if err != nil {
			return nil, err
		}

		delivery = adapter
	}

	return support.New(memory.NewSupport(), delivery, time.Now), nil
}

func deliverSupport(ctx context.Context, service *support.Service, logger *slog.Logger) {
	if service == nil {
		return
	}

	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			_, err := service.DeliverNext(ctx)
			if err != nil && ctx.Err() == nil {
				code := "delivery_unavailable"
				if errors.Is(err, support.ErrDeliveryExhausted) {
					code = "delivery_attempts_exhausted"
				}

				logger.Error("support_delivery_failed", "error_code", code)
			}
		}
	}
}
