package main

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"time"

	"github.com/etozhenerk/group-planning/infra/telegram-bot/internal/cloud"
	"github.com/etozhenerk/group-planning/infra/telegram-bot/internal/probe"
)

// Probe runs from a private timer trigger using a separate metrics-writer identity.
func Probe(ctx context.Context, _ []byte) ([]byte, error) {
	ctx, cancel := context.WithTimeout(ctx, 25*time.Second)
	defer cancel()
	var config probe.Config
	if err := json.Unmarshal([]byte(os.Getenv("PROBE_CONFIG_JSON")), &config); err != nil {
		return nil, errors.New("invalid probe JSON")
	}

	if err := config.Validate(); err != nil {
		return nil, err
	}

	client := probe.NewClient()
	defer client.CloseIdleConnections()
	now := time.Now().UTC()
	values := probe.Run(ctx, client, config.Origin, now)
	writer := cloud.NewClient(config.FolderID)
	defer writer.HTTP.CloseIdleConnections()
	defer writer.MetadataHTTP.CloseIdleConnections()
	token, err := writer.IAMToken(ctx)
	if err != nil {
		return nil, err
	}

	if err = writer.Write(ctx, token, values, now); err != nil {
		return nil, err
	}

	return []byte(`{"written":true}`), nil
}
