// Package server owns process configuration and HTTP lifecycle.
package server

import (
	"fmt"
	"net"
	"strconv"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/webui"
)

// Config includes deployment settings and server-only OAuth credentials.
// Do not log or serialize the configuration.
type Config struct {
	Support          SupportConfig
	Storage          string
	DatabaseURL      string
	Transitions      meetings.TransitionOptions
	Auth             AuthConfig
	WebDirectory     string
	WebOrigin        string
	LinkAssociations webui.LinkAssociations
	Address          string
	ShutdownTimeout  time.Duration
}

// LoadConfig reads configuration without mutating the process environment.
func LoadConfig(getenv func(string) string) (Config, error) {
	config := Config{Address: "127.0.0.1:8080", ShutdownTimeout: 5 * time.Second}
	config.Storage = getenv("SOMEWHERE_STORAGE")
	if config.Storage == "" {
		config.Storage = "memory"
	}

	if config.Storage != "memory" && config.Storage != "postgres" {
		return Config{}, fmt.Errorf("SOMEWHERE_STORAGE must be memory or postgres")
	}

	config.DatabaseURL = getenv("SOMEWHERE_DATABASE_URL")
	if config.Storage == "postgres" && config.DatabaseURL == "" {
		return Config{}, fmt.Errorf("SOMEWHERE_DATABASE_URL is required")
	}

	if address := getenv("SOMEWHERE_HTTP_ADDR"); address != "" {
		config.Address = address
	}

	host, port, err := net.SplitHostPort(config.Address)
	number, parseErr := strconv.Atoi(port)
	if err != nil || host == "" || parseErr != nil || number < 1 || number > 65535 {
		return Config{}, fmt.Errorf("SOMEWHERE_HTTP_ADDR must contain an explicit host and port 1..65535")
	}

	if value := getenv("SOMEWHERE_SHUTDOWN_TIMEOUT"); value != "" {
		timeout, err := time.ParseDuration(value)
		if err != nil || timeout < time.Second || timeout > 30*time.Second {
			return Config{}, fmt.Errorf("SOMEWHERE_SHUTDOWN_TIMEOUT must be between 1s and 30s")
		}

		config.ShutdownTimeout = timeout
	}

	auth, err := loadAuthConfig(getenv)
	if err != nil {
		return Config{}, err
	}

	config.WebDirectory = getenv("SOMEWHERE_WEB_DIST")
	config.WebOrigin = getenv("SOMEWHERE_WEB_ORIGIN")
	if (config.WebDirectory == "") != (config.WebOrigin == "") {
		return Config{}, fmt.Errorf("SOMEWHERE_WEB_DIST and SOMEWHERE_WEB_ORIGIN must be configured together")
	}

	if auth.Enabled && config.WebOrigin != "" && config.WebOrigin != auth.Identity.PublicOrigin {
		return Config{}, fmt.Errorf("web and authentication must use the same public origin")
	}

	config.Transitions, err = loadTransitionOptions(getenv)
	if err != nil {
		return Config{}, err
	}

	config.Auth = auth
	config.Support, err = loadSupportConfig(getenv)
	if err != nil {
		return Config{}, err
	}

	config.LinkAssociations, err = loadLinkAssociations(getenv)
	if err != nil {
		return Config{}, err
	}

	return config, nil
}
