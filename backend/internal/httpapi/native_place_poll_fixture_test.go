package httpapi

import (
	"context"
	"encoding/base64"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func seedNativePlaceFixture(t *testing.T, store *memory.Store, identityService *identity.Service, kind string, index int) iosFixtureCredential {
	t.Helper()
	ctx := context.Background()
	credential := iosCredential(t, identityService, "place-"+kind)
	principal, err := identityService.Authenticate(ctx, credential.Token, false)
	if err != nil {
		t.Fatal(err)
	}

	actor := meetings.Actor{ID: principal.User.ID, Name: principal.User.DisplayName}
	id := fmt.Sprintf("d3c60000-0000-4000-8000-%012d", index)
	now := time.Now().UTC().Add(-time.Hour)
	service := meetings.NewService(store, func() time.Time { return now })
	if err := store.Update(ctx, func(writer meetings.Writer) error {
		if err := writer.SaveMeeting(meetings.Meeting{
			ID: id, OrganizerID: actor.ID, Title: "Вечер с друзьями",
			StartsOn: "2026-10-25", Timezone: "Europe/Moscow", Place: "У Саши",
			Revision: 1, CreatedAt: now, Status: meetings.Upcoming, ScheduleVersion: 1,
		}); err != nil {
			return err
		}

		return writer.InsertInvitation(meetings.Invitation{
			ID: fmt.Sprintf("d3c60000-0000-4000-8000-%012d", index+4), MeetingID: id,
			Token: base64.RawURLEncoding.EncodeToString([]byte(fmt.Sprintf("%016d", index+6000))), CreatedAt: now,
		})
	}); err != nil {
		t.Fatal(err)
	}

	if kind == "owner" {
		return credential
	}

	poll, err := service.CreatePlacePoll(ctx, actor, id, meetings.CreatePlacePollInput{
		Place: "Кафе у парка", ClosesAt: now.Add(time.Minute).Format(time.RFC3339),
	}, fmt.Sprintf("d3c60000-0000-4000-8000-%012d", index+1))
	if err != nil {
		t.Fatal(err)
	}

	if kind == "close" {
		if _, err := service.VotePlacePoll(ctx, actor, id, poll.ID, meetings.PlaceVoteInput{Answer: meetings.PlaceVoteFor},
			fmt.Sprintf("d3c60000-0000-4000-8000-%012d", index+2)); err != nil {
			t.Fatal(err)
		}
	}

	if kind == "cancelled" {
		if _, err := service.Update(ctx, actor, id, meetings.UpdateInput{
			Place: meetings.Field{Present: true, Value: "На набережной"}, ExpectedRevision: 1,
		}, fmt.Sprintf("d3c60000-0000-4000-8000-%012d", index+3)); err != nil {
			t.Fatal(err)
		}
	}

	if kind == "rejected" {
		if err := meetings.NewService(store, time.Now).ClosePlacePoll(ctx, poll.ID); err != nil {
			t.Fatal(err)
		}
	}

	return credential
}

type nativePlaceFaults struct {
	mu                       sync.Mutex
	createFailed, voteFailed bool
	service                  *meetings.Service
	store                    *memory.Store
}

func (f *nativePlaceFaults) handler(api http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		scenario := r.Header.Get("X-Somewhere-Test-Scenario")
		isPoll := strings.Contains(r.URL.Path, "/place-polls")
		f.mu.Lock()
		fail := false
		if scenario == "place-owner" && isPoll {
			if r.Method == http.MethodPost && !f.createFailed {
				f.createFailed, fail = true, true
			}

			if r.Method == http.MethodPut && !f.voteFailed {
				f.voteFailed, fail = true, true
			}
		}

		f.mu.Unlock()
		if fail {
			http.Error(w, "fixture unavailable before commit", http.StatusServiceUnavailable)
			return
		}

		api.ServeHTTP(w, r)
		if scenario == "place-close" && r.Method == http.MethodGet {
			// First read is deliberately before the worker catches up; GET remains read-only.
			// The fixture delivers the same overdue mock job after either client read path.
			if isPoll {
				parts := strings.Split(r.URL.Path, "/")
				_ = f.service.ClosePlacePoll(r.Context(), parts[len(parts)-1])
			} else if r.URL.Path == "/api/v1/meetings/d3c60000-0000-4000-8000-000000000200/sync" {
				f.closeAfterSync(r.Context())
			}
		}
	})
}

func (f *nativePlaceFaults) closeAfterSync(ctx context.Context) {
	var ids []string
	if err := f.store.View(ctx, func(reader meetings.Reader) error {
		polls, err := reader.PlacePolls()
		if err != nil {
			return err
		}

		for _, poll := range polls {
			if poll.MeetingID == "d3c60000-0000-4000-8000-000000000200" && poll.State == meetings.PlacePollOpen {
				ids = append(ids, poll.ID)
			}
		}

		return nil
	}); err != nil {
		return
	}

	for _, id := range ids {
		_ = f.service.ClosePlacePoll(ctx, id)
	}
}

func verifyNativePlaceFixture(t *testing.T, store *memory.Store) {
	t.Helper()
	if err := store.View(context.Background(), func(reader meetings.Reader) error {
		polls, err := reader.PlacePolls()
		if err != nil {
			return err
		}

		count := 0
		for _, poll := range polls {
			if poll.MeetingID != "d3c60000-0000-4000-8000-000000000100" {
				continue
			}

			count++
			if poll.State != meetings.PlacePollOpen || len(poll.Ballots) != 1 {
				t.Error("native place vote applied early or duplicated ballot")
			}

			for _, vote := range poll.Ballots {
				if vote.Answer != meetings.PlaceVoteAgainst || vote.Revision != 2 {
					t.Error("native place revote not stored")
				}
			}
		}

		if count != 1 {
			t.Errorf("expected one native place proposal, got %d", count)
		}

		meeting, err := reader.Meeting("d3c60000-0000-4000-8000-000000000200")
		if err != nil {
			return err
		}

		if meeting.Place != "Кафе у парка" {
			t.Error("overdue native place result not applied")
		}

		return nil
	}); err != nil {
		t.Fatal(err)
	}
}
