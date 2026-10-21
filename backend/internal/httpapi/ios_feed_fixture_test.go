package httpapi

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

const iosFeedMeeting = "88888888-8888-4888-8888-888888888888"

func seedIOSFeed(t *testing.T, store *memory.Store, service *identity.Service, owner iosFixtureCredential) {
	t.Helper()
	seedIOSInvitation(t, store, service, owner, iosFeedMeeting, "RERERERERERERERERERERA", "Разговор о субботе",
		"99999999-9999-4999-8999-999999999999", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
	principal, err := service.Authenticate(context.Background(), owner.Token, false)
	if err != nil {
		t.Fatal(err)
	}

	err = store.Update(context.Background(), func(writer meetings.Writer) error {
		for i := 2; i <= 56; i++ {
			actorID, name := "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Лена"
			if i%2 == 0 {
				actorID, name = principal.User.ID, principal.User.DisplayName
			}

			text := fmt.Sprintf("Сообщение %02d", i)
			examples := map[int]string{
				50: "Может, начнём чуть пораньше?", 51: "Я как раз освобожусь к семи.",
				52: "Тогда оставляем семь. Всем удобно?", 53: "Да! Возьму что-нибудь к чаю.",
				54: "Отлично, нас уже четверо.", 56: "Я захвачу настолки. Пиццу закажем, когда соберёмся?",
			}
			if example, ok := examples[i]; ok {
				text = example
			}

			payload, err := json.Marshal(map[string]string{"text": text})
			if err != nil {
				return err
			}

			entry := meetings.FeedEntry{
				ID: fmt.Sprintf("cccccccc-cccc-4ccc-8ccc-%012d", i), MeetingID: iosFeedMeeting,
				ActorID: actorID, ActorName: name, Kind: "message", PayloadVersion: 1, Payload: payload,
				OccurredAt: time.Now().UTC().Add(time.Duration(i-56) * time.Minute),
			}
			if i == 55 {
				entry.Kind = "future_event"
				entry.PayloadVersion = 2
			}

			if _, err := writer.AppendEntry(entry); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}
