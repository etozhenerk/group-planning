package meetings

import "context"

// ReadCover checks the same current access as the conversation before returning pixels.
func (s *Service) ReadCover(ctx context.Context, actor Actor, meetingID, version string) (Cover, error) {
	if err := checkActor(actor); err != nil {
		return Cover{}, err
	}

	var result Cover
	err := s.store.View(ctx, func(reader Reader) error {
		details, err := privateSnapshot(reader, meetingID, actor.ID)
		if err != nil {
			return err
		}

		result, err = readCoverVersion(reader, details.Meeting, version)

		return err
	})

	return result, err
}

// ReadInvitationCover exposes only the image reachable through a valid invitation.
func (s *Service) ReadInvitationCover(ctx context.Context, token, version string) (Cover, error) {
	if !validInvitationToken(token) {
		return Cover{}, ErrNotFound
	}

	var result Cover
	err := s.store.View(ctx, func(reader Reader) error {
		invitation, err := reader.InvitationByToken(token)
		if err != nil {
			return err
		}

		meeting, err := reader.Meeting(invitation.MeetingID)
		if err != nil {
			return err
		}

		result, err = readCoverVersion(reader, meeting, version)

		return err
	})

	return result, err
}

func readCoverVersion(reader Reader, meeting Meeting, version string) (Cover, error) {
	if version == "" || meeting.CoverVersion != version {
		return Cover{}, ErrNotFound
	}

	cover, err := reader.Cover(meeting.ID)
	if err != nil {
		return Cover{}, err
	}

	if cover.Version != version {
		return Cover{}, ErrNotFound
	}

	return cover, nil
}
