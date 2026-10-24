package function

import (
	"context"
	"strings"
	"testing"
)

func TestHandlerRejectsBeforeNetwork(t *testing.T) {
	t.Setenv("BOT_CONFIG_JSON", `{"folder_id":"folder","instance_id":"host","environment":"production","chat_id":"123","secret_id":"secret","dashboards":{"vm":"vm","postgres":"pg"}}`)
	for _, body := range []string{`{`, `{"alertId":"unknown","alertStatus":"OK","annotations":{"token":"SECRET"}}`, strings.Repeat("x", 65537)} {
		if _, err := Handler(context.Background(), []byte(body)); err == nil || strings.Contains(err.Error(), "SECRET") {
			t.Fatalf("invalid rejection: %v", err)
		}
	}
}
