package identity

import (
	"errors"
	"net/url"
	"time"
)

// ValidateConfig rejects untrusted or ambiguous return addresses.
func ValidateConfig(config Config) error {
	origin, err := url.Parse(config.PublicOrigin)
	if err != nil || origin.Scheme != "https" || origin.Hostname() == "" || origin.User != nil || origin.Path != "" || origin.RawQuery != "" || origin.Fragment != "" || origin.ForceQuery {
		return errors.New("public origin must be an HTTPS origin without path, query or fragment")
	}

	if config.SessionTTL <= 0 || config.SessionTTL > 30*24*time.Hour {
		return errors.New("session lifetime must be positive and at most 30 days")
	}

	for kind, address := range config.NativeCallbacks {
		if kind != "ios" && kind != "android" {
			return errors.New("unknown native client kind")
		}

		u, err := url.Parse(address)
		if err != nil || u.Hostname() == "" || u.User != nil || u.RawQuery != "" || u.ForceQuery || u.Fragment != "" || u.Opaque != "" || (u.Scheme != "https" && u.Scheme != "group-planning-"+kind) {
			return errors.New("invalid native callback")
		}

		if address == config.NativeCallbacks[map[string]string{"ios": "android", "android": "ios"}[kind]] {
			return errors.New("native callbacks must differ")
		}
	}

	return nil
}
