package meetings

import "context"

// PreparationActionInput binds an explicit decision to the observed task revision.
type PreparationActionInput struct {
	Action           PreparationAction
	ExpectedRevision uint64
}

// ActOnPreparationTask writes the decision and its feed entry in one transaction.
func (s *Service) ActOnPreparationTask(ctx context.Context, actor Actor, meetingID, taskID string, input PreparationActionInput, key string) (PreparationTaskView, error) {
	if err := checkActor(actor); err != nil {
		return PreparationTaskView{}, err
	}

	requestKey, err := keyFor(actor, "preparation-task:action:"+taskID, key)
	if err != nil {
		return PreparationTaskView{}, err
	}

	hash := requestHash(input)
	var result PreparationTaskView
	err = s.update(ctx, func(writer Writer) error {
		details, err := privateSnapshot(writer, meetingID, actor.ID)
		if err != nil {
			return err
		}

		task, err := writer.PreparationTask(taskID)
		if err != nil {
			return err
		}

		if task.MeetingID != meetingID {
			return ErrNotFound
		}

		_, exists, err := s.receipt(writer, requestKey, hash)
		if err != nil {
			return err
		}

		if !exists {
			next, err := preparationTaskDecision(preparationTaskView(details.Meeting, task, actor.ID), input)
			if err != nil {
				return err
			}

			task.Revision, err = increment(task.Revision)
			if err != nil {
				return err
			}

			task.State, task.UpdatedBy, task.UpdatedAt = next, actor, s.now().UTC()
			if input.Action == TaskAccept {
				task.Assignee = &actor
			}

			if err := writer.SavePreparationTask(task); err != nil {
				return err
			}

			if err := s.preparationTaskEntry(writer, task, actor, "preparation_task_"+string(next)); err != nil {
				return err
			}

			if err := s.remember(writer, requestKey, hash, task.ID); err != nil {
				return err
			}
		}

		result = preparationTaskView(details.Meeting, task, actor.ID)

		return nil
	})

	return result, err
}

func preparationTaskDecision(view PreparationTaskView, input PreparationActionInput) (PreparationTaskState, error) {
	if view.Task.Revision != input.ExpectedRevision {
		return "", &Conflict{Code: "task_revision_conflict"}
	}

	var state PreparationTaskState
	var allowed, applicable bool
	switch input.Action {
	case TaskAccept:
		state, allowed, applicable = TaskAccepted, view.CanAccept, view.Task.State == TaskOffered
	case TaskDecline:
		state, allowed, applicable = TaskDeclined, view.CanDecline, view.Task.State == TaskOffered || view.Task.State == TaskAccepted
	case TaskCancel:
		state, allowed, applicable = TaskCancelled, view.CanCancel, view.Task.State == TaskOffered || view.Task.State == TaskAccepted
	case TaskComplete:
		state, allowed, applicable = TaskCompleted, view.CanComplete, view.Task.State == TaskAccepted
	default:
		return "", ValidationError{map[string]string{"action": "invalid"}}
	}

	if !applicable {
		return "", &Conflict{Code: "task_state_conflict"}
	}

	if !allowed {
		return "", ErrForbidden
	}

	return state, nil
}
