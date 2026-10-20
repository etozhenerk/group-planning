package identity

import (
	"context"
	"errors"
	"net/url"
	"time"
)

// Config contains trusted deployment URLs and the absolute session lifetime.
type Config struct {
	PublicOrigin    string
	NativeCallbacks map[string]string
	SessionTTL      time.Duration
}

// Service owns authentication rules; it cannot change meetings or RSVP.
type Service struct {
	config           Config
	store            Store
	provider         Provider
	now              func() time.Time
	invitationExists func(context.Context, string) (bool, error)
}

// New builds a service with an explicit clock, provider and invitation lookup.
func New(config Config, store Store, provider Provider, now func() time.Time, invitationExists func(context.Context, string) (bool, error)) (*Service, error) {
	if err := ValidateConfig(config); err != nil {
		return nil, err
	}

	if store == nil || provider == nil || now == nil || invitationExists == nil {
		return nil, errors.New("missing identity dependency")
	}

	callbacks := make(map[string]string, len(config.NativeCallbacks))
	for kind, value := range config.NativeCallbacks {
		callbacks[kind] = value
	}

	config.NativeCallbacks = callbacks

	return &Service{
		config:           config,
		store:            store,
		provider:         provider,
		now:              now,
		invitationExists: invitationExists,
	}, nil
}

// StartInput identifies a client and a validated return context.
type StartInput struct {
	ClientKind   string
	Context      ReturnContext
	AppChallenge string
}

// Started exposes the authorization URL and a web binding passed only as a cookie.
type Started struct {
	AttemptID, AuthorizationURL, BindingSecret string
	ExpiresAt                                  time.Time
}

// Start creates a single-use attempt without creating a user or RSVP.
func (s *Service) Start(ctx context.Context, input StartInput, origin string) (Started, error) {
	if input.ClientKind != "web" && input.ClientKind != "ios" && input.ClientKind != "android" {
		return Started{}, ValidationError{"client_kind"}
	}

	if input.ClientKind == "web" {
		if origin != s.config.PublicOrigin {
			return Started{}, ErrForbidden
		}

		if input.AppChallenge != "" {
			return Started{}, ValidationError{"app_challenge"}
		}
	} else if s.config.NativeCallbacks[input.ClientKind] == "" {
		return Started{}, ValidationError{"client_kind"}
	} else if !validSecret(input.AppChallenge) {
		return Started{}, ValidationError{"app_challenge"}
	}

	if input.Context.Kind == "home" {
		if input.Context.Token != "" {
			return Started{}, ValidationError{"return_context"}
		}
	} else if input.Context.Kind == "invitation" {
		if !validSecret(input.Context.Token) {
			return Started{}, ValidationError{"return_context"}
		}

		exists, err := s.invitationExists(ctx, input.Context.Token)
		if err != nil {
			return Started{}, err
		}

		if !exists {
			return Started{}, ValidationError{"return_context"}
		}
	} else {
		return Started{}, ValidationError{"return_context"}
	}

	id := uuid()
	state := id + "." + secret()
	verifier := secret()
	binding := ""
	if input.ClientKind == "web" {
		binding = secret()
	}

	expires := s.now().Add(10 * time.Minute)
	attempt := Attempt{
		ID:               id,
		StateHash:        digest(state),
		ClientKind:       input.ClientKind,
		BindingHash:      digest(binding),
		AppChallenge:     input.AppChallenge,
		ProviderVerifier: verifier,
		Context:          input.Context,
		ExpiresAt:        expires,
		Status:           "pending",
	}
	err := s.store.Update(ctx, func(records Records) error { records.PutAttempt(attempt); return nil })
	if err != nil {
		return Started{}, err
	}

	return Started{
		AttemptID:        id,
		AuthorizationURL: s.provider.AuthorizationURL(state, challenge(verifier)),
		BindingSecret:    binding,
		ExpiresAt:        expires,
	}, nil
}

func (s *Service) returnURL(attempt Attempt, authError, handoff string) string {
	target := s.config.PublicOrigin + "/auth/return"
	values := url.Values{}
	if attempt.ClientKind == "web" {
		values.Set("kind", attempt.Context.Kind)
		if attempt.Context.Kind == "invitation" {
			values.Set("token", attempt.Context.Token)
		}
	} else {
		target = s.config.NativeCallbacks[attempt.ClientKind]
		values.Set("attempt_id", attempt.ID)
		if handoff != "" {
			values.Set("handoff_code", handoff)
		}
	}

	if authError != "" {
		values.Set("auth_error", authError)
	}

	return target + "?" + values.Encode()
}
