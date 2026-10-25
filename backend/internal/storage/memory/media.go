package memory

import "github.com/etozhenerk/group-planning/backend/internal/meetings"

func (tx *transaction) Media(id string) (meetings.Media, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.Media{}, err
	}

	value, ok := tx.data.media[id]
	if !ok {
		return meetings.Media{}, meetings.ErrNotFound
	}

	return value, nil
}

func (tx *transaction) MeetingMedia(id string) ([]meetings.Media, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	result := []meetings.Media{}
	for _, item := range tx.data.media {
		if item.MeetingID == id {
			result = append(result, item)
		}
	}

	return result, nil
}

func (tx *transaction) AllMedia() ([]meetings.Media, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	result := make([]meetings.Media, 0, len(tx.data.media))
	for _, item := range tx.data.media {
		result = append(result, item)
	}

	return result, nil
}

func (tx *transaction) SaveMedia(value meetings.Media) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	if value.ID == "" || value.MeetingID == "" || value.UploadedBy.ID == "" || value.DeclaredSize <= 0 {
		return meetings.ErrInvalidRecord
	}

	if _, ok := tx.data.meetings[value.MeetingID]; !ok {
		return meetings.ErrNotFound
	}

	tx.data.media[value.ID] = value

	return nil
}

func (tx *transaction) DeleteMedia(id string) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	delete(tx.data.media, id)

	return nil
}
