package meetings

import (
	"context"
	"slices"
	"time"
)

// PollOptionView omits other people's votes until the visibility rules allow them.
type PollOptionView struct {
	Option DateOption
	Votes  *int
	Voters []Actor
}

// DatePollView contains only what the current caller may see.
type DatePollView struct {
	ID, MeetingID                      string
	Author                             Actor
	Settings                           PollSettings
	Options                            []PollOptionView
	State                              PollState
	Revision, MyVoteRevision           uint64
	MyOptionIDs                        []string
	CreatedAt, ClosesAt                time.Time
	ClosedAt                           *time.Time
	Leaders                            []string
	AppliedOptionID                    string
	CanVote, CanAddOptions, CanResolve bool
}

// ReadDatePoll checks chat access before projecting any private poll data.
func (s *Service) ReadDatePoll(ctx context.Context, actor Actor, meetingID, id string) (DatePollView, error) {
	if err := checkActor(actor); err != nil {
		return DatePollView{}, err
	}

	var result DatePollView
	err := s.store.View(ctx, func(reader Reader) error {
		details, err := privateSnapshot(reader, meetingID, actor.ID)
		if err != nil {
			return err
		}

		poll, err := reader.DatePoll(id)
		if err != nil {
			return err
		}

		if poll.MeetingID != meetingID {
			return ErrNotFound
		}

		result, err = s.pollView(reader, details.Meeting, poll, actor.ID)

		return err
	})

	return result, err
}

func pollElectorate(reader Reader, meeting Meeting) ([]string, error) {
	responses, err := reader.RSVPs(meeting.ID)
	if err != nil {
		return nil, err
	}

	ids := []string{meeting.OrganizerID}
	for _, response := range responses {
		if response.Answer == Going && response.UserID != meeting.OrganizerID {
			ids = append(ids, response.UserID)
		}
	}

	slices.Sort(ids)

	return ids, nil
}

func (s *Service) pollView(reader Reader, meeting Meeting, poll DatePoll, userID string) (DatePollView, error) {
	eligible := poll.FinalEligible
	if poll.State == PollOpen {
		var err error
		eligible, err = pollElectorate(reader, meeting)
		if err != nil {
			return DatePollView{}, err
		}
	}

	own := poll.Ballots[userID]
	open := poll.State == PollOpen && s.now().Before(poll.ClosesAt)
	visible := !poll.Settings.HideResults || poll.State != PollOpen && poll.State != PollCancelled
	view := DatePollView{
		ID:              poll.ID,
		MeetingID:       poll.MeetingID,
		Author:          poll.Author,
		Settings:        poll.Settings,
		State:           poll.State,
		Revision:        poll.Revision,
		MyVoteRevision:  own.Revision,
		MyOptionIDs:     append([]string{}, own.OptionIDs...),
		Options:         []PollOptionView{},
		CreatedAt:       poll.CreatedAt,
		ClosesAt:        poll.ClosesAt,
		ClosedAt:        poll.ClosedAt,
		Leaders:         append([]string{}, poll.Leaders...),
		AppliedOptionID: poll.AppliedOptionID,
		CanVote:         open && (poll.Settings.AllowRevoting || own.Revision == 0),
		CanAddOptions:   open && poll.Settings.AllowNewOptions && len(poll.Options) < 20,
		CanResolve:      meeting.OrganizerID == userID && (poll.State == PollAwaitingChoice || poll.State == PollAwaitingTime),
	}
	for _, option := range poll.Options {
		item := PollOptionView{Option: option}
		if visible {
			count := 0
			if !poll.Settings.Anonymous {
				item.Voters = []Actor{}
			}

			for _, id := range eligible {
				ballot := poll.Ballots[id]
				if slices.Contains(ballot.OptionIDs, option.ID) {
					count++
					if !poll.Settings.Anonymous {
						item.Voters = append(item.Voters, ballot.Actor)
					}
				}
			}

			item.Votes = &count
		}

		view.Options = append(view.Options, item)
	}

	return view, nil
}
