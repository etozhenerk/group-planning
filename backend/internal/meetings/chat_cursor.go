package meetings

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

var (
	// ErrSyncCursorInvalid rejects malformed, forged or differently scoped cursors.
	ErrSyncCursorInvalid = errors.New("invalid sync cursor")
	// ErrSyncResetRequired requires a fresh authorized snapshot.
	ErrSyncResetRequired = errors.New("sync reset required")
)

// WithChatSyncKey enables HTTP sync using a stable deployment-owned signing key.
// Keys shorter than 32 bytes leave the capability disabled.
func WithChatSyncKey(key []byte) Option {
	return func(s *Service) {
		if len(key) >= 32 {
			s.chatKey = append([]byte{}, key...)
		}
	}
}

// ChatSyncEnabled advertises only the implemented and configured HTTP capability.
func (s *Service) ChatSyncEnabled() bool { return len(s.chatKey) >= 32 }

type syncCursor struct {
	Version   int    `json:"v"`
	UserID    string `json:"u"`
	MeetingID string `json:"m"`
	Epoch     string `json:"e"`
	After     uint64 `json:"a,string"`
	Through   uint64 `json:"t,string"`
	Expires   int64  `json:"x"`
}

func (s *Service) encodeSyncCursor(c syncCursor) string {
	data, _ := json.Marshal(c)
	payload := base64.RawURLEncoding.EncodeToString(data)
	mac := hmac.New(sha256.New, s.chatKey)
	mac.Write([]byte("chat-sync-v1." + payload))

	return payload + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func (s *Service) decodeSyncCursor(raw, userID, meetingID string) (syncCursor, error) {
	var c syncCursor
	if len(raw) > 2048 {
		return c, ErrSyncCursorInvalid
	}

	parts := strings.Split(raw, ".")
	if len(parts) != 2 {
		return c, ErrSyncCursorInvalid
	}

	data, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil || base64.RawURLEncoding.EncodeToString(data) != parts[0] {
		return c, ErrSyncCursorInvalid
	}

	signature, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil || base64.RawURLEncoding.EncodeToString(signature) != parts[1] {
		return c, ErrSyncCursorInvalid
	}

	mac := hmac.New(sha256.New, s.chatKey)
	mac.Write([]byte("chat-sync-v1." + parts[0]))
	if !hmac.Equal(signature, mac.Sum(nil)) || json.Unmarshal(data, &c) != nil || c.Version != 1 || c.UserID != userID || c.MeetingID != meetingID || c.Epoch == "" || (c.Through != 0 && c.After > c.Through) {
		return c, ErrSyncCursorInvalid
	}

	if s.now().Unix() >= c.Expires {
		return c, ErrSyncResetRequired
	}

	return c, nil
}

func (s *Service) positionCursor(actor Actor, stream ChatStream, after, through uint64) syncCursor {
	return syncCursor{Version: 1, UserID: actor.ID, MeetingID: stream.MeetingID, Epoch: stream.Epoch, After: after, Through: through, Expires: s.now().Add(7 * 24 * time.Hour).Unix()}
}
