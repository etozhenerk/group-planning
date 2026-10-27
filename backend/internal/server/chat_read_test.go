package server

import (
	"context"
	"encoding/base64"
	"errors"
	"io"
	"log/slog"
	"net"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestChatReadConfigDefaultAndKeyRequirement(t *testing.T) {
	for _, c := range []struct {
		flag, key      string
		valid, enabled bool
	}{{"", "", true, false}, {"false", "", true, false}, {"true", "", false, false}, {"invalid", "", false, false}, {"true", base64.StdEncoding.EncodeToString([]byte(strings.Repeat("r", 32))), true, true}} {
		config, err := LoadConfig(func(name string) string {
			switch name {
			case "SOMEWHERE_CHAT_READ_STATE":
				return c.flag
			case "SOMEWHERE_CHAT_SYNC_KEY":
				return c.key
			}

			return ""
		})
		if (err == nil) != c.valid || err == nil && config.ChatReadState != c.enabled {
			t.Fatal("read flag", c.flag, err)
		}
	}
}

type failReadActivationStore struct {
	meetings.Store
	failure error
}

func (s failReadActivationStore) Update(context.Context, func(meetings.Writer) error) error {
	return s.failure
}

func TestChatReadActivationFailurePreventsHTTPStart(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}

	failure := errors.New("activation failed")
	err = ServeWithStorage(t.Context(), listener, failReadActivationStore{memory.New(), failure}, memory.NewIdentity(), nil, Config{ShutdownTimeout: time.Second, ChatSyncKey: []byte(strings.Repeat("r", 32)), ChatReadState: true}, slog.New(slog.NewTextHandler(io.Discard, nil)))
	if !errors.Is(err, failure) {
		t.Fatal("startup ignored activation", err)
	}

	if conn, err := net.DialTimeout("tcp", listener.Addr().String(), time.Second); err == nil {
		conn.Close()
		t.Fatal("listener still accepts after activation failure")
	}
}
