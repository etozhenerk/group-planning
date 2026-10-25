package meetings

import (
	"context"
	"errors"
	"strings"
)

// CreatePreparationTaskInput proposes work to one participant or to anyone when RecipientID is empty.
type CreatePreparationTaskInput struct {
	Title, RecipientID string
}

// CreatePreparationTask records a proposal without assigning responsibility.
func (s *Service) CreatePreparationTask(ctx context.Context, actor Actor, meetingID string, input CreatePreparationTaskInput, key string) (PreparationTaskView, error) {
	if err := checkActor(actor); err != nil {
		return PreparationTaskView{}, err
	}

	requestKey, err := keyFor(actor, "preparation-task:create:"+meetingID, key)
	if err != nil {
		return PreparationTaskView{}, err
	}

	input.Title = strings.TrimSpace(input.Title)
	if err := validateText("title", input.Title, 200, true); err != nil {
		return PreparationTaskView{}, err
	}

	if input.RecipientID != "" {
		input.RecipientID, err = ParseUUID(input.RecipientID)
		if err != nil {
			return PreparationTaskView{}, ValidationError{map[string]string{"recipient_id": "invalid"}}
		}
	}

	hash := requestHash(input)
	var result PreparationTaskView
	err = s.updateAs(ctx, actor, func(writer Writer) error {
		details, err := privateSnapshot(writer, meetingID, actor.ID)
		if err != nil {
			return err
		}

		tasks, err := writer.PreparationTasks(meetingID)
		if err != nil {
			return err
		}

		for _, task := range tasks {
			if task.Author.ID == actor.ID && task.CreationRequestID == requestKey.Key {
				if task.CreationRequestHash != hash {
					return ErrIdempotencyConflict
				}

				result = preparationTaskView(details.Meeting, task, actor.ID)

				return nil
			}
		}

		if input.RecipientID != "" {
			if _, err := privateSnapshot(writer, meetingID, input.RecipientID); err != nil {
				if errors.Is(err, ErrForbidden) {
					return ValidationError{map[string]string{"recipient_id": "unavailable"}}
				}

				return err
			}
		}

		now := s.now().UTC()
		task := PreparationTask{
			ID: randomUUID(), MeetingID: meetingID, Title: input.Title, RecipientID: input.RecipientID,
			Author: actor, UpdatedBy: actor, State: TaskOffered, Revision: 1,
			CreatedAt: now, UpdatedAt: now,
			CreationRequestID: requestKey.Key, CreationRequestHash: hash,
		}
		if err := writer.SavePreparationTask(task); err != nil {
			return err
		}

		if err := s.preparationTaskEntry(writer, task, actor, "preparation_task_created"); err != nil {
			return err
		}

		result = preparationTaskView(details.Meeting, task, actor.ID)

		return nil
	})

	return result, err
}

func (s *Service) preparationTaskEntry(writer Writer, task PreparationTask, actor Actor, kind string) error {
	_, err := s.entry(writer, task.MeetingID, kind, actor, map[string]string{"task_id": task.ID, "title": task.Title}, "")
	return err
}
