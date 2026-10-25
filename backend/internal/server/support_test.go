package server

import (
	"strings"
	"testing"
)

func TestSupportConfigurationAndPersistentGate(t *testing.T) {
	token := "123456:abcdefghijklmnopqrstuv"
	for _, env := range []map[string]string{{"SOMEWHERE_SUPPORT_BOT_TOKEN": token}, {"SOMEWHERE_SUPPORT_CHAT_ID": "-100001"}, {"SOMEWHERE_SUPPORT_BOT_TOKEN": "https://other.test/secret", "SOMEWHERE_SUPPORT_CHAT_ID": "-100001"}} {
		_, err := loadSupportConfig(func(key string) string { return env[key] })
		if err == nil || strings.Contains(err.Error(), token) || strings.Contains(err.Error(), "secret") {
			t.Fatal("invalid or disclosed credentials")
		}
	}

	config, err := loadSupportConfig(func(key string) string {
		if key == "SOMEWHERE_SUPPORT_BOT_TOKEN" {
			return token
		}

		return "-100001"
	})
	if err != nil {
		t.Fatal(err)
	}

	if service, err := newSupport(Config{Storage: "postgres"}); service != nil || err != nil {
		t.Fatal("ephemeral public production acceptance enabled")
	}

	if _, err := newSupport(Config{Storage: "postgres", Support: config}); err == nil {
		t.Fatal("configured delivery ignored missing persistent queue")
	}

	if service, err := newSupport(Config{Storage: "memory"}); service == nil || err != nil {
		t.Fatal("local acceptance unavailable")
	}
}
