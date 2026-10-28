package realtime

import (
	"context"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/centrifugal/centrifuge"
)

type slowTransport struct {
	block       atomic.Bool
	release     chan struct{}
	entered     chan struct{}
	closed      chan centrifuge.Disconnect
	writeOnce   sync.Once
	releaseOnce sync.Once
	closeOnce   sync.Once
}

func (*slowTransport) Name() string { return "test" }

func (*slowTransport) AcceptProtocol() string { return "" }

func (*slowTransport) Protocol() centrifuge.ProtocolType { return centrifuge.ProtocolTypeJSON }

func (*slowTransport) ProtocolVersion() centrifuge.ProtocolVersion {
	return centrifuge.ProtocolVersion2
}

func (*slowTransport) Unidirectional() bool { return true }

func (*slowTransport) Emulation() bool { return false }

func (*slowTransport) DisabledPushFlags() uint64 { return 0 }

func (*slowTransport) PingPongConfig() centrifuge.PingPongConfig { return centrifuge.PingPongConfig{} }

func (s *slowTransport) Write([]byte) error {
	if s.block.Load() {
		s.writeOnce.Do(func() { close(s.entered) })
		<-s.release
	}

	return nil
}

func (s *slowTransport) WriteMany(...[]byte) error { return s.Write(nil) }

func (s *slowTransport) unblock() { s.releaseOnce.Do(func() { close(s.release) }) }

func (s *slowTransport) Close(d centrifuge.Disconnect) error {
	s.unblock()
	s.closeOnce.Do(func() { s.closed <- d })

	return nil
}

func TestRealtimeSlowConsumerHasRecoverableBound(t *testing.T) {
	f := newSocketFixture(t)
	principal, err := f.auth.Authenticate(t.Context(), f.native, false)
	if err != nil {
		t.Fatal(err)
	}

	transport := &slowTransport{
		release: make(chan struct{}),
		entered: make(chan struct{}),
		closed:  make(chan centrifuge.Disconnect, 1),
	}
	ctx := context.WithValue(t.Context(), credentialsKey{}, credentials{token: f.native, principal: principal})
	client, closeClient, err := centrifuge.NewClient(ctx, f.adapter.node, transport)
	if err != nil {
		t.Fatal(err)
	}

	defer func() {
		transport.unblock()
		closeClient()
	}()

	if err := client.ConnectNoErrorToDisconnect(centrifuge.ConnectRequest{}); err != nil {
		t.Fatal(err)
	}

	transport.block.Store(true)
	payload := []byte(`{"test":"` + strings.Repeat("x", 2048) + `"}`)
	deadline := time.After(3 * time.Second)
	if _, err := f.adapter.node.Publish("personal:u", payload); err != nil {
		t.Fatal(err)
	}

	select {
	case <-transport.entered:
	case <-deadline:
		t.Fatal("slow writer did not start")
	}

	for range 100 {
		if _, err := f.adapter.node.Publish("personal:u", payload); err != nil {
			t.Fatal(err)
		}
	}

	// Centrifuge removes an overflowing client before waiting for its in-flight
	// write to finish. Waiting for Close to release that same write deadlocks the
	// test double; production WebSocket writes instead have a bounded deadline.
	tick := time.NewTicker(time.Millisecond)
	defer tick.Stop()
	for f.adapter.node.Hub().NumClients() != 0 {
		select {
		case <-tick.C:
		case <-deadline:
			t.Fatal("send queue failed to evict slow consumer")
		}
	}

	transport.unblock()
	select {
	case d := <-transport.closed:
		if d.Code != 3008 {
			t.Fatal("wrong slow consumer disconnect", d.Code)
		}
	case <-deadline:
		transport.Close(centrifuge.DisconnectForceNoReconnect)
		t.Fatal("send queue failed to bound slow consumer")
	}
}
