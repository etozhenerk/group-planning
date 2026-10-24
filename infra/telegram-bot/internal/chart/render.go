// Package chart renders private metric history without a browser or image service.
package chart

import (
	"bytes"
	"errors"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"math"
	"time"

	"github.com/etozhenerk/group-planning/infra/telegram-bot/internal/notify"
	"golang.org/x/image/font"
	"golang.org/x/image/font/gofont/goregular"
	"golang.org/x/image/font/opentype"
	"golang.org/x/image/math/fixed"
)

// Renderer draws a bounded series with thresholds and explicit time gaps.
type Renderer struct{}

// Render produces a 1200×700 PNG. It never interpolates missing samples.
func (Renderer) Render(alert notify.Alert, points []notify.Point, now time.Time) ([]byte, error) {
	if len(points) == 0 || len(points) > 121 {
		return nil, errors.New("chart sample count invalid")
	}

	parsed, err := opentype.Parse(goregular.TTF)
	if err != nil {
		return nil, errors.New("chart font unavailable")
	}

	face, err := opentype.NewFace(parsed, &opentype.FaceOptions{Size: 20, DPI: 72, Hinting: font.HintingFull})
	if err != nil {
		return nil, errors.New("chart font invalid")
	}
	defer face.Close()
	canvas := image.NewRGBA(image.Rect(0, 0, 1200, 700))
	draw.Draw(canvas, canvas.Bounds(), image.NewUniform(color.RGBA{248, 250, 252, 255}), image.Point{}, draw.Src)
	ink := color.RGBA{30, 41, 59, 255}
	label := func(x, y int, text string, tint color.Color) {
		for font.MeasureString(face, text).Ceil() > 1160-x && len([]rune(text)) > 0 {
			r := []rune(text)
			text = string(r[:len(r)-1])
		}

		drawer := font.Drawer{Dst: canvas, Src: image.NewUniform(tint), Face: face, Dot: fixed.P(x, y)}
		drawer.DrawString(text)
	}
	label(48, 42, "somewhere · "+alert.Status+" · "+alert.Rule.Title, ink)
	label(48, 74, alert.Environment+" / "+alert.InstanceID+" · "+alert.Rule.Unit, ink)
	from := now.Add(-time.Hour)
	label(48, 105, from.UTC().Format("2006-01-02 15:04")+" — "+now.UTC().Format("2006-01-02 15:04")+" UTC", ink)
	low, high := math.Min(0, math.Min(alert.Rule.Warning, alert.Rule.Alarm)), math.Max(alert.Rule.Warning, alert.Rule.Alarm)
	count := 0
	for _, p := range points {
		if valid(p, from, now) {
			low = math.Min(low, *p.Value)
			high = math.Max(high, *p.Value)
			count++
		}
	}

	if count == 0 {
		return nil, errors.New("chart has no samples")
	}

	if high == low {
		high = low + 1
	}

	high += (high - low) * 0.1
	const left, right, top, bottom = 110, 1135, 140, 535
	x := func(at time.Time) int { return left + int(at.Sub(from).Seconds()/3600*float64(right-left)) }
	y := func(value float64) int { return bottom - int((value-low)/(high-low)*float64(bottom-top)) }
	grid := color.RGBA{210, 219, 229, 255}
	for i := 0; i <= 5; i++ {
		level := low + (high-low)*float64(i)/5
		line(canvas, left, y(level), right, y(level), grid)
		label(12, y(level)+7, fmt.Sprintf("%.3g", level), ink)
	}

	for i := 0; i <= 4; i++ {
		at := from.Add(time.Duration(i) * 15 * time.Minute)
		label(min(x(at)-25, 1080), 570, at.UTC().Format("15:04"), ink)
	}

	warning, alarm, series := color.RGBA{190, 114, 0, 255}, color.RGBA{210, 45, 60, 255}, color.RGBA{36, 99, 235, 255}
	for _, threshold := range []struct {
		value float64
		tint  color.Color
	}{{alert.Rule.Warning, warning}, {alert.Rule.Alarm, alarm}} {
		for start := left; start < right; start += 16 {
			line(canvas, start, y(threshold.value), min(start+9, right), y(threshold.value), threshold.tint)
		}
	}

	var previous *notify.Point
	for index := range points {
		point := &points[index]
		if !valid(*point, from, now) {
			previous = nil
			continue
		}

		if previous != nil && point.Time.Sub(previous.Time) > 0 && point.Time.Sub(previous.Time) <= 90*time.Second {
			line(canvas, x(previous.Time), y(*previous.Value), x(point.Time), y(*point.Value), series)
		}

		draw.Draw(canvas, image.Rect(x(point.Time)-2, y(*point.Value)-2, x(point.Time)+3, y(*point.Value)+3), image.NewUniform(series), image.Point{}, draw.Src)
		previous = point
	}

	label(48, 610, fmt.Sprintf("Warning %s %g %s", alert.Rule.Comparison, alert.Rule.Warning, alert.Rule.Unit), warning)
	label(550, 610, fmt.Sprintf("Alarm %s %g %s", alert.Rule.Comparison, alert.Rule.Alarm, alert.Rule.Unit), alarm)
	label(48, 648, fmt.Sprintf("Шаг 60 с · окно алерта %d мин · пропуски не равны нулю", alert.Rule.WindowMinutes), ink)
	label(48, 680, "История измерений; статус получен от Monium. Это не скриншот панели.", ink)
	var output bytes.Buffer
	if err = png.Encode(&output, canvas); err != nil {
		return nil, errors.New("chart encoding failed")
	}

	if output.Len() > 1024*1024 {
		return nil, errors.New("chart exceeds size limit")
	}

	return output.Bytes(), nil
}

func valid(p notify.Point, from, to time.Time) bool {
	return p.Value != nil && !math.IsNaN(*p.Value) && !math.IsInf(*p.Value, 0) && math.Abs(*p.Value) < 1e15 && !p.Time.Before(from) && !p.Time.After(to)
}

func line(canvas *image.RGBA, x0, y0, x1, y1 int, tint color.Color) {
	dx, dy := abs(x1-x0), -abs(y1-y0)
	sx, sy := -1, -1
	if x0 < x1 {
		sx = 1
	}

	if y0 < y1 {
		sy = 1
	}

	delta := dx + dy
	for {
		canvas.Set(x0, y0, tint)
		if x0 == x1 && y0 == y1 {
			return
		}

		twice := 2 * delta
		if twice >= dy {
			delta += dy
			x0 += sx
		}

		if twice <= dx {
			delta += dx
			y0 += sy
		}
	}
}

func abs(value int) int {
	if value < 0 {
		return -value
	}

	return value
}
