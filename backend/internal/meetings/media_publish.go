package meetings

import (
	"context"
	"encoding/json"
	"strings"
)

type mediaMessagePayload struct {
	Text     string   `json:"text"`
	MediaIDs []string `json:"media_ids"`
}

// PublishMedia atomically attaches a completed upload to exactly one destination.
func (s *Service) PublishMedia(ctx context.Context, actor Actor, meetingID, id, key string) (PublishedMedia, error) {
	return s.PublishMediaWithCaption(ctx, actor, meetingID, id, key, "")
}

// PublishMediaWithCaption attaches an optional document caption to its message.
// Photos and album entries do not accept captions; published messages are immutable.
func (s *Service) PublishMediaWithCaption(ctx context.Context, actor Actor, meetingID, id, key, caption string) (PublishedMedia, error) {
	if err := checkActor(actor); err != nil {
		return PublishedMedia{}, err
	}

	caption = strings.TrimSpace(caption)
	if err := validateText("caption", caption, 2000, false); err != nil {
		return PublishedMedia{}, err
	}

	var result PublishedMedia
	err := s.updateAs(ctx, actor, func(w Writer) error {
		item, err := ownedMedia(w, actor, meetingID, id)
		if err != nil {
			return err
		}

		if caption != "" && (item.Kind != "file" || item.Purpose != "message") {
			return ValidationError{map[string]string{"caption": "not_allowed"}}
		}

		requestKey, err := keyFor(actor, "media-publish:"+meetingID, key)
		if err != nil {
			return err
		}

		// Keep the legacy hash for captionless publishes across a server upgrade.
		hash := requestHash(struct{ MediaID string }{id})
		if caption != "" {
			hash = requestHash(struct{ MediaID, Caption string }{id, caption})
		}

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
				} else if caption != "" {
					text = caption
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
					var payload mediaMessagePayload
					if err := json.Unmarshal(entry.Payload, &payload); err != nil {
						return ErrInvalidRecord
					}

					expectedText := item.FileName
					if item.Kind == "photo" {
						expectedText = "Фото"
					} else if caption != "" {
						expectedText = caption
					}

					if payload.Text != expectedText {
						return &Conflict{Code: "media_already_published"}
					}

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
