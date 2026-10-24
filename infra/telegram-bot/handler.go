// Package main implements the private Monium channel entry point.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/etozhenerk/group-planning/infra/telegram-bot/internal/chart"
	"github.com/etozhenerk/group-planning/infra/telegram-bot/internal/cloud"
	"github.com/etozhenerk/group-planning/infra/telegram-bot/internal/notify"
	"github.com/etozhenerk/group-planning/infra/telegram-bot/internal/telegram"
)

// Handler accepts raw Monium JSON; deployment IAM protects the function itself.
func Handler(ctx context.Context, raw []byte) ([]byte, error) {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	now := time.Now().UTC()
	if len(raw) > 65536 {
		return nil, errors.New("event too large")
	}

	var event notify.Event
	if err := json.Unmarshal(raw, &event); err != nil {
		return nil, errors.New("invalid event JSON")
	}

	var config notify.Config
	if err := json.Unmarshal([]byte(os.Getenv("BOT_CONFIG_JSON")), &config); err != nil {
		return nil, errors.New("invalid bot configuration")
	}

	catalog, err := notify.NewCatalog(config)
	if err != nil {
		return nil, err
	}

	alert, err := catalog.Resolve(event)
	if err != nil {
		return nil, err
	}

	client := cloud.NewClient(config.FolderID)
	defer client.HTTP.CloseIdleConnections()
	defer client.MetadataHTTP.CloseIdleConnections()
	iamToken, botToken, err := client.Credentials(ctx, config.SecretID)
	if err != nil {
		return nil, err
	}

	sender, err := telegram.NewSender(botToken, config.ChatID)
	if err != nil {
		return nil, err
	}
	defer sender.HTTP.CloseIdleConnections()
	result, err := notify.Deliver(ctx, alert, cloud.Metrics{Client: client, Token: iamToken}, chart.Renderer{}, sender, now)
	if err != nil {
		return nil, err
	}

	// Only bounded enum fields, never the event, HTTP URLs or secret payload.
	fmt.Printf("notification delivery=%s graph=%s\n", result.Delivery, result.Graph)

	return json.Marshal(result)
}
