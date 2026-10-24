package meetings

func (s *Service) freezePlacePoll(writer Writer, meeting Meeting, poll *PlacePoll) error {
	eligible, err := pollElectorate(writer, meeting)
	if err != nil {
		return err
	}

	poll.FinalEligible = eligible
	closed := s.now().UTC()
	poll.ClosedAt = &closed
	poll.CloseJob.State = TransitionCompleted
	poll.Revision, err = increment(poll.Revision)

	return err
}

func (s *Service) finishPlacePoll(writer Writer, meeting Meeting, poll *PlacePoll) error {
	if err := s.freezePlacePoll(writer, meeting, poll); err != nil {
		return err
	}

	yes, no := placePollCounts(*poll, poll.FinalEligible)
	poll.State = PlacePollRejected
	if yes > no {
		poll.State = PlacePollApplied
	}

	if _, err := s.entry(writer, meeting.ID, "place_poll_result", botActor(), map[string]any{
		"poll_id": poll.ID, "state": poll.State, "votes_for": yes, "votes_against": no,
	}, ""); err != nil {
		return err
	}

	if poll.State != PlacePollApplied || meeting.Place == poll.Place {
		return nil
	}

	previous := meeting
	meeting.Place = poll.Place
	var err error
	meeting.Revision, err = increment(meeting.Revision)
	if err != nil {
		return err
	}

	if err := writer.SaveMeeting(meeting); err != nil {
		return err
	}

	_, err = s.entry(writer, meeting.ID, "meeting_updated", botActor(), struct {
		Previous any `json:"previous"`
		Current  any `json:"current"`
	}{meetingEvent(previous), meetingEvent(meeting)}, "")

	return err
}

func (s *Service) cancelPlacePolls(writer Writer, meeting Meeting) error {
	polls, err := writer.PlacePolls()
	if err != nil {
		return err
	}

	for _, poll := range polls {
		if poll.MeetingID != meeting.ID || poll.State != PlacePollOpen {
			continue
		}

		if err := s.freezePlacePoll(writer, meeting, &poll); err != nil {
			return err
		}

		poll.State = PlacePollCancelled
		if err := writer.SavePlacePoll(poll); err != nil {
			return err
		}

		if _, err := s.entry(writer, meeting.ID, "place_poll_cancelled", botActor(), map[string]string{"poll_id": poll.ID}, ""); err != nil {
			return err
		}
	}

	return nil
}
