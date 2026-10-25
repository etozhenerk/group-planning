package postgres

import "github.com/etozhenerk/group-planning/backend/internal/meetings"

func (tx *transaction) Cover(id string) (meetings.Cover, error) {
	return one[meetings.Cover](tx, "SELECT document FROM meeting_covers WHERE meeting_id=$1", id)
}

func (tx *transaction) SaveCover(value meetings.Cover) error {
	if value.MeetingID == "" || value.Version == "" || len(value.Data) == 0 {
		return meetings.ErrInvalidRecord
	}

	if _, err := tx.Meeting(value.MeetingID); err != nil {
		return err
	}

	return tx.save(value, `INSERT INTO meeting_covers(meeting_id,document) VALUES($1,$2)
		ON CONFLICT(meeting_id) DO UPDATE SET document=EXCLUDED.document`, value.MeetingID)
}

func (tx *transaction) DeleteCover(id string) error {
	_, err := tx.exec("DELETE FROM meeting_covers WHERE meeting_id=$1", id)
	return err
}

func (tx *transaction) DatePoll(id string) (meetings.DatePoll, error) {
	return one[meetings.DatePoll](tx, "SELECT document FROM date_polls WHERE id=$1", id)
}

func (tx *transaction) DatePolls() ([]meetings.DatePoll, error) {
	return many[meetings.DatePoll](tx, "SELECT document FROM date_polls ORDER BY id")
}

func (tx *transaction) SaveDatePoll(value meetings.DatePoll) error {
	if value.ID == "" {
		return meetings.ErrInvalidRecord
	}

	if _, err := tx.Meeting(value.MeetingID); err != nil {
		return err
	}

	return tx.save(value, `INSERT INTO date_polls(id,meeting_id,document) VALUES($1,$2,$3)
		ON CONFLICT(id) DO UPDATE SET meeting_id=EXCLUDED.meeting_id,document=EXCLUDED.document`, value.ID, value.MeetingID)
}

func (tx *transaction) PlacePoll(id string) (meetings.PlacePoll, error) {
	return one[meetings.PlacePoll](tx, "SELECT document FROM place_polls WHERE id=$1", id)
}

func (tx *transaction) PlacePolls() ([]meetings.PlacePoll, error) {
	return many[meetings.PlacePoll](tx, "SELECT document FROM place_polls ORDER BY id")
}

func (tx *transaction) SavePlacePoll(value meetings.PlacePoll) error {
	if value.ID == "" {
		return meetings.ErrInvalidRecord
	}

	if _, err := tx.Meeting(value.MeetingID); err != nil {
		return err
	}

	return tx.save(value, `INSERT INTO place_polls(id,meeting_id,document) VALUES($1,$2,$3)
		ON CONFLICT(id) DO UPDATE SET meeting_id=EXCLUDED.meeting_id,document=EXCLUDED.document`, value.ID, value.MeetingID)
}

func (tx *transaction) PreparationTask(id string) (meetings.PreparationTask, error) {
	return one[meetings.PreparationTask](tx, "SELECT document FROM preparation_tasks WHERE id=$1", id)
}

func (tx *transaction) PreparationTasks(id string) ([]meetings.PreparationTask, error) {
	return many[meetings.PreparationTask](tx, "SELECT document FROM preparation_tasks WHERE meeting_id=$1 ORDER BY id", id)
}

func (tx *transaction) SavePreparationTask(value meetings.PreparationTask) error {
	if value.ID == "" {
		return meetings.ErrInvalidRecord
	}

	if _, err := tx.Meeting(value.MeetingID); err != nil {
		return err
	}

	return tx.save(value, `INSERT INTO preparation_tasks(id,meeting_id,document) VALUES($1,$2,$3)
		ON CONFLICT(id) DO UPDATE SET meeting_id=EXCLUDED.meeting_id,document=EXCLUDED.document`, value.ID, value.MeetingID)
}
