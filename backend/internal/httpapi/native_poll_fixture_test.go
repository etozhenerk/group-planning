package httpapi

import (
	"context"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

const nativePollMeetingID = "d3c50000-0000-4000-8000-000000000100"

func seedNativePollFixture(t *testing.T, store *memory.Store, service *identity.Service) iosFixtureCredential {
	t.Helper()
	owner := iosCredential(t, service, "poll-owner")
	seedIOSInvitation(t, store, service, owner, nativePollMeetingID,
		"UFBQUFBQUFBQUFBQUFBQUA", "День без времени",
		"d3c50000-0000-4000-8000-000000000101", "d3c50000-0000-4000-8000-000000000102")
	if err := store.Update(context.Background(), func(writer meetings.Writer) error {
		meeting, err := writer.Meeting(nativePollMeetingID)
		if err != nil {
			return err
		}

		meeting.StartsAt = nil
		meeting.StartsOn = "2026-10-25"

		return writer.SaveMeeting(meeting)
	}); err != nil {
		t.Fatal(err)
	}

	return owner
}

func verifyNativePollFixture(t *testing.T, store *memory.Store) {
	t.Helper()
	if err := store.View(context.Background(), func(reader meetings.Reader) error {
		meeting, err := reader.Meeting(nativePollMeetingID)
		if err != nil {
			return err
		}

		if meeting.StartsOn != "2026-10-26" || meeting.StartsAt != nil {
			t.Errorf("native vote did not apply civil day without introducing a time: %s", meeting.StartsOn)
		}

		polls, err := reader.DatePolls()
		if err != nil {
			return err
		}

		applied := 0
		for _, poll := range polls {
			if poll.MeetingID == nativePollMeetingID && poll.State == meetings.PollApplied {
				applied++
			}
		}

		if applied != 1 {
			t.Errorf("expected one applied native poll, got %d", applied)
		}

		return nil
	}); err != nil {
		t.Fatal(err)
	}
}
