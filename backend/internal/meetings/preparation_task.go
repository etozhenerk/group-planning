package meetings

import "time"

// PreparationTaskState distinguishes a proposal from explicitly accepted work.
type PreparationTaskState string

const (
	TaskOffered   PreparationTaskState = "offered"
	TaskAccepted  PreparationTaskState = "accepted"
	TaskCompleted PreparationTaskState = "completed"
	TaskDeclined  PreparationTaskState = "declined"
	TaskCancelled PreparationTaskState = "cancelled"
)

// PreparationAction is a deliberate participant decision, never an assignment by inference.
type PreparationAction string

const (
	TaskAccept   PreparationAction = "accept"
	TaskDecline  PreparationAction = "decline"
	TaskCancel   PreparationAction = "cancel"
	TaskComplete PreparationAction = "complete"
)

// PreparationTask is private storage state. RecipientID is resolved by the identity boundary.
type PreparationTask struct {
	ID, MeetingID, Title, RecipientID      string
	Author, UpdatedBy                      Actor
	Assignee                               *Actor
	State                                  PreparationTaskState
	Revision                               uint64
	CreatedAt, UpdatedAt                   time.Time
	CreationRequestID, CreationRequestHash string
}

// PreparationTaskView contains the task and actions permitted to its current reader.
type PreparationTaskView struct {
	Task                                          PreparationTask
	CanAccept, CanDecline, CanCancel, CanComplete bool
}

func preparationTaskView(meeting Meeting, task PreparationTask, actorID string) PreparationTaskView {
	view := PreparationTaskView{Task: task}
	offered := task.State == TaskOffered
	accepted := task.State == TaskAccepted
	assignee := task.Assignee != nil && task.Assignee.ID == actorID
	view.CanAccept = offered && (task.RecipientID == "" || task.RecipientID == actorID)
	view.CanDecline = (offered && task.RecipientID == actorID) || (accepted && assignee)
	view.CanCancel = (offered || accepted) && (task.Author.ID == actorID || meeting.OrganizerID == actorID)
	view.CanComplete = accepted && assignee

	return view
}
