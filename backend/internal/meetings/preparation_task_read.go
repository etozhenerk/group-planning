package meetings

import "context"

// ReadPreparationTask requires current conversation access even for final tasks.
func (s *Service) ReadPreparationTask(ctx context.Context, actor Actor, meetingID, taskID string) (PreparationTaskView, error) {
	if err := checkActor(actor); err != nil {
		return PreparationTaskView{}, err
	}

	var result PreparationTaskView
	err := s.store.View(ctx, func(reader Reader) error {
		details, err := privateSnapshot(reader, meetingID, actor.ID)
		if err != nil {
			return err
		}

		task, err := reader.PreparationTask(taskID)
		if err != nil {
			return err
		}

		if task.MeetingID != meetingID {
			return ErrNotFound
		}

		result = preparationTaskView(details.Meeting, task, actor.ID)

		return nil
	})

	return result, err
}
