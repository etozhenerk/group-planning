package server

import (
	"bytes"
	"context"
	"io"
	"log/slog"
	"net"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestServerProcessesOverdueJobsWithoutRequests(t *testing.T) {
	now := time.Now().UTC()
	store := memory.New()
	app := meetings.NewService(store, func() time.Time { return now.Add(-72 * time.Hour) })
	owner := meetings.Actor{ID: "f797282a-5dda-4823-92a2-6ad682f6103f", Name: "Test"}
	created, err := app.Create(t.Context(), owner, meetings.CreateInput{Title: "Private title", StartsAt: now.Add(-48 * time.Hour).Format(time.RFC3339), Timezone: "UTC"}, "f6597c00-0000-4000-8000-000000000001")
	if err != nil {
		t.Fatal(err)
	}

	if created.Details.Meeting.Status != meetings.Upcoming {
		t.Fatal("fixture must start upcoming")
	}

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}

	ctx, cancel := context.WithCancel(t.Context())
	finished := make(chan error, 1)
	go func() {
		finished <- Serve(ctx, listener, store, Config{ShutdownTimeout: time.Second}, slog.New(slog.NewTextHandler(io.Discard, nil)))
	}()
	defer func() {
		cancel()
		select {
		case err := <-finished:
			if err != nil {
				t.Error(err)
			}
		case <-time.After(2 * time.Second):
			t.Error("worker shutdown hung")
		}
	}()
	deadline := time.Now().Add(2 * time.Second)
	for {
		var status meetings.Period
		err := store.View(t.Context(), func(r meetings.Reader) error {
			m, err := r.Meeting(created.Details.Meeting.ID)
			status = m.Status

			return err
		})
		if err != nil {
			t.Fatal(err)
		}

		if status == meetings.Past {
			break
		}

		if time.Now().After(deadline) {
			t.Fatal("server never processed job without a request")
		}

		time.Sleep(5 * time.Millisecond)
	}
}

func TestTransitionConfigurationAndSafeLog(t *testing.T) {
	for _, name := range []string{"SOMEWHERE_TRANSITION_POLL_INTERVAL", "SOMEWHERE_TRANSITION_LEASE", "SOMEWHERE_TRANSITION_RETRY_BASE", "SOMEWHERE_TRANSITION_RECONCILE_INTERVAL", "SOMEWHERE_TRANSITION_RECONCILE_STALE", "SOMEWHERE_TRANSITION_MAX_ATTEMPTS", "SOMEWHERE_TRANSITION_BATCH_SIZE"} {
		_, err := loadTransitionOptions(func(key string) string {
			if key == name {
				return "0"
			}

			return ""
		})
		if err == nil {
			t.Fatalf("accepted %s", name)
		}
	}

	_, err := loadTransitionOptions(func(key string) string {
		if key == "SOMEWHERE_TRANSITION_MAX_ATTEMPTS" {
			return "secret-invalid"
		}

		return ""
	})
	if err == nil || strings.Contains(err.Error(), "secret-invalid") {
		t.Fatal("invalid config value leaked")
	}

	config, err := loadTransitionOptions(func(key string) string {
		if key == "SOMEWHERE_TRANSITION_POLL_INTERVAL" {
			return "2s"
		}

		return ""
	})
	if err != nil || config.PollInterval != 2*time.Second {
		t.Fatal("configured polling ignored")
	}

	var output bytes.Buffer
	observe := transitionLogger(slog.New(slog.NewJSONHandler(&output, nil)))
	observe(meetings.TransitionObservation{Event: "transition_health", Health: meetings.TransitionHealth{FailedAlarm: true, Queue: meetings.TransitionStats{Failed: 1}}})
	if !strings.Contains(output.String(), `"level":"ERROR"`) || !strings.Contains(output.String(), `"failed_alarm":true`) {
		t.Fatal("operator signal missing")
	}

	output.Reset()
	observe(meetings.TransitionObservation{Event: "transition_attempt_failed", ErrorCode: "storage_error", Job: meetings.TransitionJob{ID: "job", MeetingID: "meeting", LeaseToken: "SECRET", ErrorCode: "SECRET"}})
	if strings.Contains(output.String(), "SECRET") || !strings.Contains(output.String(), "storage_error") {
		t.Fatal("raw job details logged")
	}
}
