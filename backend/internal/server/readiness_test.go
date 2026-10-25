package server

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"net"
	"net/http"
	"sync/atomic"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestReadinessTracksDependencyWithoutLeakingErrors(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}

	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	var unavailable atomic.Bool
	done := make(chan error, 1)
	go func() {
		done <- ServeWithStorage(ctx, listener, memory.New(), memory.NewIdentity(), func(context.Context) error {
			if unavailable.Load() {
				return errors.New("private database connection and SQL")
			}

			return nil
		}, Config{ShutdownTimeout: time.Second}, slog.New(slog.NewTextHandler(io.Discard, nil)))
	}()
	client := &http.Client{Timeout: time.Second}
	for _, down := range []bool{false, true, false} {
		unavailable.Store(down)
		for _, path := range []string{"/healthz", "/readyz"} {
			response, err := client.Get("http://" + listener.Addr().String() + path)
			if err != nil {
				t.Fatal(err)
			}

			body, err := io.ReadAll(response.Body)
			response.Body.Close()
			if err != nil {
				t.Fatal(err)
			}

			want := 200
			if down && path == "/readyz" {
				want = 503
				if string(body) != "not ready\n" {
					t.Fatal("private error leaked")
				}
			}

			if response.StatusCode != want {
				t.Fatalf("%s status %d want %d", path, response.StatusCode, want)
			}
		}
	}

	cancel()
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}

func TestPostgresConfigRequiresExplicitDSN(t *testing.T) {
	values := map[string]string{"SOMEWHERE_STORAGE": "postgres", "SOMEWHERE_DATABASE_URL": "host=/var/run/postgresql dbname=somewhere user=somewhere"}
	config, err := LoadConfig(func(key string) string { return values[key] })
	if err != nil || config.Storage != "postgres" || config.DatabaseURL != values["SOMEWHERE_DATABASE_URL"] {
		t.Fatal("valid PostgreSQL config rejected", err)
	}

	delete(values, "SOMEWHERE_DATABASE_URL")
	if _, err := LoadConfig(func(key string) string { return values[key] }); err == nil {
		t.Fatal("missing DSN accepted")
	}
}
