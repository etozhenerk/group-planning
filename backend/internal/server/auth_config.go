package server

import (
	"fmt"
	"strconv"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

// AuthConfig contains server-only credentials and trusted deployment addresses.
type AuthConfig struct {
	Enabled                bool
	ClientID, ClientSecret string
	Identity               identity.Config
}

func loadAuthConfig(getenv func(string) string) (AuthConfig, error) {
	for _, key := range []string{"SOMEWHERE_DEV_USER", "SOMEWHERE_AUTH_BYPASS", "SOMEWHERE_OAUTH_PROVIDER_URL", "SOMEWHERE_YANDEX_TOKEN_URL", "SOMEWHERE_YANDEX_PROFILE_URL"} {
		if getenv(key) != "" {
			return AuthConfig{}, fmt.Errorf("unsupported authentication override: %s", key)
		}
	}
	config := AuthConfig{Identity: identity.Config{SessionTTL: 30 * 24 * time.Hour, NativeCallbacks: map[string]string{}}}
	if value := getenv("SOMEWHERE_AUTH_ENABLED"); value != "" {
		enabled, err := strconv.ParseBool(value)
		if err != nil {
			return AuthConfig{}, fmt.Errorf("SOMEWHERE_AUTH_ENABLED must be true or false")
		}
		config.Enabled = enabled
	}
	keys := []string{"SOMEWHERE_PUBLIC_ORIGIN", "SOMEWHERE_YANDEX_CLIENT_ID", "SOMEWHERE_YANDEX_CLIENT_SECRET", "SOMEWHERE_IOS_AUTH_CALLBACK", "SOMEWHERE_ANDROID_AUTH_CALLBACK", "SOMEWHERE_SESSION_TTL"}
	if !config.Enabled {
		for _, key := range keys {
			if getenv(key) != "" {
				return AuthConfig{}, fmt.Errorf("set SOMEWHERE_AUTH_ENABLED=true before configuring authentication")
			}
		}
		return config, nil
	}
	config.ClientID = getenv("SOMEWHERE_YANDEX_CLIENT_ID")
	config.ClientSecret = getenv("SOMEWHERE_YANDEX_CLIENT_SECRET")
	if config.ClientID == "" || config.ClientSecret == "" {
		return AuthConfig{}, fmt.Errorf("Yandex client ID and secret are required when authentication is enabled")
	}
	config.Identity.PublicOrigin = getenv("SOMEWHERE_PUBLIC_ORIGIN")
	for kind, key := range map[string]string{"ios": "SOMEWHERE_IOS_AUTH_CALLBACK", "android": "SOMEWHERE_ANDROID_AUTH_CALLBACK"} {
		if value := getenv(key); value != "" {
			config.Identity.NativeCallbacks[kind] = value
		}
	}
	if value := getenv("SOMEWHERE_SESSION_TTL"); value != "" {
		duration, err := time.ParseDuration(value)
		if err != nil || duration < time.Hour {
			return AuthConfig{}, fmt.Errorf("SOMEWHERE_SESSION_TTL must be a Go duration from 1h to 720h")
		}
		config.Identity.SessionTTL = duration
	}
	if err := identity.ValidateConfig(config.Identity); err != nil {
		return AuthConfig{}, err
	}
	return config, nil
}
