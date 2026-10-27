package httpapi

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

const (
	chatReviewMeetingID = "cea00000-0000-4000-8000-000000000002"
	chatReviewVisualID  = "cea00000-0000-4000-8000-000000000001"
)

var chatReviewNow = time.Date(2026, 10, 27, 10, 0, 0, 0, time.UTC)

var chatReviewPeople = []struct {
	code, name string
	answer     meetings.Answer
}{
	{"sasha", "Саша", ""},
	{"lena", "Лена", meetings.Going},
	{"tim", "Тимофей", meetings.Going},
	{"masha", "Маша", meetings.Going},
	{"olya", "Оля", meetings.Maybe},
	{"dima", "Дима", meetings.NotGoing},
}

func chatReviewID(kind string, index int) string {
	return fmt.Sprintf("ce%s0000-0000-4000-8000-%012d", kind, index)
}

func chatReviewActor(index int) meetings.Actor {
	return meetings.Actor{ID: chatReviewID("b0", index+1), Name: chatReviewPeople[index].name}
}

// Seed snapshots have stable IDs; every subsequent user action uses the real API.
func seedChatReview(t *testing.T, store *memory.Store, identities *memory.Identity, media *memory.MediaContent) {
	t.Helper()
	ctx := context.Background()
	for i, person := range chatReviewPeople {
		user := identity.User{ID: chatReviewActor(i).ID, DisplayName: person.name, CreatedAt: chatReviewNow}
		if err := identities.Update(ctx, func(r identity.Records) error {
			return r.PutUser("yandex:chat-review-"+person.code, user)
		}); err != nil {
			t.Fatal(err)
		}
	}

	photo := chatReviewPNG(t, false)
	digest := fmt.Sprintf("%x", sha256.Sum256(photo))
	if err := media.Put(ctx, "chat-review-photo", photo); err != nil {
		t.Fatal(err)
	}

	start := time.Date(2026, 10, 31, 16, 0, 0, 0, time.UTC)
	if err := store.Update(ctx, func(w meetings.Writer) error {
		meeting := meetings.Meeting{
			ID: chatReviewMeetingID, OrganizerID: chatReviewActor(0).ID,
			Title: "Вечер без планов · QA", Description: "Пицца, настолки и разговоры до ночи. Приносите любимую игру.",
			StartsOn: "2026-10-31", StartsAt: &start, Timezone: "Europe/Moscow", Place: "У Саши дома",
			Revision: 1, ScheduleVersion: 1, Status: meetings.Upcoming, CreatedAt: chatReviewNow,
			CoverVersion: digest,
		}
		if err := w.SaveMeeting(meeting); err != nil {
			return err
		}

		if err := w.SaveCover(meetings.Cover{MeetingID: meeting.ID, Version: digest, MediaType: "image/png", Data: photo, Width: 640, Height: 480}); err != nil {
			return err
		}

		if err := w.InsertInvitation(meetings.Invitation{
			ID: chatReviewID("c0", 1), MeetingID: meeting.ID,
			Token: base64.RawURLEncoding.EncodeToString([]byte("chat-review-only")), CreatedAt: chatReviewNow,
		}); err != nil {
			return err
		}

		for i, person := range chatReviewPeople[1:] {
			if err := w.SaveRSVP(meetings.RSVP{MeetingID: meeting.ID, UserID: chatReviewActor(i + 1).ID, Answer: person.answer, Revision: 1, UpdatedAt: chatReviewNow}); err != nil {
				return err
			}
		}

		for i := 1; i <= 60; i++ {
			if err := chatReviewEntry(w, chatReviewID("d0", i), "message", chatReviewActor(i%4), map[string]string{"text": fmt.Sprintf("Сообщение %02d. Обсуждаем вечер, настольные игры и пиццу.", i)}, -120+i); err != nil {
				return err
			}
		}

		if err := chatReviewEntry(w, chatReviewID("d0", 61), "meeting_created", chatReviewActor(0), map[string]string{"title": meeting.Title}, -59); err != nil {
			return err
		}

		if err := chatReviewEntry(w, chatReviewID("d0", 62), "message", chatReviewActor(1), map[string]any{"text": "Фото", "media_ids": []string{chatReviewID("e0", 1)}}, -58); err != nil {
			return err
		}

		if err := w.SaveMedia(meetings.Media{
			ID: chatReviewID("e0", 1), MeetingID: meeting.ID, FileName: "chat-review-one.png", ContentType: "image/png",
			Kind: "photo", Purpose: "message", Status: "published", SizeBytes: len(photo), DeclaredSize: len(photo),
			UploadedBy: chatReviewActor(1), CreatedAt: chatReviewNow.Add(-58 * time.Minute),
			ClientRequestID: chatReviewID("f0", 1), BlobKey: "chat-review-photo", UploadDigest: digest, EntryID: chatReviewID("d0", 62),
		}); err != nil {
			return err
		}

		messages := []struct {
			actor int
			text  string
		}{
			{1, "В субботу у меня свободен весь вечер. Давайте наконец соберёмся?"},
			{0, "Давайте! Принесу настолки, а с вас хорошее настроение"},
			{2, "Я за 🍕 Можно заказать пиццу и никуда не торопиться"},
		}
		for i, message := range messages {
			if err := chatReviewEntry(w, chatReviewID("d0", 63+i), "message", chatReviewActor(message.actor), map[string]string{"text": message.text}, -57+i); err != nil {
				return err
			}
		}

		reactions := []struct {
			entry, actor int
			emoji        string
		}{
			{63, 2, "❤️"},
			{63, 3, "❤️"},
			{64, 1, "🔥"},
			{65, 1, "👍"},
			{65, 3, "👍"},
			{65, 1, "🍕"},
			{65, 0, "🍕"},
			{60, 0, "👍"},
			{60, 1, "👍"},
			{60, 0, "❤️"},
		}
		for _, reaction := range reactions {
			if err := w.SaveReaction(meetings.Reaction{MeetingID: meeting.ID, EntryID: chatReviewID("d0", reaction.entry), UserID: chatReviewActor(reaction.actor).ID, Emoji: reaction.emoji}, true); err != nil {
				return err
			}
		}

		if err := seedChatReviewTasks(w); err != nil {
			return err
		}

		return seedChatReviewVisual(w, meeting, photo, digest)
	}); err != nil {
		t.Fatal(err)
	}
}

func chatReviewEntry(w meetings.Writer, id, kind string, actor meetings.Actor, payload any, minute int) error {
	return chatReviewMeetingEntry(w, chatReviewMeetingID, id, kind, actor, payload, minute)
}

func chatReviewMeetingEntry(w meetings.Writer, meetingID, id, kind string, actor meetings.Actor, payload any, minute int) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	_, err = w.AppendEntry(meetings.FeedEntry{
		ID: id, MeetingID: meetingID, Kind: kind, ActorID: actor.ID, ActorName: actor.Name,
		OccurredAt: chatReviewNow.Add(time.Duration(minute) * time.Minute), PayloadVersion: 1, Payload: data,
	})

	return err
}

func seedChatReviewTasks(w meetings.Writer) error {
	cases := []struct {
		title                       string
		author, recipient, assignee int
		state                       meetings.PreparationTaskState
	}{
		{"Заказать пиццу", 1, 0, -1, meetings.TaskOffered},
		{"Принести напитки", 0, 2, -1, meetings.TaskOffered},
		{"Принести салфетки", 0, 2, -1, meetings.TaskOffered},
		{"Подготовить музыку", 0, 2, 2, meetings.TaskAccepted},
		{"Выбрать игру", 0, 2, 2, meetings.TaskAccepted},
		{"Заказать десерт", 0, 1, 1, meetings.TaskAccepted},
		{"Встретить друзей", 0, -1, -1, meetings.TaskOffered},
	}
	for i, item := range cases {
		task := meetings.PreparationTask{
			ID: chatReviewID("a1", i+1), MeetingID: chatReviewMeetingID, Title: item.title,
			Author: chatReviewActor(item.author), UpdatedBy: chatReviewActor(item.author), State: item.state,
			Revision: 1, CreatedAt: chatReviewNow.Add(-54 * time.Minute), UpdatedAt: chatReviewNow.Add(-54 * time.Minute),
		}
		if item.recipient >= 0 {
			task.RecipientID = chatReviewActor(item.recipient).ID
		}

		if item.assignee >= 0 {
			actor := chatReviewActor(item.assignee)
			task.Assignee, task.UpdatedBy, task.Revision = &actor, actor, 2
		}

		if err := w.SavePreparationTask(task); err != nil {
			return err
		}

		payload := map[string]string{"task_id": task.ID, "title": task.Title}
		if err := chatReviewEntry(w, chatReviewID("d1", i*2+1), "preparation_task_created", task.Author, payload, -54+i); err != nil {
			return err
		}

		if item.assignee >= 0 {
			if err := chatReviewEntry(w, chatReviewID("d1", i*2+2), "preparation_task_accepted", task.UpdatedBy, payload, -54+i); err != nil {
				return err
			}
		}
	}

	return nil
}

func chatReviewPNG(t *testing.T, second bool) []byte {
	t.Helper()
	picture := image.NewRGBA(image.Rect(0, 0, 640, 480))
	for y := 0; y < 480; y++ {
		for x := 0; x < 640; x++ {
			value := color.RGBA{210, 180, 140, 255}
			if (x/80+y/80)%2 == 0 {
				value = color.RGBA{100, 140, 160, 255}
			}

			if second {
				value.R, value.B = value.B, value.R
			}

			picture.SetRGBA(x, y, value)
		}
	}

	var output bytes.Buffer
	if err := png.Encode(&output, picture); err != nil {
		t.Fatal(err)
	}

	return output.Bytes()
}

func writeChatReviewAssets(t *testing.T, directory string) {
	t.Helper()
	files := map[string][]byte{
		"chat-review-one.png": chatReviewPNG(t, false), "chat-review-two.png": chatReviewPNG(t, true),
		"chat-review-document.txt": []byte("Синтетический QA-документ somewhere. Правила настольной игры.\n"),
		"chat-review-invalid.png":  []byte("This is not an image. Synthetic invalid-upload fixture.\n"),
	}
	for name, data := range files {
		if err := os.WriteFile(filepath.Join(directory, name), data, 0o600); err != nil {
			t.Fatal(err)
		}
	}
}

func seedChatReviewVisual(w meetings.Writer, meeting meetings.Meeting, photo []byte, digest string) error {
	meeting.ID, meeting.Title = chatReviewVisualID, "Вечер без планов"
	if err := w.SaveMeeting(meeting); err != nil {
		return err
	}

	if err := w.SaveCover(meetings.Cover{MeetingID: meeting.ID, Version: digest, MediaType: "image/png", Data: photo, Width: 640, Height: 480}); err != nil {
		return err
	}

	if err := w.InsertInvitation(meetings.Invitation{ID: chatReviewID("c0", 2), MeetingID: meeting.ID, Token: base64.RawURLEncoding.EncodeToString([]byte("chat-review-view")), CreatedAt: chatReviewNow}); err != nil {
		return err
	}

	for i, person := range chatReviewPeople[1:] {
		if err := w.SaveRSVP(meetings.RSVP{MeetingID: meeting.ID, UserID: chatReviewActor(i + 1).ID, Answer: person.answer, Revision: 1, UpdatedAt: chatReviewNow}); err != nil {
			return err
		}
	}

	messages := []struct {
		actor  int
		text   string
		minute int
	}{
		{1, "В субботу у меня свободен весь вечер. Давайте наконец соберёмся?", -29},
		{0, "Давайте! Принесу настолки, а с вас хорошее настроение", -27},
		{2, "Я за 🍕 Можно заказать пиццу и никуда не торопиться", -25},
	}
	for i, message := range messages {
		if i == 2 {
			if err := seedChatReviewVisualPoll(w); err != nil {
				return err
			}
		}

		if err := chatReviewMeetingEntry(w, meeting.ID, chatReviewID("d2", i+1), "message", chatReviewActor(message.actor), map[string]string{"text": message.text}, message.minute); err != nil {
			return err
		}
	}

	for _, reaction := range []struct {
		entry, actor int
		emoji        string
	}{{1, 2, "❤️"}, {1, 3, "❤️"}, {2, 1, "🔥"}, {3, 1, "👍"}, {3, 3, "👍"}, {3, 0, "🍕"}} {
		if err := w.SaveReaction(meetings.Reaction{MeetingID: meeting.ID, EntryID: chatReviewID("d2", reaction.entry), UserID: chatReviewActor(reaction.actor).ID, Emoji: reaction.emoji}, true); err != nil {
			return err
		}
	}

	task := meetings.PreparationTask{ID: chatReviewID("a2", 1), MeetingID: meeting.ID, Title: "Заказать пиццу", Author: chatReviewActor(1), UpdatedBy: chatReviewActor(1), RecipientID: chatReviewActor(0).ID, State: meetings.TaskOffered, Revision: 1, CreatedAt: chatReviewNow.Add(-23 * time.Minute), UpdatedAt: chatReviewNow.Add(-23 * time.Minute)}
	if err := w.SavePreparationTask(task); err != nil {
		return err
	}

	return chatReviewMeetingEntry(w, meeting.ID, chatReviewID("d2", 4), "preparation_task_created", task.Author, map[string]string{"task_id": task.ID, "title": task.Title}, -23)
}

func seedChatReviewVisualPoll(w meetings.Writer) error {
	deadline := time.Date(2026, 10, 30, 15, 0, 0, 0, time.UTC)
	poll := meetings.PlacePoll{
		ID: chatReviewID("a3", 1), MeetingID: chatReviewVisualID, Author: chatReviewActor(2),
		Place: "Может, в лофте «Соседи»?", PreviousPlace: "У Саши дома", Explanation: "Там большой стол, и можно со своей едой.",
		State: meetings.PlacePollOpen, Revision: 4,
		CreatedAt: chatReviewNow.Add(-26 * time.Minute), ClosesAt: deadline,
		Ballots: map[string]meetings.PlaceBallot{
			chatReviewActor(1).ID: {Answer: meetings.PlaceVoteFor, Revision: 1},
			chatReviewActor(2).ID: {Answer: meetings.PlaceVoteFor, Revision: 1},
			chatReviewActor(3).ID: {Answer: meetings.PlaceVoteAgainst, Revision: 1},
		},
		CloseJob: meetings.PollCloseJob{State: meetings.TransitionPending, AvailableAt: deadline},
	}
	if err := w.SavePlacePoll(poll); err != nil {
		return err
	}

	return chatReviewMeetingEntry(w, chatReviewVisualID, chatReviewID("d2", 5), "place_poll_created", poll.Author, map[string]string{"poll_id": poll.ID}, -26)
}
