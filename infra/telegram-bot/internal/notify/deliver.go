package notify

import (
	"context"
	"fmt"
	"math"
	"time"
	"unicode/utf16"
)

// Point preserves a missing sample as nil, rather than a zero reading.
type Point struct {
	Time  time.Time
	Value *float64
}

// Reader retrieves one bounded, trusted time series.
type (
	Reader interface {
		History(context.Context, string, time.Time, time.Time) ([]Point, error)
	}
	// Renderer draws a graph from validated historical samples.
	Renderer interface {
		Render(Alert, []Point, time.Time) ([]byte, error)
	}
	// Sender delivers to its configured chat, with a bounded retry policy.
	Sender interface {
		Send(context.Context, string, string, []byte) error
	}
)

// Result exposes safe operational outcome fields to function logs.
type Result struct {
	Delivery string `json:"delivery"`
	Graph    string `json:"graph"`
}

// Deliver preserves the alert's status; recent readings do not recalculate it.
func Deliver(ctx context.Context, alert Alert, reader Reader, renderer Renderer, sender Sender, now time.Time) (Result, error) {
	historyCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
	points, readErr := reader.History(historyCtx, alert.Rule.Query, now.Add(-time.Hour), now)
	cancel()
	result := Result{Delivery: "text", Graph: "available"}
	var png []byte
	var latest *Point
	for i := range points {
		p := &points[i]
		if p.Value != nil && !math.IsNaN(*p.Value) && !math.IsInf(*p.Value, 0) && !p.Time.After(now) && (latest == nil || p.Time.After(latest.Time)) {
			latest = p
		}
	}

	reason := ""
	switch {
	case readErr != nil:
		reason = "История метрики недоступна."
		result.Graph = "read_failed"
	case latest == nil:
		reason = "В истории нет измерений."
		result.Graph = "no_data"
	default:
		var err error
		png, err = renderer.Render(alert, points, now)
		if err != nil || len(png) == 0 || len(png) > 1024*1024 {
			png = nil
			reason = "Не удалось построить график."
			result.Graph = "render_failed"
		}
	}

	if latest != nil && now.Sub(latest.Time) > 3*time.Minute {
		reason += " Последнее измерение устарело (>3 мин)."
		if result.Graph == "available" {
			result.Graph = "stale"
		}
	}

	reading := "нет данных"
	if latest != nil && readErr == nil {
		reading = fmt.Sprintf("%.3g %s (%s UTC)", *latest.Value, alert.Rule.Unit, latest.Time.UTC().Format("15:04:05"))
	}

	caption := fmt.Sprintf("somewhere · %s · %s\n%s / %s\nПоследнее: %s\nWarning %s %g; Alarm %s %g %s · окно %d мин\nПолучено: %s UTC\nАлерт: %s\n%s\n%s",
		alert.Status, alert.Rule.Title, alert.Environment, alert.InstanceID, reading,
		alert.Rule.Comparison, alert.Rule.Warning, alert.Rule.Comparison, alert.Rule.Alarm, alert.Rule.Unit, alert.Rule.WindowMinutes,
		now.UTC().Format("2006-01-02 15:04:05"), alert.Rule.ID, alert.Rule.Action, reason)
	caption = truncate(caption, 900)
	if len(png) > 0 {
		result.Delivery = "photo"
	}

	if err := sender.Send(ctx, caption, alert.DashboardURL, png); err != nil {
		return Result{}, err
	}

	return result, nil
}

func truncate(value string, limit int) string {
	units := 0
	out := []rune{}
	for _, r := range value {
		width := utf16.RuneLen(r)
		if units+width > limit-1 {
			return string(out) + "…"
		}

		out = append(out, r)
		units += width
	}

	return value
}
