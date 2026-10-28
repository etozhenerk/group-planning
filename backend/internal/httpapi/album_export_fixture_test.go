package httpapi

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

type albumReviewContent struct {
	*memory.MediaContent
	mu   sync.Mutex
	gate chan struct{}
}

func (c *albumReviewContent) pause(paused bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if paused && c.gate == nil {
		c.gate = make(chan struct{})
	}

	if !paused && c.gate != nil {
		close(c.gate)
		c.gate = nil
	}
}

func (c *albumReviewContent) Get(ctx context.Context, key string) ([]byte, error) {
	c.mu.Lock()
	gate := c.gate
	c.mu.Unlock()
	if gate != nil {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-gate:
		}
	}

	return c.MediaContent.Get(ctx, key)
}

// TestAlbumExportReviewFixture exposes only test accounts on a loopback TLS
// server. The connection file contains ephemeral test sessions; never commit it.
func TestAlbumExportReviewFixture(t *testing.T) {
	destination := os.Getenv("SOMEWHERE_ALBUM_REVIEW")
	if destination == "" {
		t.Skip("set SOMEWHERE_ALBUM_REVIEW to a private connection JSON path")
	}

	done := make(chan struct{})
	var stop sync.Once
	content := &albumReviewContent{MediaContent: memory.NewMediaContent()}
	h := newMeetingHTTPTestWithHandler(t, func(api http.Handler, h *meetingHTTPTest) http.Handler {
		mux := http.NewServeMux()
		mux.Handle("/", api)
		mux.HandleFunc("POST /qa/control", func(w http.ResponseWriter, r *http.Request) {
			var input struct {
				Paused         *bool `json:"paused"`
				AdvanceSeconds int64 `json:"advance_seconds"`
				Stop           bool  `json:"stop"`
			}
			if !decodeJSON(w, r, &input) {
				return
			}

			if input.AdvanceSeconds < 0 || input.AdvanceSeconds > 3600 {
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			if input.Paused != nil {
				content.pause(*input.Paused)
			}

			h.clock.Add(input.AdvanceSeconds)
			if input.Stop {
				stop.Do(func() { close(done) })
			}

			w.WriteHeader(http.StatusNoContent)
		})

		return mux
	}, meetings.WithMediaContent(content))
	defer content.pause(false)
	client, guestClient, otherClient := h.client(true), h.client(true), h.client(true)
	owner := h.login(client, "owner", map[string]string{"kind": "home"})
	guest := h.login(guestClient, "guest", map[string]string{"kind": "home"})
	other := h.login(otherClient, "other", map[string]string{"kind": "home"})
	data, _ := h.request(client, "POST", "/api/v1/meetings", map[string]any{"title": "QA альбом 103", "starts_on": "2099-01-01", "timezone": "UTC"}, headersFor(h, owner, testKey("8100")), 201)
	created := decodeMeetingTest[createdMeetingResponse](t, data)
	invitation, _ := url.Parse(created.InvitationURL)
	invite := "/api/v1/invitations/" + strings.TrimPrefix(invitation.Path, "/i/")
	for index, participant := range []struct {
		client *http.Client
		user   meResponse
	}{{guestClient, guest}, {otherClient, other}} {
		h.request(participant.client, "PUT", invite+"/rsvp", map[string]string{"answer": "going", "expected_revision": "0"}, headersFor(h, participant.user, testKey(fmt.Sprint(8101+index))), 200)
	}

	id := created.Meeting.ID
	if err := h.store.Update(t.Context(), func(w meetings.Writer) error {
		meeting, err := w.Meeting(id)
		if err != nil {
			return err
		}

		meeting.Status = meetings.Past

		return w.SaveMeeting(meeting)
	}); err != nil {
		t.Fatal(err)
	}

	actor := meetings.Actor{ID: owner.User.ID, Name: owner.User.DisplayName}
	photos := seedExportPhotos(t, h, actor, id, 103)
	hashes := map[string]string{}
	for id, photo := range photos {
		digest := sha256.Sum256(photo)
		hashes[id] = hex.EncodeToString(digest[:])
	}

	serverURL, _ := url.Parse(h.server.URL)
	session := func(client *http.Client) string {
		for _, cookie := range client.Jar.Cookies(serverURL) {
			if cookie.Name == sessionCookie {
				return cookie.Value
			}
		}

		t.Fatal("test session missing")

		return ""
	}
	connection := map[string]any{
		"url": h.server.URL, "meeting_id": id, "invitation_path": invite,
		"cookie_name": sessionCookie, "photo_sha256": hashes,
		"owner": map[string]any{"session": session(client), "csrf": *owner.CSRFToken, "user_id": owner.User.ID},
		"guest": map[string]any{"session": session(guestClient), "csrf": *guest.CSRFToken, "user_id": guest.User.ID},
		"other": map[string]any{"session": session(otherClient), "csrf": *other.CSRFToken, "user_id": other.User.ID},
	}
	encoded, err := json.MarshalIndent(connection, "", "  ")
	if err != nil {
		t.Fatal(err)
	}

	if err := os.MkdirAll(filepath.Dir(destination), 0o700); err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(destination, encoded, 0o600); err != nil {
		t.Fatal(err)
	}

	defer os.Remove(destination)
	t.Log("album export review fixture ready; private connection file:", destination)
	select {
	case <-done:
	case <-t.Context().Done():
	case <-time.After(30 * time.Minute):
	}
}
