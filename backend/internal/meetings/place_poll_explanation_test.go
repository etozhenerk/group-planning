package meetings_test

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestPlacePollExplanationSurvivesRetriesAndClosure(t *testing.T) {
	f, actors := pollCompany(t)
	input := meetings.CreatePlacePollInput{Place: "У Саши", ClosesAt: time.Unix(f.clock.Load(), 0).Add(time.Hour).Format(time.RFC3339), Explanation: "  Есть большой стол  "}
	poll, err := f.app.CreatePlacePoll(ctx, owner, f.created.Details.Meeting.ID, input, key(1800))
	must(t, err)
	if poll.Explanation != "Есть большой стол" {
		t.Fatal("explanation not normalized")
	}

	input.Explanation = poll.Explanation
	retry, err := f.app.CreatePlacePoll(ctx, owner, poll.MeetingID, input, key(1800))
	must(t, err)
	if retry.ID != poll.ID || retry.Explanation != poll.Explanation {
		t.Fatal("retry changed explanation")
	}

	input.Explanation = "Другой текст"
	_, err = f.app.CreatePlacePoll(ctx, owner, poll.MeetingID, input, key(1800))
	if !errors.Is(err, meetings.ErrIdempotencyConflict) {
		t.Fatalf("changed explanation accepted: %v", err)
	}

	view, err := f.app.ReadPlacePoll(ctx, actors[1], poll.MeetingID, poll.ID)
	must(t, err)
	if view.Explanation != poll.Explanation {
		t.Fatal("participant cannot read explanation")
	}

	f.clock.Store(poll.ClosesAt.Unix())
	must(t, f.app.ClosePlacePoll(ctx, poll.ID))
	view, err = f.app.ReadPlacePoll(ctx, owner, poll.MeetingID, poll.ID)
	must(t, err)
	if view.Explanation != poll.Explanation || view.State != meetings.PlacePollRejected {
		t.Fatal("closing removed explanation")
	}
}

func TestPlacePollLegacyRetryHashRemainsCompatible(t *testing.T) {
	f, _ := pollCompany(t)
	poll := newPlacePoll(t, f)
	legacy := struct{ Place, ClosesAt string }{poll.Place, poll.ClosesAt.UTC().Format(time.RFC3339Nano)}
	data, err := json.Marshal(legacy)
	must(t, err)
	hash := sha256.Sum256(data)
	must(t, f.store.Update(ctx, func(w meetings.Writer) error {
		stored, err := w.PlacePoll(poll.ID)
		if err != nil {
			return err
		}

		stored.CreationRequestHash = hex.EncodeToString(hash[:])

		return w.SavePlacePoll(stored)
	}))
	retry, err := f.app.CreatePlacePoll(ctx, owner, poll.MeetingID, meetings.CreatePlacePollInput{Place: legacy.Place, ClosesAt: legacy.ClosesAt, Explanation: "  "}, key(900))
	must(t, err)
	if retry.ID != poll.ID || retry.Explanation != "" {
		t.Fatal("legacy repeat changed result")
	}
}
