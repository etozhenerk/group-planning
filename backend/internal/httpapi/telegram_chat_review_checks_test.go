package httpapi

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func newChatReviewHTTPTest(t *testing.T) (*meetingHTTPTest, *identity.Service, string) {
	t.Helper()
	h := &meetingHTTPTest{t: t, store: memory.New(), server: httptest.NewUnstartedServer(nil)}
	identities, media := memory.NewIdentity(), memory.NewMediaContent()
	auth := newChatReviewAuth(t, "https://"+h.server.Listener.Addr().String(), identities)
	h.app = meetings.NewService(h.store, func() time.Time { return chatReviewNow }, meetings.WithMediaContent(media))
	seedChatReview(t, h.store, identities, media)
	directory := t.TempDir()
	writeChatReviewJSON(t, filepath.Join(directory, "control.json"), chatReviewControl{})
	faults := &chatReviewFaults{directory: directory, auth: auth, consumed: map[string]bool{}}
	h.server.Config.Handler = faults.handler(NewWithIdentity(h.app, auth, slog.New(slog.NewTextHandler(io.Discard, nil))))
	h.server.StartTLS()
	t.Cleanup(h.server.Close)
	h.anonymous = h.client(false)

	return h, auth, directory
}

func TestChatReviewDataAndSessions(t *testing.T) {
	h, auth, _ := newChatReviewHTTPTest(t)
	for i, person := range chatReviewPeople[:3] {
		first := iosCredential(t, auth, person.code)
		second := iosCredential(t, auth, person.code)
		for _, credential := range []iosFixtureCredential{first, second} {
			data, _ := h.request(h.anonymous, "GET", "/api/v1/me", nil, map[string]string{"Authorization": "Bearer " + credential.Token}, 200)
			user := decodeMeetingTest[meResponse](t, data).User
			if user.ID != chatReviewActor(i).ID || user.DisplayName != person.name {
				t.Fatal("native session changed seeded identity")
			}
		}

		client := h.client(true)
		profile := h.login(client, person.code, map[string]string{"kind": "home"})
		if profile.User.ID != chatReviewActor(i).ID || profile.User.DisplayName != person.name {
			t.Fatal("web and native identity differ")
		}

		for _, id := range []string{chatReviewVisualID, chatReviewMeetingID} {
			data, _ := h.request(client, "GET", "/api/v1/meetings/"+id+"/participants", nil, nil, 200)
			var response struct {
				Participants []participantResponse `json:"participants"`
			}
			if err := json.Unmarshal(data, &response); err != nil {
				t.Fatal(err)
			}

			if len(response.Participants) != 6 {
				t.Fatalf("roster has %d people", len(response.Participants))
			}

			for _, p := range response.Participants {
				for index, expected := range chatReviewPeople {
					if p.User.ID != chatReviewActor(index).ID {
						continue
					}

					if p.User.DisplayName != expected.name {
						t.Fatal("profile name changed")
					}

					if index == 0 && p.Role != "organizer" {
						t.Fatal("organizer missing")
					}

					if index != 0 && (p.RSVP == nil || *p.RSVP != string(expected.answer)) {
						t.Fatal("roster response changed")
					}
				}
			}
		}
	}

	visual, err := h.app.Feed(context.Background(), chatReviewActor(0), chatReviewVisualID, meetings.FeedQuery{Limit: 100})
	if err != nil || len(visual.Entries) != 5 || visual.Details.ParticipantCount != 4 {
		t.Fatal("visual snapshot differs", err)
	}

	if visual.Entries[2].Kind != "place_poll_created" || visual.Entries[4].OccurredAt != chatReviewNow.Add(-23*time.Minute) {
		t.Fatal("visual poll/task order or time differs")
	}

	if err := h.store.View(context.Background(), func(r meetings.Reader) error {
		poll, err := r.PlacePoll(chatReviewID("a3", 1))
		if err != nil {
			return err
		}

		counts := map[meetings.PlaceVote]int{}
		for _, ballot := range poll.Ballots {
			counts[ballot.Answer]++
		}

		if counts[meetings.PlaceVoteFor] != 2 || counts[meetings.PlaceVoteAgainst] != 1 || poll.State != meetings.PlacePollOpen || !poll.ClosesAt.Equal(time.Date(2026, 10, 30, 15, 0, 0, 0, time.UTC)) {
			t.Fatal("visual poll votes/deadline differ")
		}

		return nil
	}); err != nil {
		t.Fatal(err)
	}

	functional, err := h.app.Feed(context.Background(), chatReviewActor(0), chatReviewMeetingID, meetings.FeedQuery{Limit: 30})
	if err != nil || !functional.HasMore || len(functional.Entries) != 30 {
		t.Fatal("functional conversation is not paginated", err)
	}

	groups, err := h.app.Reactions(context.Background(), chatReviewActor(0), chatReviewMeetingID, []string{chatReviewID("d0", 65)})
	if err != nil || len(groups) != 1 || len(groups[0].Reactions) != 2 {
		t.Fatal("reaction seed missing", err)
	}

	for _, group := range groups[0].Reactions {
		if len(group.UserIDs) != 2 || group.Mine != (group.Emoji == "🍕") {
			t.Fatal("reaction count or own state differs")
		}
	}

	_, content, err := h.app.MediaBytes(context.Background(), chatReviewActor(1), chatReviewMeetingID, chatReviewID("e0", 1))
	if err != nil || len(content) == 0 {
		t.Fatal("seed attachment unavailable", err)
	}
}

func TestChatReviewRolesAndAccess(t *testing.T) {
	h, auth, _ := newChatReviewHTTPTest(t)
	headers := func(actor, key int) map[string]string {
		credential := iosCredential(t, auth, chatReviewPeople[actor].code)
		return map[string]string{"Authorization": "Bearer " + credential.Token, "Idempotency-Key": chatReviewID("f1", key)}
	}
	base := "/api/v1/meetings/" + chatReviewMeetingID
	h.request(h.anonymous, "POST", base+"/preparation-tasks/"+chatReviewID("a1", 2)+"/accept", map[string]string{"expected_revision": "1"}, headers(1, 1), 403)
	for i, action := range []struct {
		task, actor             int
		revision, action, state string
	}{
		{2, 2, "1", "accept", "accepted"},
		{3, 2, "1", "decline", "declined"},
		{4, 2, "2", "complete", "completed"},
		{5, 2, "2", "complete", "completed"},
		{6, 0, "2", "cancel", "cancelled"},
	} {
		path := base + "/preparation-tasks/" + chatReviewID("a1", action.task) + "/" + action.action
		data, _ := h.request(h.anonymous, "POST", path, map[string]string{"expected_revision": action.revision}, headers(action.actor, i+2), 200)
		if string(decodeMeetingTest[preparationTaskResponse](t, data).State) != action.state {
			t.Fatal("task transition failed")
		}
	}

	lena := headers(1, 20)
	h.request(h.anonymous, "PUT", base+"/rsvp", map[string]string{"answer": "maybe", "expected_revision": "1"}, lena, 200)
	h.request(h.anonymous, "GET", base+"/feed", nil, lena, 403)
	h.request(h.anonymous, "PUT", base+"/messages/"+chatReviewID("d0", 65)+"/reactions", map[string]any{"emoji": "🔥", "active": true}, headers(1, 21), 403)
	h.request(h.anonymous, "GET", base+"/feed", nil, headers(0, 22), 200)
	h.request(h.anonymous, "GET", "/api/v1/meetings/"+chatReviewVisualID+"/feed", nil, lena, 200)
}

func TestChatReviewOneShotFaults(t *testing.T) {
	h, auth, directory := newChatReviewHTTPTest(t)
	credential := iosCredential(t, auth, "sasha")
	base := "/api/v1/meetings/" + chatReviewMeetingID
	path := base + "/messages/" + chatReviewID("d0", 65) + "/reactions"
	header := map[string]string{"Authorization": "Bearer " + credential.Token, "Idempotency-Key": chatReviewID("f2", 1)}
	body := map[string]any{"emoji": "🔥", "active": true}
	arm := func(id, mode string, delay int) {
		writeChatReviewJSON(t, filepath.Join(directory, "control.json"), chatReviewControl{ID: id, Method: "PUT", Path: path, ActorID: chatReviewActor(0).ID, Mode: mode, DelayMS: delay})
	}
	arm("error-1", "error", 0)
	h.request(h.anonymous, "PUT", path, body, header, 503)
	before, err := h.app.Reactions(context.Background(), chatReviewActor(0), chatReviewMeetingID, []string{chatReviewID("d0", 65)})
	if err != nil || len(before[0].Reactions) != 2 {
		t.Fatal("pre-commit error changed reactions", err)
	}

	arm("lost-1", "lost", 0)
	h.request(h.anonymous, "PUT", path, body, header, 503)
	data, _ := h.request(h.anonymous, "PUT", path, body, header, 200)
	result := decodeMeetingTest[messageReactionsResponse](t, data)
	if len(result.Reactions) != 3 {
		t.Fatal("lost response did not commit")
	}

	for _, reaction := range result.Reactions {
		if reaction.Emoji == "🔥" && reaction.Count != 1 {
			t.Fatal("retry duplicated reaction")
		}
	}

	arm("pending-1", "pending", 25)
	started := time.Now()
	h.request(h.anonymous, "PUT", path, body, header, 200)
	if time.Since(started) < 25*time.Millisecond {
		t.Fatal("pending control did not wait")
	}

	data, err = os.ReadFile(filepath.Join(directory, "control-events.jsonl"))
	if err != nil {
		t.Fatal(err)
	}

	lines := strings.Split(strings.TrimSpace(string(data)), "\n")
	if len(lines) != 4 {
		t.Fatal("fault audit incomplete")
	}

	lost := decodeMeetingTest[chatReviewFaultEvent](t, []byte(lines[1]))
	retry := decodeMeetingTest[chatReviewFaultEvent](t, []byte(lines[2]))
	if !lost.Injected || retry.Injected || lost.Status != 200 || lost.KeyHash != retry.KeyHash || lost.BodyHash != retry.BodyHash {
		t.Fatal("lost response retry identity differs")
	}

	if strings.Contains(string(data), credential.Token) || strings.Contains(string(data), "Bearer") {
		t.Fatal("fault audit leaked credentials")
	}
}

func TestChatReviewControlScope(t *testing.T) {
	base := chatReviewControl{ID: "scope", Method: "POST", Path: "/api/v1/meetings/" + chatReviewMeetingID + "/messages", ActorID: chatReviewActor(0).ID, Mode: "lost"}
	if !validChatReviewControl(base) {
		t.Fatal("valid review operation rejected")
	}

	for _, path := range []string{"/api/v1/auth/yandex/start", "/api/v1/meetings/" + chatReviewMeetingID + "suffix/messages", "/api/v1/meetings/another/messages"} {
		invalid := base
		invalid.Path = path
		if validChatReviewControl(invalid) {
			t.Fatal("control escaped fixture meetings")
		}
	}
}
