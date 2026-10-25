package meetings

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"slices"
	"strings"
	"time"
)

// MediaBytes only exposes published content after current membership checks.
func (s *Service) MediaBytes(ctx context.Context, actor Actor, meetingID, id string) (Media, []byte, error) {
	if err := checkActor(actor); err != nil {
		return Media{}, nil, err
	}

	if s.media == nil {
		return Media{}, nil, ErrMediaUnavailable
	}

	var item Media
	check := func(r Reader) error {
		if _, err := privateSnapshot(r, meetingID, actor.ID); err != nil {
			return err
		}

		current, err := r.Media(id)
		if err != nil {
			return err
		}

		if current.MeetingID != meetingID || current.Status != "published" {
			return ErrNotFound
		}

		item = current

		return nil
	}
	if err := s.store.View(ctx, check); err != nil {
		return Media{}, nil, err
	}

	data, err := s.media.Get(ctx, item.BlobKey)
	if err != nil {
		return Media{}, nil, err
	}

	// Do not return bytes when access was revoked during filesystem/object I/O.
	if err := s.store.View(ctx, check); err != nil {
		return Media{}, nil, err
	}

	return item, data, nil
}

type memoryCursor struct {
	MeetingID, ID string
	CreatedAt     time.Time
}

// Memories returns explicitly selected album photos, in stable insertion order.
func (s *Service) Memories(ctx context.Context, actor Actor, id string, limit int, cursor string) (MemoriesPage, error) {
	if err := checkActor(actor); err != nil {
		return MemoriesPage{}, err
	}

	if limit < 1 || limit > 100 {
		return MemoriesPage{}, ValidationError{map[string]string{"limit": "invalid"}}
	}

	position := memoryCursor{}
	if cursor != "" {
		data, err := base64.RawURLEncoding.DecodeString(cursor)
		if err != nil || len(data) > 512 || json.Unmarshal(data, &position) != nil || position.MeetingID != id || position.ID == "" || position.CreatedAt.IsZero() {
			return MemoriesPage{}, ValidationError{map[string]string{"cursor": "invalid"}}
		}
	}

	result := MemoriesPage{Photos: []Media{}}
	err := s.store.View(ctx, func(r Reader) error {
		details, err := privateSnapshot(r, id, actor.ID)
		if err != nil {
			return err
		}

		if err := mediaPurposeAllowed(details.Meeting, "memory"); err != nil {
			return err
		}

		items, err := r.MeetingMedia(id)
		if err != nil {
			return err
		}

		sortMedia(items)
		for _, item := range items {
			if item.Purpose != "memory" || item.Status != "published" {
				continue
			}

			if cursor != "" && (item.CreatedAt.Before(position.CreatedAt) || (item.CreatedAt.Equal(position.CreatedAt) && item.ID <= position.ID)) {
				continue
			}

			if len(result.Photos) == limit {
				last := result.Photos[limit-1]
				data, err := json.Marshal(memoryCursor{id, last.ID, last.CreatedAt})
				if err != nil {
					return err
				}

				result.NextCursor = base64.RawURLEncoding.EncodeToString(data)
				break
			}

			result.Photos = append(result.Photos, item)
		}

		return nil
	})

	return result, err
}

func sortMedia(items []Media) {
	slices.SortFunc(items, func(a, b Media) int {
		if order := a.CreatedAt.Compare(b.CreatedAt); order != 0 {
			return order
		}

		return strings.Compare(a.ID, b.ID)
	})
}

func mediaSummary(r Reader, details *Details) error {
	items, err := r.MeetingMedia(details.Meeting.ID)
	if err != nil {
		return err
	}

	sortMedia(items)
	details.MemoryPreview = []Media{}
	for _, item := range items {
		if item.Purpose == "memory" && item.Status == "published" {
			details.MemoryPhotoCount++
			if len(details.MemoryPreview) < 3 {
				details.MemoryPreview = append(details.MemoryPreview, item)
			}
		}
	}

	return nil
}

// PruneMedia removes unpublished reservations older than a day. Published album
// and chat history are retained; binary deletion happens after the transaction.
func (s *Service) PruneMedia(ctx context.Context) error {
	if s.media == nil {
		return nil
	}

	keys := []string{}
	live := []string{}
	err := s.update(ctx, func(w Writer) error {
		items, err := w.AllMedia()
		if err != nil {
			return err
		}

		for _, item := range items {
			if item.Status != "published" && !s.now().Before(item.CreatedAt.Add(24*time.Hour)) {
				if err := w.DeleteMedia(item.ID); err != nil {
					return err
				}

				if item.BlobKey != "" {
					keys = append(keys, item.BlobKey)
				}
			} else if item.BlobKey != "" {
				live = append(live, item.BlobKey)
			}
		}

		return nil
	})
	if err != nil {
		return err
	}

	for _, key := range keys {
		if err := s.media.Delete(ctx, key); err != nil {
			return err
		}
	}

	return s.media.Prune(ctx, live, s.now().Add(-time.Hour))
}
