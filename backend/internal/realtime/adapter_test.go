package realtime

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/centrifugal/protocol"
	"github.com/etozhenerk/group-planning/backend/internal/httpapi"
	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

type unusedProvider struct{}

func (unusedProvider) AuthorizationURL(string, string) string { return "" }
func (unusedProvider) Verify(context.Context, string, string) (identity.Profile, error) {
	return identity.Profile{}, errors.New("unused")
}

type socketFixture struct {
	adapter     *Adapter
	auth        *identity.Service
	server      *httptest.Server
	web, native string
	store       *memory.Store
	identities  *faultIdentity
}

func newSocketFixture(t *testing.T, lifetime ...time.Duration) socketFixture {
	t.Helper()
	store := memory.New()
	identities := &faultIdentity{Identity: memory.NewIdentity()}
	now := time.Now().Truncate(time.Second)
	auth, err := identity.New(identity.Config{PublicOrigin: "https://somewhere.test", SessionTTL: time.Hour}, identities, unusedProvider{}, time.Now, func(context.Context, string) (bool, error) { return false, nil })
	if err != nil {
		t.Fatal(err)
	}

	ttl := time.Hour
	if len(lifetime) > 0 {
		ttl = lifetime[0]
	}

	web := base64.RawURLEncoding.EncodeToString([]byte(strings.Repeat("w", 32)))
	native := base64.RawURLEncoding.EncodeToString([]byte(strings.Repeat("n", 32)))
	err = identities.Update(t.Context(), func(r identity.Records) error {
		if err := r.PutUser("subject", identity.User{ID: "u", DisplayName: "Secret name"}); err != nil {
			return err
		}

		for kind, token := range map[string]string{"web": web, "ios": native} {
			sum := sha256.Sum256([]byte(token))
			r.PutSession(identity.Session{ID: kind, UserID: "u", SecretHash: hex.EncodeToString(sum[:]), ClientKind: kind, ExpiresAt: now.Add(ttl)})
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	err = store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: "m", OrganizerID: "u"}); err != nil {
			return err
		}

		_, err := w.EnsureChatStream("m", "epoch")

		return err
	})
	if err != nil {
		t.Fatal(err)
	}

	app := meetings.NewService(store, time.Now, meetings.WithChatSyncKey([]byte(strings.Repeat("k", 32))))
	adapter, err := New(app, auth)
	if err != nil {
		t.Fatal(err)
	}

	server := httptest.NewServer(httpapi.NewWithRealtime(app, auth, nil, slog.New(slog.NewTextHandler(io.Discard, nil)), adapter.ServeAuthenticatedHTTP))
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		if err := adapter.Close(ctx); err != nil {
			t.Error(err)
		}

		server.Close()
	})

	return socketFixture{adapter: adapter, auth: auth, server: server, web: web, native: native, store: store, identities: identities}
}

func TestRealtimeHTTPAuthenticationBoundary(t *testing.T) {
	f := newSocketFixture(t)
	tests := []struct {
		name, path, cookie, bearer, origin string
		status                             int
	}{
		{"missing", "", "", "", "", 401},
		{"cookie missing origin", "", f.web, "", "", 403},
		{"cookie foreign origin", "", f.web, "", "https://other.test", 403},
		{"mixed credentials", "", f.web, f.native, "https://somewhere.test", 401},
		{"duplicate cookies", "", f.web + "; __Host-somewhere_session=" + f.web, "", "https://somewhere.test", 401},
		{"token URL", "?token=private", "", f.native, "", 400},
		{"native wrong session", "", "", f.web, "", 401},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			request, _ := http.NewRequest(http.MethodGet, f.server.URL+"/api/v1/realtime"+tt.path, nil)
			if tt.cookie != "" {
				request.Header.Set("Cookie", "__Host-somewhere_session="+tt.cookie)
			}

			if tt.bearer != "" {
				request.Header.Set("Authorization", "Bearer "+tt.bearer)
			}

			if tt.origin != "" {
				request.Header.Set("Origin", tt.origin)
			}

			response, err := http.DefaultClient.Do(request)
			if err != nil {
				t.Fatal(err)
			}
			defer response.Body.Close()
			body, _ := io.ReadAll(response.Body)
			if response.StatusCode != tt.status || strings.Contains(string(body), f.web) || strings.Contains(string(body), f.native) {
				t.Fatalf("status %d body %s", response.StatusCode, body)
			}
		})
	}
}

func TestRealtimeSocketAuthorizationPrivacyRecoveryAndLogout(t *testing.T) {
	f := newSocketFixture(t)
	c := openSocket(t, f.server.URL, "Cookie: __Host-somewhere_session="+f.web+"\r\nOrigin: https://somewhere.test\r\n")
	c.command(t, `{"id":1,"connect":{}}`)
	c.expect(t, `"personal:u"`)
	c.command(t, `{"id":2,"subscribe":{"channel":"personal:other"}}`)
	c.expect(t, `"code":103`)
	c.command(t, `{"id":3,"subscribe":{"channel":"meeting:m"}}`)
	c.expect(t, `"id":3`)
	c.command(t, `{"id":4,"publish":{"channel":"meeting:m","data":{"text":"private"}}}`)
	c.expect(t, `"code":103`)
	hint := meetings.ChatHint{ID: "event", Target: "meeting", TargetID: "m", MeetingID: "m", Epoch: "epoch", LatestSequence: 9007199254740993, SchemaVersion: 1}
	if err := f.adapter.PublishChat(t.Context(), hint); err != nil {
		t.Fatal(err)
	}

	payload := c.expect(t, `"latest_change_sequence":"9007199254740993"`)
	for _, secret := range []string{"Secret name", f.web, "private", "event"} {
		if strings.Contains(payload, secret) {
			t.Fatal("private payload in hint")
		}
	}

	// Native uses HTTP header; reconnect may list prior server subscriptions but
	// the server derives personal ownership from the newly authenticated session.
	native := openSocket(t, f.server.URL, "Authorization: Bearer "+f.native+"\r\n")
	native.command(t, `{"id":1,"connect":{"subs":{"personal:other":{}}}}`)
	native.expect(t, `"personal:u"`)
	native.command(t, `{"id":2,"subscribe":{"channel":"meeting:m","recover":true,"offset":0,"epoch":"stale"}}`)
	native.expect(t, `"id":2`)
	if err := f.auth.Logout(t.Context(), f.web); err != nil {
		t.Fatal(err)
	}

	c.expect(t, `3503`)
	native.command(t, `{"id":3,"subscribe":{"channel":"meeting:other"}}`)
	native.expect(t, `"id":3`)
	// Removing the meeting forces current subscription revocation before another hint.
	if err := f.store.Update(t.Context(), func(w meetings.Writer) error { return w.DeleteMeeting("m") }); err != nil {
		t.Fatal(err)
	}

	if err := f.adapter.PublishChat(t.Context(), hint); err != nil {
		t.Fatal(err)
	}

	native.expect(t, `"code":2003`)
	f.auth.AccountDeleted("u")
	native.expect(t, `3503`)
}

func TestRealtimeSessionExpiryClosesSocket(t *testing.T) {
	f := newSocketFixture(t, 2*time.Second)
	c := openSocket(t, f.server.URL, "Authorization: Bearer "+f.native+"\r\n")
	c.command(t, `{"id":1,"connect":{}}`)
	c.expect(t, `"personal:u"`)
	c.expect(t, `3503`)
}

func TestRealtimeNativeProtobufSubprotocol(t *testing.T) {
	f := newSocketFixture(t)
	c := openSocket(t, f.server.URL, "Authorization: Bearer "+f.native+"\r\nSec-WebSocket-Protocol: centrifuge-protobuf\r\n")
	data, err := protocol.NewProtobufCommandEncoder().Encode(&protocol.Command{Id: 1, Connect: &protocol.ConnectRequest{}})
	if err != nil {
		t.Fatal(err)
	}

	c.frame(t, 2, data)
	c.expect(t, "personal:u")
}

func TestRealtimeCapabilitiesAndOneMeetingLimit(t *testing.T) {
	f := newSocketFixture(t)
	request, _ := http.NewRequest(http.MethodGet, f.server.URL+"/api/v1/chat-capabilities", nil)
	request.Header.Set("Authorization", "Bearer "+f.native)
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}

	if response.StatusCode != 200 || !strings.Contains(string(body), `"realtime":true`) || !strings.Contains(string(body), `"read_state":false`) {
		t.Fatalf("capabilities %d %s", response.StatusCode, body)
	}

	c := openSocket(t, f.server.URL, "Authorization: Bearer "+f.native+"\r\n")
	c.command(t, `{"id":1,"connect":{}}`)
	c.expect(t, `"id":1`)
	c.command(t, `{"id":2,"subscribe":{"channel":"meeting:m"}}`)
	c.expect(t, `"id":2`)
	c.command(t, `{"id":3,"subscribe":{"channel":"meeting:another"}}`)
	c.expect(t, `"code":106`)
}

type faultIdentity struct {
	*memory.Identity
	fail atomic.Bool
}

func (s *faultIdentity) Update(ctx context.Context, fn func(identity.Records) error) error {
	if s.fail.Load() {
		return errors.New("storage unavailable")
	}

	return s.Identity.Update(ctx, fn)
}

func TestRealtimeStorageFailureIsRetryable(t *testing.T) {
	f := newSocketFixture(t)
	c := openSocket(t, f.server.URL, "Authorization: Bearer "+f.native+"\r\n")
	c.command(t, `{"id":1,"connect":{}}`)
	c.expect(t, `"id":1`)
	f.identities.fail.Store(true)
	c.command(t, `{"id":2,"subscribe":{"channel":"meeting:m"}}`)
	response := c.expect(t, `"code":100`)
	if !strings.Contains(response, `"temporary":true`) {
		t.Fatal("outage is not retryable", response)
	}

	f.identities.fail.Store(false)
	c.command(t, `{"id":3,"subscribe":{"channel":"meeting:m"}}`)
	c.expect(t, `"id":3`)
}

func TestRealtimeEmptySDKDataCarriesNoIdentity(t *testing.T) {
	f := newSocketFixture(t)
	for _, data := range []string{`{}`, `null`} {
		c := openSocket(t, f.server.URL, "Cookie: __Host-somewhere_session="+f.web+"\r\nOrigin: https://somewhere.test\r\n")
		c.command(t, `{"id":1,"connect":{"data":`+data+`}}`)
		c.expect(t, `"personal:u"`)
		c.Close()
	}

	c := openSocket(t, f.server.URL, "Authorization: Bearer "+f.native+"\r\n")
	c.command(t, `{"id":1,"connect":{"data":{"user_id":"other"}}}`)
	c.expect(t, `"code":101`)
}
