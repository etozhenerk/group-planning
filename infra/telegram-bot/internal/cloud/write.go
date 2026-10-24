package cloud

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"regexp"
	"time"
)

// Write publishes only the bounded metric names and labels owned by the HTTPS probe.
func (c *Client) Write(ctx context.Context, token string, values map[string]float64, now time.Time) error {
	metrics := make([]map[string]any, 0, len(values))
	allowed := regexp.MustCompile(`^somewhere_probe_(success|status_code|duration_seconds|dns_seconds|tcp_seconds|tls_seconds|ttfb_seconds|certificate_days|last_run_timestamp_seconds)$`)
	for name, value := range values {
		if !allowed.MatchString(name) || math.IsNaN(value) || math.IsInf(value, 0) {
			return errors.New("invalid probe metric")
		}

		metrics = append(metrics, map[string]any{"name": name, "type": "DGAUGE", "value": value})
	}

	if len(metrics) == 0 {
		return errors.New("empty probe metrics")
	}

	payload, err := json.Marshal(map[string]any{"ts": now.UTC().Format(time.RFC3339Nano), "labels": map[string]string{"environment": "production", "probe": "api"}, "metrics": metrics})
	if err != nil {
		return err
	}

	var result struct {
		Written json.Number `json:"writtenMetricsCount"`
		Error   string      `json:"errorMessage"`
	}
	endpoint := "https://monitoring.api.cloud.yandex.net/monitoring/v2/data/write?folderId=" + c.FolderID + "&service=custom"
	if err = c.request(ctx, "POST", endpoint, token, payload, 16384, &result, "metrics write"); err != nil {
		return err
	}

	count, err := result.Written.Int64()
	if err != nil || count != int64(len(metrics)) || result.Error != "" {
		return fmt.Errorf("metrics write incomplete")
	}

	return nil
}
