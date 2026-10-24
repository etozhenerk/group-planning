package httpapi

import (
	"context"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type preparationTaskResponse struct {
	ID          string                        `json:"id"`
	MeetingID   string                        `json:"meeting_id"`
	Title       string                        `json:"title"`
	Author      userResponse                  `json:"author"`
	Recipient   *userResponse                 `json:"recipient"`
	Assignee    *userResponse                 `json:"assignee"`
	UpdatedBy   userResponse                  `json:"updated_by"`
	State       meetings.PreparationTaskState `json:"state"`
	Revision    string                        `json:"revision"`
	CreatedAt   time.Time                     `json:"created_at"`
	UpdatedAt   time.Time                     `json:"updated_at"`
	CanAccept   bool                          `json:"can_accept"`
	CanDecline  bool                          `json:"can_decline"`
	CanCancel   bool                          `json:"can_cancel"`
	CanComplete bool                          `json:"can_complete"`
}

func (h meetingHandlers) preparationTaskDTO(ctx context.Context, view meetings.PreparationTaskView) (preparationTaskResponse, error) {
	task := view.Task
	result := preparationTaskResponse{
		ID: task.ID, MeetingID: task.MeetingID, Title: task.Title,
		Author:    userResponse{task.Author.ID, task.Author.Name},
		UpdatedBy: userResponse{task.UpdatedBy.ID, task.UpdatedBy.Name},
		State:     task.State, Revision: decimal(task.Revision), CreatedAt: task.CreatedAt, UpdatedAt: task.UpdatedAt,
		CanAccept: view.CanAccept, CanDecline: view.CanDecline, CanCancel: view.CanCancel, CanComplete: view.CanComplete,
	}
	if task.RecipientID != "" {
		users, err := h.identity.Users(ctx, []string{task.RecipientID})
		if err != nil {
			return preparationTaskResponse{}, err
		}

		user := users[task.RecipientID]
		result.Recipient = &userResponse{user.ID, user.DisplayName}
	}

	if task.Assignee != nil {
		result.Assignee = &userResponse{task.Assignee.ID, task.Assignee.Name}
	}

	return result, nil
}
