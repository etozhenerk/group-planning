// Package realtime adapts committed chat hints to the embedded Centrifuge broker.
package realtime

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/centrifugal/centrifuge"
	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type (
	credentials struct {
		token     string
		web       bool
		principal identity.Principal
	}
	credentialsKey struct{}
)

// Adapter owns the broker and active session references. It stores no durable payload.
type Adapter struct {
	node    *centrifuge.Node
	socket  http.Handler
	auth    *identity.Service
	app     *meetings.Service
	mu      sync.Mutex
	clients map[*centrifuge.Client]credentials
	unwatch func()
}

// New starts an in-process broker; persistent catch-up remains an HTTP operation.
func New(app *meetings.Service, auth *identity.Service) (*Adapter, error) {
	node, err := centrifuge.New(centrifuge.Config{ClientQueueMaxSize: 64 << 10, ClientChannelLimit: 2, UserConnectionLimit: 5, ChannelMaxLength: 80, ClientStaleCloseDelay: 5 * time.Second, ClientExpiredCloseDelay: time.Second, RecoveryMaxPublicationLimit: 1000})
	if err != nil {
		return nil, err
	}

	a := &Adapter{node: node, auth: auth, app: app, clients: map[*centrifuge.Client]credentials{}}
	// The protocol permits client unsubscribe of server-side subscriptions unless
	// rejected before dispatch. Keep the session-derived personal channel mandatory.
	node.OnCommandRead(func(_ *centrifuge.Client, e centrifuge.CommandReadEvent) error {
		if e.Command.Unsubscribe != nil && strings.HasPrefix(e.Command.Unsubscribe.Channel, "personal:") {
			return centrifuge.ErrorPermissionDenied
		}

		return nil
	})
	node.OnConnecting(a.connecting)
	node.OnConnect(a.connected)
	a.socket = centrifuge.NewWebsocketHandler(node, centrifuge.WebsocketConfig{CheckOrigin: func(r *http.Request) bool {
		return r.Header.Get("Origin") == "" || r.Header.Get("Origin") == auth.PublicOrigin()
	}, MessageSizeLimit: 4096, WriteTimeout: 2 * time.Second})
	a.unwatch = auth.OnRevocation(a.revoked)
	if err := node.Run(); err != nil {
		a.unwatch()
		return nil, err
	}

	return a, nil
}

// ServeAuthenticatedHTTP accepts only the HTTP layer's verified cookie/Bearer credentials.
// No connect token, authentication data or URL query is used as a second authentication mechanism.
func (a *Adapter) ServeAuthenticatedHTTP(w http.ResponseWriter, r *http.Request, p identity.Principal, token string, web bool) {
	c := credentials{token: token, web: web, principal: p}
	a.socket.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), credentialsKey{}, c)))
}

func (a *Adapter) connecting(ctx context.Context, e centrifuge.ConnectEvent) (centrifuge.ConnectReply, error) {
	c, ok := ctx.Value(credentialsKey{}).(credentials)
	if !ok || e.Token != "" || !emptyConnectData(e.Data) || len(e.Headers) > 0 {
		return centrifuge.ConnectReply{}, centrifuge.ErrorUnauthorized
	}

	p, err := a.auth.Authenticate(ctx, c.token, c.web)
	if err != nil {
		return centrifuge.ConnectReply{}, realtimeAuthError(err)
	}

	return centrifuge.ConnectReply{Credentials: &centrifuge.Credentials{UserID: p.User.ID, ExpireAt: refreshAt(p)}, Subscriptions: map[string]centrifuge.SubscribeOptions{"personal:" + p.User.ID: {}}}, nil
}

func refreshAt(p identity.Principal) int64 {
	return min(p.ExpiresAt.Unix(), time.Now().Add(45*time.Second).Unix())
}

func (a *Adapter) connected(c *centrifuge.Client) {
	credential := c.Context().Value(credentialsKey{}).(credentials)
	c.OnDisconnect(func(centrifuge.DisconnectEvent) { a.mu.Lock(); delete(a.clients, c); a.mu.Unlock() })
	c.OnRefresh(func(_ centrifuge.RefreshEvent, cb centrifuge.RefreshCallback) {
		p, err := a.auth.Authenticate(c.Context(), credential.token, credential.web)
		if err != nil {
			if errors.Is(err, identity.ErrUnauthenticated) {
				cb(centrifuge.RefreshReply{}, centrifuge.DisconnectForceNoReconnect)
			} else {
				cb(centrifuge.RefreshReply{}, centrifuge.DisconnectServerError)
			}

			return
		}

		if err := a.checkAccess(c.Context(), c); err != nil {
			cb(centrifuge.RefreshReply{}, centrifuge.DisconnectServerError)

			return
		}

		cb(centrifuge.RefreshReply{ExpireAt: refreshAt(p)}, nil)
	})
	c.OnSubscribe(func(e centrifuge.SubscribeEvent, cb centrifuge.SubscribeCallback) {
		if !strings.HasPrefix(e.Channel, "meeting:") || e.Token != "" || !emptyConnectData(e.Data) {
			cb(centrifuge.SubscribeReply{}, centrifuge.ErrorPermissionDenied)
			return
		}

		for _, channel := range c.Channels() {
			if strings.HasPrefix(channel, "meeting:") && channel != e.Channel {
				cb(centrifuge.SubscribeReply{}, centrifuge.ErrorLimitExceeded)
				return
			}
		}

		if _, err := a.auth.Authenticate(c.Context(), credential.token, credential.web); err != nil {
			cb(centrifuge.SubscribeReply{}, realtimeAuthError(err))
			return
		}

		if err := a.app.AuthorizeChatSubscription(c.Context(), c.UserID(), strings.TrimPrefix(e.Channel, "meeting:")); err != nil {
			if errors.Is(err, meetings.ErrForbidden) || errors.Is(err, meetings.ErrNotFound) {
				cb(centrifuge.SubscribeReply{}, centrifuge.ErrorPermissionDenied)
			} else {
				cb(centrifuge.SubscribeReply{}, centrifuge.ErrorInternal)
			}

			return
		}

		cb(centrifuge.SubscribeReply{Options: centrifuge.SubscribeOptions{EnableRecovery: true}}, nil)
	})
	c.OnPublish(func(_ centrifuge.PublishEvent, cb centrifuge.PublishCallback) {
		cb(centrifuge.PublishReply{}, centrifuge.ErrorPermissionDenied)
	})
	a.mu.Lock()
	a.clients[c] = credential
	over := len(a.clients) > 1000
	a.mu.Unlock()
	// Registration precedes the final check so a concurrent committed logout cannot
	// escape both the observer and the check during the connect handshake.
	if _, err := a.auth.Authenticate(c.Context(), credential.token, credential.web); errors.Is(err, identity.ErrUnauthenticated) {
		c.Disconnect(centrifuge.DisconnectForceNoReconnect)
	} else if err != nil || over {
		c.Disconnect(centrifuge.DisconnectServerError)
	}
}

func (a *Adapter) revoked(sessionID, userID string) {
	a.mu.Lock()
	var selected []*centrifuge.Client
	for c, credential := range a.clients {
		if (sessionID != "" && credential.principal.SessionID == sessionID) || (userID != "" && c.UserID() == userID) {
			selected = append(selected, c)
		}
	}

	a.mu.Unlock()
	for _, c := range selected {
		c.Disconnect(centrifuge.DisconnectForceNoReconnect)
	}
}

func (a *Adapter) checkAccess(ctx context.Context, c *centrifuge.Client) error {
	for _, channel := range c.Channels() {
		if strings.HasPrefix(channel, "meeting:") {
			err := a.app.AuthorizeChatSubscription(ctx, c.UserID(), strings.TrimPrefix(channel, "meeting:"))
			if errors.Is(err, meetings.ErrForbidden) || errors.Is(err, meetings.ErrNotFound) {
				c.Unsubscribe(channel, centrifuge.Unsubscribe{Code: 2003, Reason: "access revoked"})
			} else if err != nil {
				return err
			}
		}
	}

	return nil
}

// Close joins Centrifuge workers and closes upgraded connections on server shutdown.
func (a *Adapter) Close(ctx context.Context) error { a.unwatch(); return a.node.Shutdown(ctx) }

func realtimeAuthError(err error) error {
	if errors.Is(err, identity.ErrUnauthenticated) {
		return centrifuge.ErrorUnauthorized
	}

	return centrifuge.ErrorInternal
}

// SDK getData may encode absent data as null or {}. Neither carries identity.
func emptyConnectData(data []byte) bool {
	if len(data) == 0 {
		return true
	}

	var object map[string]json.RawMessage

	return json.Unmarshal(data, &object) == nil && len(object) == 0
}
