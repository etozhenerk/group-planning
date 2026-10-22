package meetings

import (
	"context"
	"strings"
	"time"
)

// Field distinguishes an omitted patch field from a present null/empty value.
type Field struct {
	Present bool
	Value   string
}

// UpdateInput contains only editable settings, with explicit presence per field.
type UpdateInput struct {
	Title, Description, StartsAt, Timezone, Place, StartsOn Field
	ExpectedRevision                                        uint64
}

// Update preserves the instant when only the display timezone changes. Expensive
// zone lookup happens before the write; a changed snapshot forces a conflict.
func (s *Service) Update(ctx context.Context, actor Actor, id string, input UpdateInput, key string) (Details, error) {
	if err := checkActor(actor); err != nil {
		return Details{}, err
	}

	requestKey, err := keyFor(actor, "settings:"+id, key)
	if err != nil {
		return Details{}, err
	}

	if !input.Title.Present && !input.Description.Present && !input.StartsAt.Present && !input.StartsOn.Present && !input.Timezone.Present && !input.Place.Present {
		return Details{}, ValidationError{map[string]string{"changes": "required"}}
	}

	if input.Title.Present {
		input.Title.Value = strings.TrimSpace(input.Title.Value)
		if err := validateText("title", input.Title.Value, 120, true); err != nil {
			return Details{}, err
		}
	}

	if input.Description.Present {
		if err := validateText("description", input.Description.Value, 4000, false); err != nil {
			return Details{}, err
		}
	}

	if input.Place.Present {
		input.Place.Value = strings.TrimSpace(input.Place.Value)
		if err := validateText("place", input.Place.Value, 500, false); err != nil {
			return Details{}, err
		}
	}

	var original Details
	err = s.store.View(ctx, func(reader Reader) error {
		var err error
		original, err = privateSnapshot(reader, id, actor.ID)
		if err != nil {
			return err
		}

		if original.Meeting.OrganizerID != actor.ID {
			return ErrForbidden
		}

		return nil
	})
	if err != nil {
		return Details{}, err
	}

	date, instant, timezone, err := updatedSchedule(original.Meeting, input)
	if err != nil {
		return Details{}, err
	}

	if input.StartsAt.Present && instant != nil {
		input.StartsAt.Value = instant.Format(time.RFC3339Nano)
	}

	hash := requestHash(input)
	var result Details
	err = s.update(ctx, func(writer Writer) error {
		current, err := privateSnapshot(writer, id, actor.ID)
		if err != nil {
			return err
		}

		if current.Meeting.OrganizerID != actor.ID {
			return ErrForbidden
		}

		_, exists, err := s.receipt(writer, requestKey, hash)
		if err != nil {
			return err
		}

		if exists {
			result = current
			return nil
		}

		if current.Meeting.Revision != input.ExpectedRevision || current.Meeting.Revision != original.Meeting.Revision {
			return &Conflict{Code: "meeting_revision_conflict", Current: &current}
		}

		meeting := current.Meeting
		meeting.StartsOn = date
		meeting.StartsAt = instant
		meeting.Timezone = timezone

		if input.Title.Present {
			meeting.Title = input.Title.Value
		}

		if input.Description.Present {
			meeting.Description = input.Description.Value
		}

		if input.Timezone.Present {
			meeting.Timezone = input.Timezone.Value
		}

		if input.Place.Present {
			meeting.Place = input.Place.Value
		}

		changed := meeting.Title != current.Meeting.Title || meeting.Description != current.Meeting.Description || meeting.Timezone != current.Meeting.Timezone || meeting.Place != current.Meeting.Place || !sameInstant(meeting.StartsAt, current.Meeting.StartsAt) || meeting.StartsOn != current.Meeting.StartsOn
		if changed {
			meeting.Revision, err = increment(meeting.Revision)
			if err != nil {
				return err
			}

			if meeting.Timezone != current.Meeting.Timezone || !sameInstant(meeting.StartsAt, current.Meeting.StartsAt) || meeting.StartsOn != current.Meeting.StartsOn {
				if err := s.schedule(writer, &meeting); err != nil {
					return err
				}
			}

			if (input.StartsOn.Present || input.StartsAt.Present || input.Timezone.Present) && calendarDay(meeting) != calendarDay(current.Meeting) {
				if err := s.cancelDatePolls(writer, meeting); err != nil {
					return err
				}
			}

			if err := writer.SaveMeeting(meeting); err != nil {
				return err
			}

			if _, err := s.entry(writer, id, "meeting_updated", actor, struct {
				Previous any `json:"previous"`
				Current  any `json:"current"`
			}{meetingEvent(current.Meeting), meetingEvent(meeting)}, ""); err != nil {
				return err
			}

			if current.Meeting.StartsAt != nil && meeting.StartsAt == nil {
				if _, err := s.entry(writer, id, "meeting_time_unspecified", botActor(), meetingEvent(meeting), ""); err != nil {
					return err
				}
			}
		}

		if err := s.remember(writer, requestKey, hash, id); err != nil {
			return err
		}

		result, err = snapshot(writer, meeting, actor.ID)

		return err
	})

	return result, err
}

func sameInstant(a, b *time.Time) bool {
	if a == nil || b == nil {
		return a == nil && b == nil
	}

	return a.Equal(*b)
}
