package meetings_test

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type (
	workerFaultStore struct {
		meetings.Store
		failWrite, failScan atomic.Bool
	}
	workerFaultWriter struct {
		meetings.Writer
		fail bool
	}
)

func (w workerFaultWriter) SaveMeeting(m meetings.Meeting) error {
	if w.fail {
		return errors.New("private-provider-error: SECRET")
	}

	return w.Writer.SaveMeeting(m)
}

type workerFaultReader struct {
	meetings.Reader
	fail bool
}

func (r workerFaultReader) OverdueMeetings(after string, now time.Time, limit int) ([]meetings.Meeting, error) {
	if r.fail {
		return nil, errors.New("private-scan: SECRET")
	}

	return r.Reader.OverdueMeetings(after, now, limit)
}

func (s *workerFaultStore) Update(ctx context.Context, fn func(meetings.Writer) error) error {
	return s.Store.Update(ctx, func(w meetings.Writer) error { return fn(workerFaultWriter{w, s.failWrite.Load()}) })
}

func (s *workerFaultStore) View(ctx context.Context, fn func(meetings.Reader) error) error {
	return s.Store.View(ctx, func(r meetings.Reader) error { return fn(workerFaultReader{r, s.failScan.Load()}) })
}

func TestWorkerRetriesAlertsAndSafeDiagnostics(t *testing.T) {
	f := setup(t)
	f.clock.Store(currentMeeting(t, f).PastAt.Unix())
	broken := &workerFaultStore{Store: f.store}
	broken.failWrite.Store(true)
	app := meetings.NewService(broken, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	options := meetings.DefaultTransitionOptions()
	options.MaxAttempts = 2
	options.DelayThreshold = time.Second
	events := []meetings.TransitionObservation{}
	worker, err := meetings.NewTransitionWorker(app, options, func(event meetings.TransitionObservation) { events = append(events, event) })
	must(t, err)
	worker.Tick(ctx)
	before := currentJob(t, f, 1)
	worker.Tick(ctx)
	if currentJob(t, f, 1) != before || before.Attempts != 1 || before.State != meetings.TransitionPending {
		t.Fatal("retry ran before backoff")
	}

	f.clock.Add(5)
	worker.Tick(ctx)
	if !worker.Health().FailedAlarm || !worker.Health().DelayAlarm || currentJob(t, f, 1).State != meetings.TransitionFailed {
		t.Fatalf("missing operator alarm: %+v", worker.Health())
	}

	f.clock.Add(60)
	worker.Tick(ctx)
	if currentJob(t, f, 1).Attempts != 2 {
		t.Fatal("reconciliation reset failed attempt")
	}

	data, err := json.Marshal(events)
	must(t, err)
	for _, private := range []string{"SECRET", f.created.InvitationToken, "Настолки", "Принести игры"} {
		if strings.Contains(string(data), private) {
			t.Fatal("private diagnostic leaked")
		}
	}

	if !strings.Contains(string(data), "storage_error") {
		t.Fatal("missing safe failure code")
	}

	broken.failWrite.Store(false)
	must(t, app.RetryFailedTransition(ctx, f.created.Details.Meeting.ID, 1))
	worker.Tick(ctx)
	if currentMeeting(t, f).Status != meetings.Past || worker.Health().FailedAlarm {
		t.Fatal("controlled retry failed")
	}

	final := currentJob(t, f, 1)
	if final.TotalAttempts != 3 || final.LastFailureCode != "storage_error" || final.LastFailedAt.IsZero() {
		t.Fatal("manual retry erased history")
	}
}

func TestWorkerRestartAndReconciliationFailureRecovery(t *testing.T) {
	f := missingJobFixture(t)
	broken := &workerFaultStore{Store: f.store}
	broken.failScan.Store(true)
	app := meetings.NewService(broken, func() time.Time { return time.Unix(f.clock.Load(), 0) })
	options := meetings.DefaultTransitionOptions()
	worker, err := meetings.NewTransitionWorker(app, options, nil)
	must(t, err)
	worker.Tick(ctx)
	if !worker.Health().ReconcileAlarm || worker.Health().ReconcileErrors != 1 || !worker.Health().LastReconcileSuccess.IsZero() {
		t.Fatal("scan failure was hidden")
	}

	broken.failScan.Store(false)
	f.clock.Add(60)
	worker.Tick(ctx)
	if currentMeeting(t, f).Status != meetings.Past || worker.Health().LastReconcileSuccess.IsZero() || worker.Health().ReconcileAlarm {
		t.Fatal("scan did not recover")
	}

	revision := currentMeeting(t, f).Revision
	restarted, err := meetings.NewTransitionWorker(app, options, nil)
	must(t, err)
	restarted.Tick(ctx)
	if currentMeeting(t, f).Revision != revision {
		t.Fatal("worker restart duplicated transition")
	}

	// A previously successful sweep becoming stale also raises an alarm.
	broken.failScan.Store(true)
	f.clock.Add(301)
	restarted.Tick(ctx)
	if !restarted.Health().ReconcileAlarm {
		t.Fatal("stale successful sweep not detected")
	}
}

func TestWorkerCancellationAndOptions(t *testing.T) {
	f := setup(t)
	options := meetings.DefaultTransitionOptions()
	worker, err := meetings.NewTransitionWorker(f.app, options, nil)
	must(t, err)
	cancelled, cancel := context.WithCancel(ctx)
	cancel()
	done := make(chan struct{})
	go func() { worker.Run(cancelled); close(done) }()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("worker did not stop")
	}

	for _, mutate := range []func(*meetings.TransitionOptions){func(o *meetings.TransitionOptions) { o.MaxAttempts = 0 }, func(o *meetings.TransitionOptions) { o.BatchSize = 0 }, func(o *meetings.TransitionOptions) { o.Lease = 0 }, func(o *meetings.TransitionOptions) { o.RetryBase = o.RetryMax + 1 }, func(o *meetings.TransitionOptions) { o.ReconcileStale = 0 }} {
		bad := options
		mutate(&bad)
		if _, err := meetings.NewTransitionWorker(f.app, bad, nil); err == nil {
			t.Fatal("invalid worker config accepted")
		}
	}
}
