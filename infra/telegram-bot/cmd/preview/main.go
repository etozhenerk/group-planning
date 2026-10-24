// Command preview creates a synthetic graph without credentials or network calls.
package main

import (
	"flag"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"time"

	"github.com/etozhenerk/group-planning/infra/telegram-bot/internal/chart"
	"github.com/etozhenerk/group-planning/infra/telegram-bot/internal/notify"
)

func main() {
	output := flag.String("output", "build/preview.png", "PNG output file")
	flag.Parse()
	if err := run(*output); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(output string) error {
	now := time.Date(2026, 10, 25, 0, 0, 0, 0, time.UTC)
	alert := notify.Alert{Status: "ALARM", InstanceID: "demo-vm", Environment: "DEMO", Rule: notify.Rule{Title: "CPU (тестовые данные)", Unit: "%", Warning: 70, Alarm: 90, Comparison: ">", WindowMinutes: 10}}
	points := make([]notify.Point, 61)
	for i := range points {
		value := 35 + 8*math.Sin(float64(i)/3)
		if i > 38 {
			value = 94 + 3*math.Sin(float64(i))
		}

		points[i] = notify.Point{Time: now.Add(time.Duration(i-60) * time.Minute), Value: &value}
		if i > 23 && i < 30 {
			points[i].Value = nil
		}
	}

	data, err := (chart.Renderer{}).Render(alert, points, now)
	if err != nil {
		return err
	}

	if err = os.MkdirAll(filepath.Dir(output), 0o700); err != nil {
		return err
	}

	return os.WriteFile(output, data, 0o600)
}
