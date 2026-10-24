package cloud

import (
	"context"
	"encoding/json"
	"errors"
	"math"
	"strconv"
	"time"

	"github.com/etozhenerk/group-planning/infra/telegram-bot/internal/notify"
)

// Metrics binds a short-lived IAM token to the monitoring reader.
type Metrics struct {
	Client *Client
	Token  string
}

// History reads a single series, keeping gaps and rejecting ambiguous selections.
func (m Metrics) History(ctx context.Context, query string, from, to time.Time) ([]notify.Point, error) {
	body, err := json.Marshal(map[string]any{"query": query, "fromTime": from.UTC().Format(time.RFC3339), "toTime": to.UTC().Format(time.RFC3339), "downsampling": map[string]string{"gridAggregation": "LAST", "gapFilling": "NULL", "gridInterval": "60000"}})
	if err != nil {
		return nil, errors.New("metric request invalid")
	}

	var data struct {
		Metrics []struct {
			Timeseries struct {
				Timestamps   []int64           `json:"timestamps"`
				DoubleValues []json.RawMessage `json:"doubleValues"`
				IntValues    []json.RawMessage `json:"int64Values"`
			} `json:"timeseries"`
		} `json:"metrics"`
	}
	endpoint := "https://monitoring.api.cloud.yandex.net/monitoring/v2/data/read?folderId=" + m.Client.FolderID
	if err = m.Client.request(ctx, "POST", endpoint, m.Token, body, 256*1024, &data, "monitoring"); err != nil {
		return nil, err
	}

	if len(data.Metrics) == 0 {
		return nil, nil
	}

	if len(data.Metrics) != 1 {
		return nil, errors.New("metric query is ambiguous")
	}

	series := data.Metrics[0].Timeseries
	values := series.DoubleValues
	if len(values) == 0 {
		values = series.IntValues
	}

	if len(series.Timestamps) != len(values) || len(values) > 121 {
		return nil, errors.New("metric series shape invalid")
	}

	points := make([]notify.Point, 0, len(values))
	for index, stamp := range series.Timestamps {
		at := time.UnixMilli(stamp)
		if at.Before(from) || at.After(to) {
			continue
		}

		if len(points) > 0 && !at.After(points[len(points)-1].Time) {
			return nil, errors.New("metric timestamps unordered")
		}

		point := notify.Point{Time: at}
		raw := string(values[index])
		if len(raw) > 0 && raw[0] == '"' {
			if err = json.Unmarshal(values[index], &raw); err != nil {
				return nil, errors.New("metric value invalid")
			}
		}

		switch raw {
		case "null", "NaN", "nan", "Infinity", "-Infinity":
		default:
			value, parseErr := strconv.ParseFloat(raw, 64)
			if parseErr != nil {
				return nil, errors.New("metric value invalid")
			}

			if !math.IsNaN(value) && !math.IsInf(value, 0) {
				point.Value = &value
			}
		}

		points = append(points, point)
	}

	return points, nil
}
