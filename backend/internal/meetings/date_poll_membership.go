package meetings

func (s *Service) updateDatePollMembership(writer Writer, meeting Meeting) error {
	polls, err := writer.DatePolls()
	if err != nil {
		return err
	}

	for _, poll := range polls {
		if poll.MeetingID != meeting.ID || poll.State != PollOpen || !s.now().Before(poll.ClosesAt) {
			continue
		}

		if err := s.evaluateDatePoll(writer, meeting, &poll, false); err != nil {
			return err
		}

		if err := writer.SaveDatePoll(poll); err != nil {
			return err
		}
	}

	return nil
}

func (s *Service) cancelDatePolls(writer Writer, meeting Meeting) error {
	polls, err := writer.DatePolls()
	if err != nil {
		return err
	}

	for _, poll := range polls {
		if poll.MeetingID != meeting.ID || !poll.active() {
			continue
		}

		if poll.State == PollOpen {
			poll.FinalEligible, err = pollElectorate(writer, meeting)
			if err != nil {
				return err
			}
		}

		closed := s.now().UTC()
		poll.ClosedAt, poll.State = &closed, PollCancelled
		poll.CloseJob.State = TransitionCompleted
		poll.Revision, err = increment(poll.Revision)
		if err != nil {
			return err
		}

		if err := writer.SaveDatePoll(poll); err != nil {
			return err
		}

		if _, err := s.entry(writer, meeting.ID, "date_poll_cancelled", botActor(), map[string]string{"poll_id": poll.ID}, ""); err != nil {
			return err
		}
	}

	return nil
}
