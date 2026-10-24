package chart

import (
	"bytes"
	"image/png"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/infra/telegram-bot/internal/notify"
)

func TestPNGDimensionsAndGap(t *testing.T) {
	now := time.Date(2026, 10, 25, 0, 0, 0, 0, time.UTC)
	value := 40.0
	alert := notify.Alert{Status: "ALARM", Rule: notify.Rule{Title: "Память", Unit: "%", Warning: 80, Alarm: 90}}
	points := []notify.Point{{Time: now.Add(-31 * time.Minute), Value: &value}, {Time: now.Add(-30 * time.Minute)}, {Time: now.Add(-29 * time.Minute), Value: &value}}
	data, err := (Renderer{}).Render(alert, points, now)
	if err != nil {
		t.Fatal(err)
	}

	image, err := png.Decode(bytes.NewReader(data))
	if err != nil {
		t.Fatal(err)
	}

	if image.Bounds().Dx() != 1200 || image.Bounds().Dy() != 700 || len(data) > 1024*1024 {
		t.Fatal("invalid PNG bounds")
	}

	// No blue series pixels in the minute containing the null sample.
	for x := 619; x < 625; x++ {
		for y := 140; y < 535; y++ {
			r, g, b, _ := image.At(x, y).RGBA()
			if r>>8 == 36 && g>>8 == 99 && b>>8 == 235 {
				t.Fatal("line bridged a null sample")
			}
		}
	}

	if _, err = (Renderer{}).Render(alert, []notify.Point{{Time: now}}, now); err == nil {
		t.Fatal("rendered missing data as success")
	}
}
