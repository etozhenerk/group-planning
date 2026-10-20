package identity_test

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/url"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

type clock struct {
	mu    sync.Mutex
	value time.Time
}

func (c *clock) now() time.Time {
	c.mu.Lock()
	defer c.mu.Unlock()

	return c.value
}

func (c *clock) add(d time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.value = c.value.Add(d)
}

type provider struct {
	mu    sync.Mutex
	calls int
}

func (p *provider) AuthorizationURL(state, challenge string) string {
	return "https://provider.example/authorize?" + url.Values{"state": {state}, "code_challenge": {challenge}}.Encode()
}

func (p *provider) Verify(ctx context.Context, code, verifier string) (identity.Profile, error) {
	p.mu.Lock()
	p.calls++
	p.mu.Unlock()
	if code == "fail" {
		return identity.Profile{}, errors.New("private-provider-token")
	}

	return identity.Profile{Subject: "123", DisplayName: "Лена"}, ctx.Err()
}

func sum(value string) string {
	s := sha256.Sum256([]byte(value))
	return hex.EncodeToString(s[:])
}

func appChallenge(value string) string {
	s := sha256.Sum256([]byte(value))
	return base64.RawURLEncoding.EncodeToString(s[:])
}

func setup(t *testing.T) (*identity.Service, *memory.Identity, *clock, *provider) {
	t.Helper()
	store := memory.NewIdentity()
	now := &clock{value: time.Now().UTC()}
	p := &provider{}
	service, err := identity.New(identity.Config{
		PublicOrigin: "https://somewhere.example",
		NativeCallbacks: map[string]string{
			"ios":     "group-planning-ios://auth/callback",
			"android": "group-planning-android://auth/callback",
		},
		SessionTTL: time.Hour,
	}, store, p, now.now, func(context.Context, string) (bool, error) { return true, nil })
	if err != nil {
		t.Fatal(err)
	}

	return service, store, now, p
}

func start(t *testing.T, s *identity.Service, kind string) (identity.Started, string) {
	t.Helper()
	verifier := strings.Repeat("v", 43)
	input := identity.StartInput{ClientKind: kind, Context: identity.ReturnContext{Kind: "home"}}
	if kind != "web" {
		input.AppChallenge = appChallenge(verifier)
	}

	result, err := s.Start(context.Background(), input, "https://somewhere.example")
	if err != nil {
		t.Fatal(err)
	}

	return result, verifier
}

func state(t *testing.T, a identity.Started) string {
	t.Helper()
	u, err := url.Parse(a.AuthorizationURL)
	if err != nil {
		t.Fatal(err)
	}

	return u.Query().Get("state")
}

func webLogin(t *testing.T, s *identity.Service) identity.Completed {
	t.Helper()
	a, _ := start(t, s, "web")
	result, err := s.Callback(context.Background(), identity.CallbackInput{State: state(t, a), Code: "ok", Binding: a.BindingSecret})
	if err != nil {
		t.Fatal(err)
	}

	return result
}

func TestWebSessionBindingRevocationAndExpiry(t *testing.T) {
	s, store, now, _ := setup(t)
	a, _ := start(t, s, "web")
	if _, err := s.Callback(context.Background(), identity.CallbackInput{State: state(t, a), Code: "ok", Binding: strings.Repeat("a", 43)}); !errors.Is(err, identity.ErrForbidden) {
		t.Fatal(err)
	}

	result, err := s.Callback(context.Background(), identity.CallbackInput{State: state(t, a), Code: "ok", Binding: a.BindingSecret})
	if err != nil {
		t.Fatal(err)
	}

	if _, err := s.Callback(context.Background(), identity.CallbackInput{State: state(t, a), Code: "ok", Binding: a.BindingSecret}); !errors.Is(err, identity.ErrInvalidAttempt) {
		t.Fatal("callback replay", err)
	}

	principal, err := s.Authenticate(context.Background(), result.SessionSecret, true)
	if err != nil || principal.User.ID == "" || principal.CSRF == "" {
		t.Fatalf("principal: %+v %v", principal, err)
	}

	if _, err := s.Authenticate(context.Background(), result.SessionSecret, false); !errors.Is(err, identity.ErrUnauthenticated) {
		t.Fatal("web secret accepted as bearer")
	}

	if s.AuthorizeMutation(principal, "https://attacker.example", principal.CSRF) == nil || s.AuthorizeMutation(principal, "https://somewhere.example", "wrong") == nil {
		t.Fatal("CSRF bypass")
	}

	if err := s.AuthorizeMutation(principal, "https://somewhere.example", principal.CSRF); err != nil {
		t.Fatal(err)
	}

	if err := store.Update(context.Background(), func(records identity.Records) error {
		if _, ok := records.Session(result.SessionSecret); ok {
			t.Fatal("plaintext session key")
		}

		record, ok := records.Session(sum(result.SessionSecret))
		if !ok {
			t.Fatal("missing session hash")
		}

		data, _ := json.Marshal(record)
		if strings.Contains(string(data), result.SessionSecret) {
			t.Fatal("plaintext session record")
		}

		if _, ok := records.Attempt(a.AttemptID); ok {
			t.Fatal("web attempt retained")
		}

		return nil
	}); err != nil {
		t.Fatal(err)
	}

	if err := s.Logout(context.Background(), result.SessionSecret); err != nil {
		t.Fatal(err)
	}

	if _, err := s.Authenticate(context.Background(), result.SessionSecret, true); !errors.Is(err, identity.ErrUnauthenticated) {
		t.Fatal("revoked session accepted")
	}

	second := webLogin(t, s)
	now.add(time.Hour)
	if _, err := s.Authenticate(context.Background(), second.SessionSecret, true); !errors.Is(err, identity.ErrUnauthenticated) {
		t.Fatal("expired session accepted")
	}

	count, err := s.Cleanup(context.Background())
	if err != nil || count.Sessions != 1 {
		t.Fatalf("cleanup %+v %v", count, err)
	}
}

func TestInvalidExpiredCanceledAndFailedCallbacks(t *testing.T) {
	for _, mode := range []string{"wrong-state", "attempt-id-only", "expired", "cancelled", "provider-failure"} {
		t.Run(mode, func(t *testing.T) {
			s, store, now, p := setup(t)
			a, _ := start(t, s, "web")
			input := identity.CallbackInput{State: state(t, a), Code: "ok", Binding: a.BindingSecret}
			switch mode {
			case "wrong-state":
				input.State = a.AttemptID + ".wrong"
			case "attempt-id-only":
				input.State = a.AttemptID
			case "expired":
				now.add(10 * time.Minute)
			case "cancelled":
				input.Code = ""
				input.ProviderError = "access_denied"
			case "provider-failure":
				input.Code = "fail"
			}

			result, err := s.Callback(context.Background(), input)
			if mode == "cancelled" || mode == "provider-failure" {
				if err != nil || result.SessionSecret != "" {
					t.Fatalf("failed callback: %+v %v", result, err)
				}

				expected := "auth_cancelled"
				if mode == "provider-failure" {
					expected = "auth_unavailable"
				}

				if !strings.Contains(result.RedirectURL, expected) {
					t.Fatal(result.RedirectURL)
				}
			} else if !errors.Is(err, identity.ErrInvalidAttempt) {
				t.Fatal(err)
			}

			if err := store.Update(context.Background(), func(records identity.Records) error {
				if _, ok := records.UserBySubject("yandex:123"); ok {
					t.Fatal("failed login created user")
				}

				return nil
			}); err != nil {
				t.Fatal(err)
			}

			if mode != "provider-failure" && p.calls != 0 {
				t.Fatal("provider called before state validation")
			}
		})
	}
}

func TestConcurrentFirstAndRepeatedLoginUsesOneProfile(t *testing.T) {
	s, _, _, _ := setup(t)
	var wg sync.WaitGroup
	ids := make(chan string, 20)
	tokens := make(chan string, 20)
	for range 20 {
		wg.Go(func() {
			a, err := s.Start(context.Background(), identity.StartInput{ClientKind: "web", Context: identity.ReturnContext{Kind: "home"}}, "https://somewhere.example")
			if err != nil {
				t.Error(err)
				return
			}

			u, _ := url.Parse(a.AuthorizationURL)
			result, err := s.Callback(context.Background(), identity.CallbackInput{State: u.Query().Get("state"), Code: "ok", Binding: a.BindingSecret})
			if err != nil {
				t.Error(err)
				return
			}

			principal, err := s.Authenticate(context.Background(), result.SessionSecret, true)
			if err != nil {
				t.Error(err)
				return
			}

			ids <- principal.User.ID
			tokens <- result.SessionSecret
		})
	}

	wg.Wait()
	close(ids)
	close(tokens)
	id := ""
	count := 0
	for current := range ids {
		if id != "" && current != id {
			t.Fatal("duplicate profile")
		}

		id = current
		count++
	}

	if count != 20 {
		t.Fatal("missing login")
	}

	seen := map[string]bool{}
	for token := range tokens {
		if seen[token] {
			t.Fatal("reused secret")
		}

		seen[token] = true
	}

	later := webLogin(t, s)
	principal, err := s.Authenticate(context.Background(), later.SessionSecret, true)
	if err != nil || principal.User.ID != id {
		t.Fatal("profile changed on repeat login")
	}
}

func TestNativeHandoffBindingsAndSingleUse(t *testing.T) {
	for _, kind := range []string{"ios", "android"} {
		t.Run(kind, func(t *testing.T) {
			s, store, _, _ := setup(t)
			a, verifier := start(t, s, kind)
			result, err := s.Callback(context.Background(), identity.CallbackInput{State: state(t, a), Code: "ok"})
			if err != nil {
				t.Fatal(err)
			}

			u, _ := url.Parse(result.RedirectURL)
			code := u.Query().Get("handoff_code")
			if result.SessionSecret != "" || code == "" || u.Scheme != "group-planning-"+kind {
				t.Fatal("native callback leaked or lost handoff")
			}

			if err := store.Update(context.Background(), func(records identity.Records) error {
				attempt, ok := records.Attempt(a.AttemptID)
				if !ok || attempt.ProviderVerifier != "" || attempt.StateHash != "" || attempt.HandoffHash != sum(code) {
					t.Fatalf("unsafe verified attempt: %+v", attempt)
				}

				return nil
			}); err != nil {
				t.Fatal(err)
			}

			if _, err := s.Exchange(context.Background(), a.AttemptID, code, strings.Repeat("x", 43)); !errors.Is(err, identity.ErrInvalidAttempt) {
				t.Fatal("foreign verifier accepted")
			}

			if _, err := s.Exchange(context.Background(), "unknown", code, verifier); !errors.Is(err, identity.ErrInvalidAttempt) {
				t.Fatal("foreign attempt accepted")
			}

			var wg sync.WaitGroup
			success := make(chan identity.IssuedSession, 10)
			for range 10 {
				wg.Go(func() {
					session, err := s.Exchange(context.Background(), a.AttemptID, code, verifier)
					if err == nil {
						success <- session
					} else if !errors.Is(err, identity.ErrInvalidAttempt) {
						t.Error(err)
					}
				})
			}

			wg.Wait()
			close(success)
			var issued identity.IssuedSession
			count := 0
			for session := range success {
				issued = session
				count++
			}

			if count != 1 {
				t.Fatalf("issued %d sessions", count)
			}

			principal, err := s.Authenticate(context.Background(), issued.Secret, false)
			if err != nil || principal.ClientKind != kind {
				t.Fatalf("native authentication: %v", err)
			}

			if _, err := s.Authenticate(context.Background(), issued.Secret, true); !errors.Is(err, identity.ErrUnauthenticated) {
				t.Fatal("native secret accepted as cookie")
			}

			if _, err := s.Exchange(context.Background(), a.AttemptID, code, verifier); !errors.Is(err, identity.ErrInvalidAttempt) {
				t.Fatal("handoff replay")
			}

			if _, err := s.Callback(context.Background(), identity.CallbackInput{State: state(t, a), Code: "ok"}); !errors.Is(err, identity.ErrInvalidAttempt) {
				t.Fatal("callback replay")
			}
		})
	}
}

func TestExpiredHandoffAndInvitationContext(t *testing.T) {
	s, _, now, _ := setup(t)
	a, verifier := start(t, s, "ios")
	result, err := s.Callback(context.Background(), identity.CallbackInput{State: state(t, a), Code: "ok"})
	if err != nil {
		t.Fatal(err)
	}

	u, _ := url.Parse(result.RedirectURL)
	now.add(time.Minute)
	if _, err := s.Exchange(context.Background(), a.AttemptID, u.Query().Get("handoff_code"), verifier); !errors.Is(err, identity.ErrInvalidAttempt) {
		t.Fatal("expired handoff accepted")
	}

	count, err := s.Cleanup(context.Background())
	if err != nil || count.Attempts != 1 {
		t.Fatalf("handoff cleanup: %+v %v", count, err)
	}

	token := appChallenge("invitation")
	a, err = s.Start(context.Background(), identity.StartInput{
		ClientKind: "web",
		Context:    identity.ReturnContext{Kind: "invitation", Token: token},
	}, "https://somewhere.example")
	if err != nil {
		t.Fatal(err)
	}

	result, err = s.Callback(context.Background(), identity.CallbackInput{State: state(t, a), Code: "ok", Binding: a.BindingSecret})
	if err != nil {
		t.Fatal(err)
	}

	u, _ = url.Parse(result.RedirectURL)
	if u.Query().Get("kind") != "invitation" || u.Query().Get("token") != token || u.Query().Has("state") || u.Query().Has("code") {
		t.Fatal("lost invitation or leaked provider parameters")
	}

	if _, err := s.Start(context.Background(), identity.StartInput{
		ClientKind: "web",
		Context:    identity.ReturnContext{Kind: "https://attacker.example"},
	}, "https://somewhere.example"); err == nil {
		t.Fatal("external return accepted")
	}
}

func TestConcurrentCallbackIssuesOnce(t *testing.T) {
	s, _, _, provider := setup(t)
	attempt, _ := start(t, s, "web")
	input := identity.CallbackInput{State: state(t, attempt), Code: "ok", Binding: attempt.BindingSecret}
	var group sync.WaitGroup
	success := make(chan string, 20)
	for range 20 {
		group.Go(func() {
			result, err := s.Callback(context.Background(), input)
			if err == nil {
				success <- result.SessionSecret
			} else if !errors.Is(err, identity.ErrInvalidAttempt) {
				t.Error(err)
			}
		})
	}

	group.Wait()
	close(success)
	count := 0
	for secret := range success {
		if secret == "" {
			t.Fatal("empty session")
		}

		count++
	}

	provider.mu.Lock()
	calls := provider.calls
	provider.mu.Unlock()
	if count != 1 || calls != 1 {
		t.Fatalf("issued=%d provider calls=%d", count, calls)
	}
}
