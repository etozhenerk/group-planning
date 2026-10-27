package meetings

import (
	"context"
	"encoding/json"
	"errors"
)

// FeedQuery distinguishes an initial page from an explicit after/before cursor.
type FeedQuery struct {
	AroundEntryID string
	Limit         int
	After, Before *uint64
}

// Feed returns one ordered snapshot and never uses latest_sequence as a page cursor.
func (s *Service) Feed(ctx context.Context, actor Actor, id string, query FeedQuery) (FeedPage, error) {
	if err := checkActor(actor); err != nil {
		return FeedPage{}, err
	}

	if query.Limit < 1 || query.Limit > 100 || (query.After != nil && query.Before != nil) || query.AroundEntryID != "" {
		return FeedPage{}, ValidationError{map[string]string{"cursor": "invalid"}}
	}

	result := FeedPage{Entries: []FeedEntry{}}
	err := s.store.View(ctx, func(reader Reader) error {
		details, err := privateSnapshot(reader, id, actor.ID)
		if err != nil {
			return err
		}

		window, err := reader.FeedWindow(id, query)
		if err != nil {
			return err
		}

		result.Details = details
		result.Entries = window.Entries
		result.LatestSequence = window.LatestSequence
		result.HasMore = window.HasMore

		return hydrateMediaEntries(reader, result.Entries)
	})

	return result, err
}

// SendMessage saves one plain text entry per caller/meeting/client request ID.
// A replay, including after receipt expiry, still checks the caller's current access.
func (s *Service) SendMessage(ctx context.Context, actor Actor, id, text, clientRequestID, key string) (FeedEntry, error) {
	if err := checkActor(actor); err != nil {
		return FeedEntry{}, err
	}

	if err := validateText("text", text, 4000, true); err != nil {
		return FeedEntry{}, err
	}

	requestKey, err := keyFor(actor, "message:"+id, key)
	if err != nil {
		return FeedEntry{}, err
	}

	clientRequestID, err = ParseUUID(clientRequestID)
	if err != nil || clientRequestID != requestKey.Key {
		return FeedEntry{}, ValidationError{map[string]string{"client_request_id": "must_match_idempotency_key"}}
	}

	hash := requestHash(struct{ Text, ClientRequestID string }{text, clientRequestID})
	var result FeedEntry
	err = s.updateAs(ctx, actor, func(writer Writer) error {
		if _, err := privateSnapshot(writer, id, actor.ID); err != nil {
			return err
		}

		receipt, exists, err := s.receipt(writer, requestKey, hash)
		if err != nil {
			return err
		}

		entry, err := writer.MessageByRequest(id, actor.ID, clientRequestID)
		if err != nil && !errors.Is(err, ErrNotFound) {
			return err
		}

		if err == nil {
			var payload struct {
				Text string `json:"text"`
			}
			if entry.Kind != "message" || json.Unmarshal(entry.Payload, &payload) != nil {
				return ErrInvalidRecord
			}

			if payload.Text != text {
				return ErrIdempotencyConflict
			}

			if exists && receipt.ResourceID != entry.ID {
				return ErrInvalidRecord
			}

			result = entry

			return nil
		}

		if exists {
			return ErrInvalidRecord
		}

		result, err = s.entry(writer, id, "message", actor, struct {
			Text string `json:"text"`
		}{text}, clientRequestID)
		if err != nil {
			return err
		}

		return s.remember(writer, requestKey, hash, result.ID)
	})

	return result, err
}
