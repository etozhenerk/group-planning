// Package cloud reads credentials and metrics from fixed Yandex Cloud endpoints.
package cloud

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client owns HTTP access for one function invocation; it never logs responses.
type Client struct {
	HTTP         *http.Client
	MetadataHTTP *http.Client
	FolderID     string
}

// NewClient disables redirects and proxies for the metadata service.
func NewClient(folderID string) *Client {
	noRedirect := func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }
	metadataTransport := http.DefaultTransport.(*http.Transport).Clone()
	metadataTransport.Proxy = nil

	return &Client{FolderID: folderID, HTTP: &http.Client{Timeout: 6 * time.Second, CheckRedirect: noRedirect}, MetadataHTTP: &http.Client{Timeout: 3 * time.Second, CheckRedirect: noRedirect, Transport: metadataTransport}}
}

// IAMToken retrieves the short-lived service-account token from metadata.
func (c *Client) IAMToken(ctx context.Context) (string, error) {
	var metadata struct {
		AccessToken string `json:"access_token"`
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token", nil)
	if err != nil {
		return "", errors.New("metadata request invalid")
	}

	req.Header.Set("Metadata-Flavor", "Google")
	if err = readJSON(c.MetadataHTTP, req, 16384, &metadata, "metadata"); err != nil {
		return "", err
	}

	if metadata.AccessToken == "" {
		return "", errors.New("metadata token missing")
	}

	return metadata.AccessToken, nil
}

// Credentials retrieves the current Lockbox token; no cross-invocation caching.
func (c *Client) Credentials(ctx context.Context, secretID string) (string, string, error) {
	iamToken, err := c.IAMToken(ctx)
	if err != nil {
		return "", "", err
	}

	var payload struct {
		Entries []struct {
			Key  string `json:"key"`
			Text string `json:"textValue"`
		} `json:"entries"`
	}
	endpoint := "https://payload.lockbox.api.cloud.yandex.net/lockbox/v1/secrets/" + secretID + "/payload"
	if err = c.request(ctx, http.MethodGet, endpoint, iamToken, nil, 16384, &payload, "lockbox"); err != nil {
		return "", "", err
	}

	token := ""
	for _, entry := range payload.Entries {
		if entry.Key == "telegram-token" {
			if token != "" {
				return "", "", errors.New("duplicate token entry")
			}

			token = entry.Text
		}
	}

	if token == "" {
		return "", "", errors.New("telegram token missing")
	}

	return iamToken, token, nil
}

func (c *Client) request(ctx context.Context, method, endpoint, token string, payload []byte, limit int64, destination any, service string) error {
	req, err := http.NewRequestWithContext(ctx, method, endpoint, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("%s request invalid", service)
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	return readJSON(c.HTTP, req, limit, destination, service)
}

func readJSON(client *http.Client, req *http.Request, limit int64, destination any, service string) error {
	response, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("%s transport failed", service)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("%s HTTP %d", service, response.StatusCode)
	}

	data, err := io.ReadAll(io.LimitReader(response.Body, limit+1))
	if err != nil || int64(len(data)) > limit {
		return fmt.Errorf("%s response unavailable or too large", service)
	}

	if err = json.Unmarshal(data, destination); err != nil {
		return fmt.Errorf("%s response invalid", service)
	}

	return nil
}
