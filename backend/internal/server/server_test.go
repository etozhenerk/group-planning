package server

import (
	"bytes"
	"context"
	"errors"
	"io"
	"log/slog"
	"net"
	"net/http"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestConfig(t *testing.T) {
	config, err := LoadConfig(func(string) string { return "" })
	if err != nil || config.Address != "127.0.0.1:8080" || config.ShutdownTimeout != 5*time.Second {
		t.Fatalf("defaults: %+v %v", config, err)
	}
	for key, value := range map[string]string{"SOMEWHERE_STORAGE": "postgres", "SOMEWHERE_HTTP_ADDR": ":8080", "SOMEWHERE_SHUTDOWN_TIMEOUT": "0s"} {
		if _, err := LoadConfig(func(name string) string {
			if name == key {
				return value
			}
			return ""
		}); err == nil {
			t.Fatalf("accepted %s", key)
		}
	}
}

func TestServeStartsStopsAndResetsMemory(t *testing.T) {
	const token = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	client := &http.Client{Timeout: time.Second}
	for run := 0; run < 2; run++ {
		store := memory.New()
		if run == 0 {
			if err := store.Update(context.Background(), func(writer meetings.Writer) error {
				if err := writer.SaveMeeting(meetings.Meeting{ID: "5cf76452-b7fa-4a5b-b785-1582b58b1d75", Title: "Встреча", Timezone: "Europe/Moscow"}); err != nil {
					return err
				}
				return writer.InsertInvitation(meetings.Invitation{ID: "invite", MeetingID: "5cf76452-b7fa-4a5b-b785-1582b58b1d75", Token: token})
			}); err != nil {
				t.Fatal(err)
			}
		}
		listener, err := net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			t.Fatal(err)
		}
		ctx, cancel := context.WithCancel(context.Background())
		finished := make(chan error, 1)
		go func() { finished <- Serve(ctx, listener, store, Config{ShutdownTimeout: time.Second}, logger) }()
		t.Cleanup(cancel)
		url := "http://" + listener.Addr().String()
		response, err := client.Get(url + "/healthz")
		if err != nil {
			cancel()
			t.Fatal(err)
		}
		body, err := io.ReadAll(response.Body)
		response.Body.Close()
		if err != nil || response.StatusCode != 200 || !bytes.Contains(body, []byte(`"ok"`)) {
			t.Fatal("server not healthy")
		}
		response, err = client.Get(url + "/api/v1/invitations/" + token)
		if err != nil {
			cancel()
			t.Fatal(err)
		}
		response.Body.Close()
		expected := 200
		if run == 1 {
			expected = 404
		}
		if response.StatusCode != expected {
			t.Fatalf("restart: status %d", response.StatusCode)
		}
		cancel()
		select {
		case err := <-finished:
			if err != nil {
				t.Fatal(err)
			}
		case <-time.After(2 * time.Second):
			t.Fatal("shutdown hung")
		}
		if connection, err := net.DialTimeout("tcp", listener.Addr().String(), 100*time.Millisecond); err == nil {
			connection.Close()
			t.Fatal("listener still open")
		}
	}
}

func TestCanceledServerClosesListener(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if err := Serve(ctx, listener, memory.New(), Config{ShutdownTimeout: time.Second}, slog.New(slog.NewTextHandler(io.Discard, nil))); err != nil {
		t.Fatal(err)
	}
	if _, err := listener.Accept(); !errors.Is(err, net.ErrClosed) {
		t.Fatalf("listener not closed: %v", err)
	}
}

type waitingStore struct {
	meetings.Store
	entered chan struct{}
	release chan struct{}
}

func (store waitingStore) View(ctx context.Context, callback func(meetings.Reader) error) error {
	close(store.entered)
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-store.release:
		return store.Store.View(ctx, callback)
	}
}

func TestShutdownDrainsActiveRequest(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	store := waitingStore{Store: memory.New(), entered: make(chan struct{}), release: make(chan struct{})}
	finished := make(chan error, 1)
	go func() {
		finished <- Serve(ctx, listener, store, Config{ShutdownTimeout: time.Second}, slog.New(slog.NewTextHandler(io.Discard, nil)))
	}()
	responseDone := make(chan error, 1)
	go func() {
		client := &http.Client{Timeout: 2 * time.Second}
		response, err := client.Get("http://" + listener.Addr().String() + "/api/v1/invitations/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
		if err == nil {
			response.Body.Close()
			if response.StatusCode != 404 {
				err = errors.New("unexpected response")
			}
		}
		responseDone <- err
	}()
	select {
	case <-store.entered:
	case <-time.After(time.Second):
		t.Fatal("request did not start")
	}
	cancel()
	select {
	case err := <-finished:
		t.Fatalf("did not drain: %v", err)
	case <-time.After(20 * time.Millisecond):
	}
	close(store.release)
	select {
	case err := <-responseDone:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("request did not finish")
	}
	select {
	case err := <-finished:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("server did not stop")
	}
}
