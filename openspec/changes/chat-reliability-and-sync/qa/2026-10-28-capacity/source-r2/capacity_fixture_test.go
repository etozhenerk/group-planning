package realtime

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"os/signal"
	"runtime"
	"strings"
	"sync/atomic"
	"syscall"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/httpapi"
	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

// This file is copied only to an archived test snapshot, never cmd/server.
func TestCapacityFixture(t *testing.T) {
	path := os.Getenv("SOMEWHERE_CAPACITY_CONFIG")
	if path == "" {
		t.Skip("opt-in engineering fixture")
	}
	ctx, cancel := signal.NotifyContext(t.Context(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	type account struct{ ID, Token, Meeting string }
	var users []account
	ids := memory.NewIdentity()
	store := memory.New()
	meetingID := func(n int) string { return fmt.Sprintf("10000000-0000-4000-8000-%012d", n) }
	for i := range 100 {
		b := make([]byte, 32)
		if _, err := rand.Read(b); err != nil {
			t.Fatal(err)
		}
		users = append(users, account{
			ID:    fmt.Sprintf("20000000-0000-4000-8000-%012d", i),
			Token: base64.RawURLEncoding.EncodeToString(b), Meeting: meetingID(1 + i/10),
		})
	}
	if err := ids.Update(ctx, func(w identity.Records) error {
		for i, u := range users {
			if err := w.PutUser(fmt.Sprintf("capacity-%d", i), identity.User{ID: u.ID, DisplayName: fmt.Sprintf("Тест %d", i)}); err != nil {
				return err
			}
			sum := sha256.Sum256([]byte(u.Token))
			w.PutSession(identity.Session{ID: fmt.Sprintf("capacity-session-%d", i), UserID: u.ID, SecretHash: hex.EncodeToString(sum[:]), ClientKind: "ios", ExpiresAt: time.Now().Add(2 * time.Hour)})
		}
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	if err := store.Update(ctx, func(w meetings.Writer) error {
		for i := range 11 {
			if err := w.SaveMeeting(meetings.Meeting{ID: meetingID(i), OrganizerID: users[0].ID, Title: "Тест нагрузки", StartsOn: "2026-12-01", Timezone: "Europe/Moscow", Revision: 1, CreatedAt: time.Now()}); err != nil {
				return err
			}
		}
		for _, u := range users {
			for _, id := range []string{meetingID(0), u.Meeting} {
				if err := w.SaveRSVP(meetings.RSVP{MeetingID: id, UserID: u.ID, Answer: meetings.Going, Revision: 1, UpdatedAt: time.Now()}); err != nil {
					return err
				}
			}
		}
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	auth, err := identity.New(identity.Config{PublicOrigin: "https://capacity.test", SessionTTL: 2 * time.Hour}, ids, unusedProvider{}, time.Now, func(context.Context, string) (bool, error) { return false, nil })
	if err != nil {
		t.Fatal(err)
	}
	app := meetings.NewService(store, time.Now, meetings.WithChatSyncKey([]byte(strings.Repeat("k", 32))), meetings.WithChatReadState(true))
	if err := app.InitializeChatReadState(ctx); err != nil {
		t.Fatal(err)
	}
	adapter, err := New(app, auth)
	if err != nil {
		t.Fatal(err)
	}
	api := httpapi.NewWithRealtime(app, auth, nil, slog.New(slog.NewTextHandler(io.Discard, nil)), adapter.ServeAuthenticatedHTTP)
	var dispatchErrors atomic.Int64
	mux := http.NewServeMux()
	mux.Handle("/api/", api)
	mux.HandleFunc("/__capacity/stats", func(w http.ResponseWriter, r *http.Request) {
		var m runtime.MemStats
		runtime.ReadMemStats(&m)
		adapter.mu.Lock()
		clients := len(adapter.clients)
		adapter.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{"dispatch_errors": dispatchErrors.Load(), "clients": clients, "goroutines": runtime.NumGoroutine(), "heap_alloc": m.HeapAlloc, "heap_inuse": m.HeapInuse, "sys": m.Sys, "gc": m.NumGC})
	})
	server := httptest.NewServer(mux)
	defer server.Close()
	defer func() {
		stop, c := context.WithTimeout(context.Background(), 3*time.Second)
		defer c()
		_ = adapter.Close(stop)
	}()
	config, err := json.Marshal(map[string]any{"url": server.URL, "hot_meeting": meetingID(0), "users": users})
	if err != nil {
		t.Fatal(err)
	}
	if err = os.WriteFile(path, config, 0o600); err != nil {
		t.Fatal(err)
	}
	defer os.Remove(path)
	fmt.Println("CAPACITY_READY")
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
				dispatchErrors.Add(1)
			}
		}
	}
}
