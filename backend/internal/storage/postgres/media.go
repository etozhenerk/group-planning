package postgres

import "github.com/etozhenerk/group-planning/backend/internal/meetings"

func (tx *transaction) Media(id string) (meetings.Media, error) {
	return one[meetings.Media](tx, "SELECT document FROM meeting_media WHERE id=$1", id)
}

func (tx *transaction) MeetingMedia(id string) ([]meetings.Media, error) {
	return many[meetings.Media](tx, "SELECT document FROM meeting_media WHERE meeting_id=$1 ORDER BY id", id)
}

func (tx *transaction) AllMedia() ([]meetings.Media, error) {
	return many[meetings.Media](tx, "SELECT document FROM meeting_media ORDER BY id")
}

func (tx *transaction) SaveMedia(value meetings.Media) error {
	if value.ID == "" || value.MeetingID == "" || value.UploadedBy.ID == "" || value.DeclaredSize <= 0 {
		return meetings.ErrInvalidRecord
	}

	return tx.save(value, `INSERT INTO meeting_media(id,meeting_id,document) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET document=EXCLUDED.document`, value.ID, value.MeetingID)
}

func (tx *transaction) DeleteMedia(id string) error {
	_, err := tx.exec("DELETE FROM meeting_media WHERE id=$1", id)
	return err
}
