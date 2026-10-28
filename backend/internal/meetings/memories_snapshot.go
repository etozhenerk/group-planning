package meetings

import "context"

// MemorySnapshot fixes the full published album in one authorized store view.
// Later uploads are deliberately excluded from this export attempt.
func (s *Service) MemorySnapshot(ctx context.Context, actor Actor, id string) ([]Media, error) {
	if err := checkActor(actor); err != nil {
		return nil, err
	}

	photos := []Media{}
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

		for _, item := range items {
			if item.Purpose == "memory" && item.Kind == "photo" && item.Status == "published" {
				photos = append(photos, item)
			}
		}

		sortMedia(photos)

		return nil
	})

	return photos, err
}

// CheckMemoryAccess checks current membership and album availability without
// enumerating its photos, for export leases and ongoing downloads.
func (s *Service) CheckMemoryAccess(ctx context.Context, actor Actor, id string) error {
	if err := checkActor(actor); err != nil {
		return err
	}

	return s.store.View(ctx, func(r Reader) error {
		details, err := chatSnapshot(r, id, actor.ID)
		if err != nil {
			return err
		}

		return mediaPurposeAllowed(details.Meeting, "memory")
	})
}
