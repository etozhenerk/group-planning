package meetings

import "context"

func (s *Service) mutateDatePoll(ctx context.Context, actor Actor, meetingID, pollID, operation, key string, input any, change func(Writer, Meeting, *DatePoll) error) (DatePollView, error) {
	if err := checkActor(actor); err != nil {
		return DatePollView{}, err
	}

	requestKey, err := keyFor(actor, "date-poll:"+operation+":"+pollID, key)
	if err != nil {
		return DatePollView{}, err
	}

	hash := requestHash(input)
	var result DatePollView
	err = s.update(ctx, func(writer Writer) error {
		details, err := privateSnapshot(writer, meetingID, actor.ID)
		if err != nil {
			return err
		}

		poll, err := writer.DatePoll(pollID)
		if err != nil {
			return err
		}

		if poll.MeetingID != meetingID {
			return ErrNotFound
		}

		_, exists, err := s.receipt(writer, requestKey, hash)
		if err != nil {
			return err
		}

		if !exists {
			if err := change(writer, details.Meeting, &poll); err != nil {
				return err
			}

			if err := writer.SaveDatePoll(poll); err != nil {
				return err
			}

			if err := s.remember(writer, requestKey, hash, pollID); err != nil {
				return err
			}
		}

		result, err = s.pollView(writer, details.Meeting, poll, actor.ID)

		return err
	})

	return result, err
}

func (s *Service) requireOpenPoll(poll DatePoll) error {
	if poll.State != PollOpen || !s.now().Before(poll.ClosesAt) {
		return &Conflict{Code: "date_poll_closed"}
	}

	return nil
}
