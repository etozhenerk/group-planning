package memory

import (
	"slices"
	"strings"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (tx *transaction) PreparationTask(id string) (meetings.PreparationTask, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return meetings.PreparationTask{}, err
	}

	task, ok := tx.data.preparationTasks[id]
	if !ok {
		return meetings.PreparationTask{}, meetings.ErrNotFound
	}

	return clonePreparationTask(task), nil
}

func (tx *transaction) PreparationTasks(meetingID string) ([]meetings.PreparationTask, error) {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(false); err != nil {
		return nil, err
	}

	result := []meetings.PreparationTask{}
	for _, task := range tx.data.preparationTasks {
		if task.MeetingID == meetingID {
			result = append(result, clonePreparationTask(task))
		}
	}

	slices.SortFunc(result, func(a, b meetings.PreparationTask) int { return strings.Compare(a.ID, b.ID) })

	return result, nil
}

func (tx *transaction) SavePreparationTask(task meetings.PreparationTask) error {
	tx.mu.Lock()
	defer tx.mu.Unlock()
	if err := tx.check(true); err != nil {
		return err
	}

	if task.ID == "" {
		return meetings.ErrInvalidRecord
	}

	if _, ok := tx.data.meetings[task.MeetingID]; !ok {
		return meetings.ErrNotFound
	}

	tx.data.preparationTasks[task.ID] = clonePreparationTask(task)

	return nil
}

func clonePreparationTask(task meetings.PreparationTask) meetings.PreparationTask {
	if task.Assignee != nil {
		assignee := *task.Assignee
		task.Assignee = &assignee
	}

	return task
}
