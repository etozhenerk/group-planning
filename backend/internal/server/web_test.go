package server

import (
	"context"
	"io"
	"log/slog"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestWebWorksWithoutOAuth(t *testing.T) {
	directory := t.TempDir()
	if err := os.WriteFile(filepath.Join(directory, "index.html"), []byte("<!doctype html><head><title>Somewhere</title></head><body>Somewhere</body>"), 0o600); err != nil {
		t.Fatal(err)
	}

	settings := map[string]string{"SOMEWHERE_WEB_DIST": directory, "SOMEWHERE_WEB_ORIGIN": "https://somewhere.example"}
	config, err := LoadConfig(func(key string) string { return settings[key] })
	if err != nil || config.Auth.Enabled {
		t.Fatal("web requires OAuth", err)
	}

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	finished := make(chan error, 1)
	go func() {
		finished <- Serve(ctx, listener, memory.New(), config, slog.New(slog.NewTextHandler(io.Discard, nil)))
	}()
	client := &http.Client{Timeout: time.Second}
	for address, status := range map[string]int{"/": 200, "/healthz": 200, "/api/v1/me": 401, "/i/invalid": 404} {
		response, err := client.Get("http://" + listener.Addr().String() + address)
		if err != nil {
			t.Fatal(err)
		}

		body, err := io.ReadAll(response.Body)
		response.Body.Close()
		if err != nil || response.StatusCode != status {
			t.Fatalf("%s: %d %v", address, response.StatusCode, err)
		}

		if address == "/" && !strings.Contains(string(body), "Somewhere") {
			t.Fatal("client shell missing")
		}
	}

	cancel()
	select {
	case err := <-finished:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("server did not stop")
	}
}
