package meetings

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

type readersCursor struct {
	Version   int    `json:"v"`
	UserID    string `json:"u"`
	MeetingID string `json:"m"`
	EntryID   string `json:"i"`
	Epoch     string `json:"e"`
	After     string `json:"a"`
	Expires   int64  `json:"x"`
}

func (s *Service) readersCursor(c readersCursor) string {
	data, _ := json.Marshal(c)
	payload := base64.RawURLEncoding.EncodeToString(data)
	mac := hmac.New(sha256.New, s.chatKey)
	mac.Write([]byte("chat-readers-v1." + payload))

	return payload + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func (s *Service) decodeReadersCursor(raw, userID, id, entryID, epoch string) (readersCursor, error) {
	var c readersCursor
	parts := strings.Split(raw, ".")
	if len(raw) > 2048 || len(parts) != 2 {
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
	mac.Write([]byte("chat-readers-v1." + parts[0]))
	if !hmac.Equal(signature, mac.Sum(nil)) || json.Unmarshal(data, &c) != nil || c.Version != 1 || c.UserID != userID || c.MeetingID != id || c.EntryID != entryID || c.After == "" {
		return c, ErrSyncCursorInvalid
	}

	if c.Epoch != epoch || s.now().Unix() >= c.Expires {
		return c, ErrSyncResetRequired
	}

	return c, nil
}

// MessageReaders returns only current authorized members who actually read an
// author's message. Every page rechecks membership and uses an opaque scoped cursor.
func (s *Service) MessageReaders(ctx context.Context, actor Actor, id, entryID, cursor string, limit int) (ReadersPage, error) {
	return s.messageReaders(ctx, actor, id, entryID, cursor, limit, true)
}

func (s *Service) messageReaders(ctx context.Context, actor Actor, id, entryID, cursor string, limit int, initialize bool) (ReadersPage, error) {
	if err := checkActor(actor); err != nil {
		return ReadersPage{}, err
	}

	if !s.ChatReadStateEnabled() {
		return ReadersPage{}, ErrNotFound
	}

	if limit < 1 || limit > 100 {
		return ReadersPage{}, ValidationError{map[string]string{"limit": "invalid"}}
	}

	result := ReadersPage{UserIDs: []string{}}
	err := s.store.View(ctx, func(r Reader) error {
		if _, err := chatSnapshot(r, id, actor.ID); err != nil {
			return err
		}

		entry, err := ownReadMessage(r, id, actor.ID, entryID)
		if err != nil {
			return err
		}

		stream, err := r.ChatStream(id)
		if errors.Is(err, ErrNotFound) {
			if cursor == "" && initialize {
				return errSyncStreamMissing
			}

			return ErrSyncResetRequired
		}

		if err != nil {
			return err
		}

		position := readersCursor{Version: 1, UserID: actor.ID, MeetingID: id, EntryID: entryID, Epoch: stream.Epoch, Expires: s.now().Add(7 * 24 * time.Hour).Unix()}
		if cursor != "" {
			position, err = s.decodeReadersCursor(cursor, actor.ID, id, entryID, stream.Epoch)
			if err != nil {
				return err
			}
		}

		ids, err := r.ChatReaderIDs(id, actor.ID, entry.Sequence, position.After, limit)
		if err != nil {
			return err
		}

		if len(ids) > limit {
			ids = ids[:limit]
			position.After = ids[len(ids)-1]
			result.NextCursor = s.readersCursor(position)
		}

		result.UserIDs = ids
		counts, err := r.ChatReceiptCounts(id, actor.ID, []string{entryID})
		if err != nil {
			return err
		}

		result.ReaderCount, result.ProjectionVersion = counts[0].ReaderCount, stream.LatestSequence

		return nil
	})
	if errors.Is(err, errSyncStreamMissing) {
		if err := s.ensureChatStream(ctx, actor, id); err != nil {
			return ReadersPage{}, err
		}

		return s.messageReaders(ctx, actor, id, entryID, cursor, limit, false)
	}

	return result, err
}
