package httpapi

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/realtime"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

// Opt-in test-only wiring shares the browser fixture's TLS cookie/provider flow.
func browserChatFixture(t *testing.T, store *memory.Store, auth *identity.Service) (*meetings.Service, RealtimeHandler) {
	t.Helper()
	return chatFixture(t, store, auth, "BROWSER")
}

// All opt-in fixture variants share the same auth adapter and dispatcher lifecycle.
func chatFixture(t *testing.T, store *memory.Store, auth *identity.Service, platform string) (*meetings.Service, RealtimeHandler) {
	t.Helper()
	options := []meetings.Option{meetings.WithMediaContent(memory.NewMediaContent())}
	enabled := os.Getenv("SOMEWHERE_"+platform+"_CHAT_REALTIME") == "1"
	readEnabled := os.Getenv("SOMEWHERE_"+platform+"_CHAT_READ_STATE") == "1"
	if enabled || readEnabled {
		options = append(options, meetings.WithChatSyncKey([]byte(strings.Repeat("fixture-chat-signing-key-", 2)[:32])))
	}

	options = append(options, meetings.WithChatReadState(readEnabled))
	app := meetings.NewService(store, time.Now, options...)
	if err := app.InitializeChatReadState(t.Context()); err != nil {
		t.Fatal(err)
	}

	if !enabled {
		return app, nil
	}

	adapter, err := realtime.New(app, auth)
	if err != nil {
		t.Fatal(err)
	}

	ctx, cancel := context.WithCancel(t.Context())
	done := make(chan struct{})
	go func() {
		defer close(done)
		ticker := time.NewTicker(100 * time.Millisecond)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				run, stop := context.WithTimeout(ctx, 2*time.Second)
				_, err := app.DispatchChat(run, adapter)
				stop()
				if err != nil && ctx.Err() == nil {
					t.Errorf("fixture dispatcher: %v", err)
					return
				}
			}
		}
	}()
	t.Cleanup(func() {
		cancel()
		<-done
		shutdown, stop := context.WithTimeout(context.Background(), 3*time.Second)
		defer stop()
		if err := adapter.Close(shutdown); err != nil {
			t.Error(err)
		}
	})

	return app, adapter.ServeAuthenticatedHTTP
}
