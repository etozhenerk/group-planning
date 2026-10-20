// Package yandex implements the public Yandex ID authorization-code protocol.
package yandex

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

// Provider verifies profiles using fixed HTTPS endpoints, with no runtime test bypass.
type Provider struct {
	clientID, clientSecret, callback string
	client                           *http.Client
}

// New configures the real provider. Tests supply an HTTP transport; URLs remain
// fixed so redirects or environment overrides cannot exfiltrate client secrets.
func New(clientID, clientSecret, callback string, transport http.RoundTripper) *Provider {
	if transport == nil {
		transport = http.DefaultTransport
	}

	return &Provider{
		clientID:     clientID,
		clientSecret: clientSecret,
		callback:     callback,
		client: &http.Client{
			Transport:     transport,
			Timeout:       10 * time.Second,
			CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
		},
	}
}

// AuthorizationURL requests only login:info and binds the exact registered callback.
func (p *Provider) AuthorizationURL(state, challenge string) string {
	values := url.Values{
		"response_type":         {"code"},
		"client_id":             {p.clientID},
		"redirect_uri":          {p.callback},
		"scope":                 {"login:info"},
		"state":                 {state},
		"code_challenge":        {challenge},
		"code_challenge_method": {"S256"},
	}

	return "https://oauth.yandex.ru/authorize?" + values.Encode()
}

// Verify exchanges a code and then checks the provider's subject and client ID.
// Provider errors/bodies and access/refresh tokens never leave this adapter.
func (p *Provider) Verify(ctx context.Context, code, verifier string) (identity.Profile, error) {
	values := url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {code},
		"code_verifier": {verifier},
		"redirect_uri":  {p.callback},
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://oauth.yandex.ru/token", strings.NewReader(values.Encode()))
	if err != nil {
		return identity.Profile{}, identity.ErrUnavailable
	}

	request.SetBasicAuth(p.clientID, p.clientSecret)
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	request.Header.Set("Accept", "application/json")
	var token struct {
		AccessToken string `json:"access_token"`
		TokenType   string `json:"token_type"`
	}
	if err := p.json(request, &token); err != nil || token.AccessToken == "" || !strings.EqualFold(token.TokenType, "bearer") {
		return identity.Profile{}, identity.ErrUnavailable
	}

	request, err = http.NewRequestWithContext(ctx, http.MethodGet, "https://login.yandex.ru/info?format=json", nil)
	if err != nil {
		return identity.Profile{}, identity.ErrUnavailable
	}

	request.Header.Set("Authorization", "OAuth "+token.AccessToken)
	request.Header.Set("Accept", "application/json")
	var profile struct {
		ID          string `json:"id"`
		ClientID    string `json:"client_id"`
		DisplayName string `json:"display_name"`
		RealName    string `json:"real_name"`
		Login       string `json:"login"`
	}
	if err := p.json(request, &profile); err != nil || profile.ID == "" || len(profile.ID) > 256 || profile.ClientID != p.clientID {
		return identity.Profile{}, identity.ErrUnavailable
	}

	name := strings.TrimSpace(profile.DisplayName)
	if name == "" {
		name = strings.TrimSpace(profile.RealName)
	}

	if name == "" {
		name = strings.TrimSpace(profile.Login)
	}

	if name == "" || len(name) > 1000 {
		return identity.Profile{}, identity.ErrUnavailable
	}

	return identity.Profile{Subject: profile.ID, DisplayName: name}, nil
}

func (p *Provider) json(request *http.Request, target any) error {
	response, err := p.client.Do(request)
	if err != nil {
		return identity.ErrUnavailable
	}

	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return identity.ErrUnavailable
	}

	data, err := io.ReadAll(io.LimitReader(response.Body, (64<<10)+1))
	if err != nil || len(data) > 64<<10 {
		return identity.ErrUnavailable
	}

	decoder := json.NewDecoder(strings.NewReader(string(data)))
	if err := decoder.Decode(target); err != nil {
		return identity.ErrUnavailable
	}

	if err := decoder.Decode(new(any)); !errors.Is(err, io.EOF) {
		return identity.ErrUnavailable
	}

	return nil
}
