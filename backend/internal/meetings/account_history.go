package meetings

func (s *Service) removeAccountTasks(writer Writer, meeting Meeting, userID string) error {
	tasks, err := writer.PreparationTasks(meeting.ID)
	if err != nil {
		return err
	}

	for _, task := range tasks {
		involved := task.Author.ID == userID || task.UpdatedBy.ID == userID || task.RecipientID == userID || task.Assignee != nil && task.Assignee.ID == userID
		if !involved {
			continue
		}

		task.Author, task.UpdatedBy = removedActor(task.Author, userID), removedActor(task.UpdatedBy, userID)
		if task.Assignee != nil {
			actor := removedActor(*task.Assignee, userID)
			task.Assignee = &actor
		}

		cancel := task.State == TaskOffered && task.RecipientID == userID || task.State == TaskAccepted && task.Assignee != nil && task.Assignee.ID == userID
		task.Revision, err = increment(task.Revision)
		if err != nil {
			return err
		}

		if cancel {
			task.State, task.UpdatedBy, task.UpdatedAt = TaskCancelled, botActor(), s.now().UTC()
			if err := s.preparationTaskEntry(writer, task, botActor(), "preparation_task_cancelled"); err != nil {
				return err
			}
		}

		if err := writer.SavePreparationTask(task); err != nil {
			return err
		}
	}

	return nil
}

func (s *Service) removeAccountPolls(writer Writer, meeting Meeting, userID string) error {
	dates, err := writer.DatePolls()
	if err != nil {
		return err
	}

	for _, poll := range dates {
		if poll.MeetingID != meeting.ID {
			continue
		}

		_, voted := poll.Ballots[userID]
		if poll.Author.ID != userID && !voted {
			continue
		}

		poll.Author = removedActor(poll.Author, userID)
		if voted {
			if poll.State == PollOpen {
				delete(poll.Ballots, userID)
			} else {
				ballot := poll.Ballots[userID]
				ballot.Actor = removedActor(ballot.Actor, userID)
				poll.Ballots[userID] = ballot
			}
		}

		poll.Revision, err = increment(poll.Revision)
		if err != nil {
			return err
		}

		if err := writer.SaveDatePoll(poll); err != nil {
			return err
		}
	}

	places, err := writer.PlacePolls()
	if err != nil {
		return err
	}

	for _, poll := range places {
		if poll.MeetingID != meeting.ID {
			continue
		}

		_, voted := poll.Ballots[userID]
		if poll.Author.ID != userID && !voted {
			continue
		}

		poll.Author = removedActor(poll.Author, userID)
		if poll.State == PlacePollOpen {
			delete(poll.Ballots, userID)
		}

		poll.Revision, err = increment(poll.Revision)
		if err != nil {
			return err
		}

		if err := writer.SavePlacePoll(poll); err != nil {
			return err
		}
	}

	return nil
}
