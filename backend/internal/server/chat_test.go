package server

import (
	"context"
	"encoding/base64"
	"io"
	"log/slog"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestChatConfigAndMaintenanceCancellation(t *testing.T) {
	key := base64.StdEncoding.EncodeToString([]byte(strings.Repeat("k", 32)))
	config, err := LoadConfig(func(name string) string {
		if name == "SOMEWHERE_CHAT_SYNC_KEY" {
			return key
		}

		return ""
	})
	if err != nil || len(config.ChatSyncKey) != 32 {
		t.Fatal("configured key", err)
	}

	for _, invalid := range []string{"secret", base64.StdEncoding.EncodeToString([]byte("short"))} {
		_, err := loadChatSyncKey(invalid)
		if err == nil || strings.Contains(err.Error(), invalid) {
			t.Fatal("unsafe key validation")
		}
	}

	ctx, cancel := context.WithCancel(t.Context())
	done := make(chan struct{})
	go func() {
		defer close(done)
		maintainChat(ctx, meetings.NewService(memory.New(), time.Now), slog.New(slog.NewTextHandler(io.Discard, nil)))
	}()
	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("maintenance outlived lifecycle")
	}
}

type canceledChatPublisher struct{ started chan struct{} }

func (p canceledChatPublisher) PublishChat(ctx context.Context, _ meetings.ChatHint) error {
	close(p.started)
	<-ctx.Done()

	return ctx.Err()
}

func TestChatDispatcherLifecycleCancellation(t *testing.T) {
	store := memory.New()
	now := time.Now()
	if err := store.Update(t.Context(), func(w meetings.Writer) error {
		return w.EnqueueChatHint(meetings.ChatHint{ID: "intent", Target: "user", TargetID: "u", MeetingID: "deleted", Terminal: true, SchemaVersion: 1, CreatedAt: now, AvailableAt: now})
	}); err != nil {
		t.Fatal(err)
	}

	app := meetings.NewService(store, time.Now)
	publisher := canceledChatPublisher{started: make(chan struct{})}
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	done := make(chan struct{})
	go func() {
		defer close(done)
		dispatchChat(ctx, app, publisher, slog.New(slog.NewTextHandler(io.Discard, nil)))
	}()
	select {
	case <-publisher.started:
	case <-time.After(time.Second):
		t.Fatal("dispatcher not started")
	}

	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("dispatcher outlived cancellation")
	}
}
