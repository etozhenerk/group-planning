package meetings

import (
	"context"
	"encoding/json"
)

type mediaMessagePayload struct {
	Text     string   `json:"text"`
	MediaIDs []string `json:"media_ids"`
}

// PublishMedia atomically attaches a completed upload to exactly one destination.
func (s *Service) PublishMedia(ctx context.Context, actor Actor, meetingID, id, key string) (PublishedMedia, error) {
	if err := checkActor(actor); err != nil {
		return PublishedMedia{}, err
	}

	var result PublishedMedia
	err := s.updateAs(ctx, actor, func(w Writer) error {
		item, err := ownedMedia(w, actor, meetingID, id)
		if err != nil {
			return err
		}

		requestKey, err := keyFor(actor, "media-publish:"+meetingID, key)
		if err != nil {
			return err
		}

		hash := requestHash(struct{ MediaID string }{id})
		_, exists, err := s.receipt(w, requestKey, hash)
		if err != nil {
			return err
		}

		if item.Status == "pending" {
			return &Conflict{Code: "media_not_uploaded"}
		}

		if item.Status != "published" {
			item.Status = "published"
			item.CreatedAt = s.now().UTC()
			if item.Purpose == "message" {
				text := item.FileName
				if item.Kind == "photo" {
					text = "Фото"
				}

				entry, err := s.entry(w, meetingID, "message", actor, mediaMessagePayload{text, []string{id}}, item.ClientRequestID)
				if err != nil {
					return err
				}

				item.EntryID = entry.ID
				entry.Attachments = []Media{item}
				result.Entry = &entry
			}

			if err := w.SaveMedia(item); err != nil {
				return err
			}
		} else if item.EntryID != "" {
			entries, err := w.Feed(meetingID)
			if err != nil {
				return err
			}

			for _, entry := range entries {
				if entry.ID == item.EntryID {
					entry.Attachments = []Media{item}
					result.Entry = &entry
					break
				}
			}

			if result.Entry == nil {
				return ErrInvalidRecord
			}
		}

		result.Media = item
		if exists {
			return nil
		}

		return s.remember(w, requestKey, hash, id)
	})

	return result, err
}

func hydrateMediaEntries(r Reader, entries []FeedEntry) error {
	for i, entry := range entries {
		if entry.Kind != "message" {
			continue
		}

		var payload mediaMessagePayload
		if json.Unmarshal(entry.Payload, &payload) != nil {
			return ErrInvalidRecord
		}

		for _, id := range payload.MediaIDs {
			item, err := r.Media(id)
			if err != nil {
				return err
			}

			if item.MeetingID != entry.MeetingID || item.Status != "published" || item.EntryID != entry.ID {
				return ErrInvalidRecord
			}

			entries[i].Attachments = append(entries[i].Attachments, item)
		}
	}

	return nil
}
