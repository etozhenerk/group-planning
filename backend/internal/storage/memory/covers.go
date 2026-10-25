package memory

import "github.com/etozhenerk/group-planning/backend/internal/meetings"

func (tx *transaction) Cover(meetingID string) (meetings.Cover, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.Cover{}, err
	}

	cover, ok := tx.data.covers[meetingID]
	if !ok {
		return meetings.Cover{}, meetings.ErrNotFound
	}

	return cloneCover(cover), nil
}

func (tx *transaction) SaveCover(cover meetings.Cover) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	if cover.MeetingID == "" || cover.Version == "" || len(cover.Data) == 0 {
		return meetings.ErrInvalidRecord
	}

	if _, ok := tx.data.meetings[cover.MeetingID]; !ok {
		return meetings.ErrNotFound
	}

	tx.data.covers[cover.MeetingID] = cloneCover(cover)

	return nil
}

func (tx *transaction) DeleteCover(meetingID string) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	delete(tx.data.covers, meetingID)

	return nil
}

func cloneCover(cover meetings.Cover) meetings.Cover {
	cover.Data = append([]byte(nil), cover.Data...)
	return cover
}
