package notify

import (
	"context"
	"errors"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"
	"unicode/utf16"
)

func config() Config {
	return Config{FolderID: "folder", InstanceID: "host", Environment: "production", ChatID: "123", SecretID: "secret", Dashboards: map[string]string{"vm": "vm", "postgres": "pg"}}
}

func TestResolveRejectsUntrustedEvents(t *testing.T) {
	catalog, err := NewCatalog(config())
	if err != nil {
		t.Fatal(err)
	}

	good := Event{AlertID: "folder__folder_somewhere-cpu", Status: "Alarm"}
	for _, status := range []string{"ALARM", "OK", "Warning", "No data", "NO_DATA", "NODATA", "ERROR"} {
		event := good
		event.Status = status
		if _, err = catalog.Resolve(event); err != nil {
			t.Fatalf("%s: %v", status, err)
		}
	}

	for _, event := range []Event{
		{AlertID: "injected", Status: "OK"},
		{AlertID: good.AlertID, Status: "ignored"},
		{AlertID: good.AlertID, Status: "OK", FolderID: "other"},
		{AlertID: good.AlertID, Status: "OK", Labels: map[string]string{"host": "other"}},
		{AlertID: good.AlertID, Status: "OK", Labels: map[string]string{"environment": "development"}},
	} {
		if _, err = catalog.Resolve(event); err == nil {
			t.Fatalf("accepted invalid event: %+v", event)
		}
	}

	bad := config()
	bad.InstanceID = `host",service="*`
	if _, err = NewCatalog(bad); err == nil {
		t.Fatal("accepted query injection")
	}

	alert, err := catalog.Resolve(good)
	if err != nil {
		t.Fatal(err)
	}

	if strings.Contains(alert.Rule.Query, "__") || !strings.Contains(alert.Rule.Query, `host="host"`) {
		t.Fatal("unbound query")
	}
}

type readerStub struct {
	points []Point
	err    error
}

func (r readerStub) History(_ context.Context, _ string, _, _ time.Time) ([]Point, error) {
	return r.points, r.err
}

type rendererStub struct {
	data []byte
	err  error
}

func (r rendererStub) Render(_ Alert, _ []Point, _ time.Time) ([]byte, error) { return r.data, r.err }

type senderStub struct {
	caption string
	photo   []byte
	err     error
}

func (s *senderStub) Send(_ context.Context, text, _ string, png []byte) error {
	s.caption = text
	s.photo = png

	return s.err
}

func TestDeliveryFallbackAndStaleness(t *testing.T) {
	now := time.Date(2026, 10, 25, 0, 0, 0, 0, time.UTC)
	value := 94.0
	catalog, _ := NewCatalog(config())
	alert, _ := catalog.Resolve(Event{AlertID: "folder__folder_somewhere-cpu", Status: "OK"})
	for _, test := range []struct {
		name           string
		reader         readerStub
		renderer       rendererStub
		graph, caption string
		photo          bool
	}{
		{"photo", readerStub{points: []Point{{Time: now.Add(-time.Minute), Value: &value}}}, rendererStub{data: []byte("png")}, "available", "OK", true},
		{"missing", readerStub{}, rendererStub{}, "no_data", "нет измерений", false},
		{"null", readerStub{points: []Point{{Time: now}}}, rendererStub{}, "no_data", "нет измерений", false},
		{"denied", readerStub{err: errors.New("SECRET")}, rendererStub{}, "read_failed", "недоступна", false},
		{"render", readerStub{points: []Point{{Time: now, Value: &value}}}, rendererStub{err: errors.New("SECRET")}, "render_failed", "построить график", false},
		{"stale", readerStub{points: []Point{{Time: now.Add(-10 * time.Minute), Value: &value}}}, rendererStub{data: []byte("png")}, "stale", "устарело", true},
	} {
		t.Run(test.name, func(t *testing.T) {
			sender := &senderStub{}
			result, err := Deliver(context.Background(), alert, test.reader, test.renderer, sender, now)
			if err != nil || result.Graph != test.graph || (len(sender.photo) > 0) != test.photo {
				t.Fatalf("result=%+v err=%v", result, err)
			}

			if !strings.Contains(sender.caption, test.caption) || strings.Contains(sender.caption, "SECRET") || len(utf16.Encode([]rune(sender.caption))) > 900 {
				t.Fatalf("unsafe or incorrect caption: %s", sender.caption)
			}
		})
	}
}

type countingSender struct{ count atomic.Int32 }

func (s *countingSender) Send(_ context.Context, _, _ string, _ []byte) error {
	s.count.Add(1)
	return nil
}

func TestTwentyConcurrentEventsAndDuplicateSemantics(t *testing.T) {
	catalog, _ := NewCatalog(config())
	alert, _ := catalog.Resolve(Event{AlertID: "folder__folder_somewhere-cpu", Status: "NO_DATA"})
	sender := &countingSender{}
	var group sync.WaitGroup
	for i := 0; i < 20; i++ {
		group.Add(1)
		go func() {
			defer group.Done()
			if _, err := Deliver(context.Background(), alert, readerStub{}, rendererStub{}, sender, time.Now()); err != nil {
				t.Error(err)
			}
		}()
	}

	group.Wait()
	if sender.count.Load() != 20 {
		t.Fatal("an event was dropped or duplicated internally")
	}
}

func TestCaptionBoundUsesUTF16(t *testing.T) {
	if len(utf16.Encode([]rune(truncate(strings.Repeat("🚨", 1000), 900)))) > 900 {
		t.Fatal("caption limit exceeded")
	}
}
