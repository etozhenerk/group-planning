// Package server owns process configuration and HTTP lifecycle.
package server

import (
	"fmt"
	"net"
	"strconv"
	"time"
)

// Config contains non-secret settings for the in-memory development server.
type Config struct {
	Address         string
	ShutdownTimeout time.Duration
}

// LoadConfig reads configuration without mutating the process environment.
func LoadConfig(getenv func(string) string) (Config, error) {
	config := Config{Address: "127.0.0.1:8080", ShutdownTimeout: 5 * time.Second}
	if storage := getenv("SOMEWHERE_STORAGE"); storage != "" && storage != "memory" {
		return Config{}, fmt.Errorf("SOMEWHERE_STORAGE must be memory")
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
	return config, nil
}
