package httpapi

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/accounts"
	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func testAccounts(store *memory.Store, identities *memory.Identity, auth *identity.Service, now func() time.Time) *accounts.Service {
	return accounts.New(func(ctx context.Context, fn func(accounts.Identity, accounts.Meetings) error) error {
		return identities.AccountUpdate(ctx, store, func(a identity.Store, m meetings.Store) error {
			return fn(auth.WithStore(a), meetings.NewService(m, now))
		})
	})
}

func TestAccountDeletionOpenAPIResponses(t *testing.T) {
	h := newMeetingHTTPTest(t)
	client := h.client(true)
	second := h.client(true)
	profile := h.login(client, "owner", map[string]string{"kind": "home"})
	h.login(second, "owner", map[string]string{"kind": "home"})
	guestClient := h.client(true)
	guest := h.login(guestClient, "guest", map[string]string{"kind": "home"})
	create := func(key string) createdMeetingResponse {
		data, _ := h.request(client, "POST", "/api/v1/meetings", map[string]string{
			"title": "Общая история", "starts_on": "2027-01-01", "timezone": "Europe/Moscow",
		}, headersFor(h, profile, testKey(key)), 201)

		return decodeMeetingTest[createdMeetingResponse](t, data)
	}
	shared, solo := create("1"), create("2")
	address, err := url.Parse(shared.InvitationURL)
	if err != nil {
		t.Fatal(err)
	}

	invite := "/api/v1/invitations/" + strings.TrimPrefix(address.Path, "/i/")
	h.request(guestClient, "PUT", invite+"/rsvp", map[string]string{"answer": "going", "expected_revision": "0"}, headersFor(h, guest, testKey("3")), 200)
	base := "/api/v1/meetings/" + shared.Meeting.ID
	h.request(client, "POST", base+"/messages", map[string]string{"text": "Общее сообщение", "client_request_id": testKey("4")}, headersFor(h, profile, testKey("4")), 201)
	token := base64.RawURLEncoding.EncodeToString(make([]byte, 32))
	headers := headersFor(h, profile, "")
	headers["X-Deletion-Token"] = token
	h.request(h.anonymous, "DELETE", "/api/v1/me", nil, headers, 401)
	invalid := map[string]string{"Origin": h.server.URL, "X-Deletion-Token": token}
	h.request(client, "DELETE", "/api/v1/me", nil, invalid, 403)
	h.request(client, "GET", "/api/v1/me", nil, nil, 200)
	invalid["Origin"] = "https://other.example"
	invalid["X-CSRF-Token"] = *profile.CSRFToken
	h.request(client, "DELETE", "/api/v1/me", nil, invalid, 403)
	invalid["Origin"] = h.server.URL
	invalid["X-Deletion-Token"] = "bad"
	h.request(client, "DELETE", "/api/v1/me", nil, invalid, 422)
	h.request(client, "DELETE", "/api/v1/me", nil, headers, 204)
	h.request(client, "GET", "/api/v1/me", nil, nil, 401)
	h.request(second, "GET", "/api/v1/me", nil, nil, 401)
	data, _ := h.request(guestClient, "GET", base, nil, nil, 200)
	details := decodeMeetingTest[meetingResponse](t, data)
	if details.OrganizerID != guest.User.ID || details.ParticipantCount != 1 {
		t.Fatal("shared meeting not transferred", details)
	}

	h.request(guestClient, "GET", base+"/invitation", nil, nil, 200)
	h.request(guestClient, "GET", "/api/v1/meetings/"+solo.Meeting.ID, nil, nil, 404)
	data, _ = h.request(guestClient, "GET", base+"/feed", nil, nil, 200)
	page := decodeMeetingTest[feedPageResponse](t, data)
	found := false
	for _, entry := range page.Entries {
		if entry.Actor.ID == profile.User.ID {
			if entry.Actor.DisplayName != meetings.RemovedAccountName {
				t.Fatal("history retained profile name")
			}

			if entry.Kind == "message" {
				found = true
			}
		}
	}

	if !found {
		t.Fatal("shared message was removed")
	}

	h.request(h.anonymous, "DELETE", "/api/v1/me", nil, map[string]string{"Origin": h.server.URL, "X-Deletion-Token": token}, 204)
	h.request(h.anonymous, "DELETE", "/api/v1/me", nil, map[string]string{"Origin": "https://other.example", "X-Deletion-Token": token}, 403)
	h.clock.Add(1)
	newProfile := h.login(client, "owner", map[string]string{"kind": "home"})
	if newProfile.User.ID == profile.User.ID {
		t.Fatal("old profile restored")
	}

	h.request(h.anonymous, "DELETE", "/api/v1/me", nil, map[string]string{"Origin": h.server.URL, "X-Deletion-Token": token}, 204)
	h.request(client, "GET", "/api/v1/me", nil, nil, 200)
	if output := os.Getenv("SOMEWHERE_CONTRACT_CAPTURE"); output != "" {
		data, err := json.MarshalIndent(h.captures, "", "  ")
		if err != nil {
			t.Fatal(err)
		}

		if err := os.WriteFile(output+".accounts", data, 0o600); err != nil {
			t.Fatal(err)
		}
	}
}
