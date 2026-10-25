package meetings

import (
	"context"
	"encoding/json"
)

// FeedQuery distinguishes an initial page from an explicit after/before cursor.
type FeedQuery struct {
	Limit         int
	After, Before *uint64
}

// Feed returns one ordered snapshot and never uses latest_sequence as a page cursor.
func (s *Service) Feed(ctx context.Context, actor Actor, id string, query FeedQuery) (FeedPage, error) {
	if err := checkActor(actor); err != nil {
		return FeedPage{}, err
	}

	if query.Limit < 1 || query.Limit > 100 || (query.After != nil && query.Before != nil) {
		return FeedPage{}, ValidationError{map[string]string{"cursor": "invalid"}}
	}

	result := FeedPage{Entries: []FeedEntry{}}
	err := s.store.View(ctx, func(reader Reader) error {
		details, err := privateSnapshot(reader, id, actor.ID)
		if err != nil {
			return err
		}

		entries, err := reader.Feed(id)
		if err != nil {
			return err
		}

		result.Details = details
		if len(entries) > 0 {
			result.LatestSequence = entries[len(entries)-1].Sequence
		}

		for _, entry := range entries {
			if query.After != nil && entry.Sequence <= *query.After {
				continue
			}

			if query.Before != nil && entry.Sequence >= *query.Before {
				continue
			}

			result.Entries = append(result.Entries, entry)
		}

		if len(result.Entries) > query.Limit {
			result.HasMore = true
			if query.After != nil {
				result.Entries = result.Entries[:query.Limit]
			} else {
				result.Entries = result.Entries[len(result.Entries)-query.Limit:]
			}
		}

		return nil
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

		entries, err := writer.Feed(id)
		if err != nil {
			return err
		}

		for _, entry := range entries {
			if entry.Kind == "message" && entry.ActorID == actor.ID && entry.ClientRequestID == clientRequestID {
				var payload struct {
					Text string `json:"text"`
				}
				if json.Unmarshal(entry.Payload, &payload) != nil {
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
