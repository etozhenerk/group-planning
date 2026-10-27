// Independent reviewer verifier. Loaded by go -overlay; not product code.
package httpapi

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"image/png"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/identity/yandex"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/files"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
	"github.com/etozhenerk/group-planning/backend/internal/support"
)

type independentProvider struct{ meetingTestProvider }

func (independentProvider) Verify(ctx context.Context, code, verifier string) (identity.Profile, error) {
	if strings.HasPrefix(code, "profile-") {
		document, _ := profileFieldsDocument("profile-fields-full")
		switch code {
		case "profile-full":
		case "profile-updated":
			document = strings.ReplaceAll(document, "Александр", "Алексей")
		case "profile-partial":
			document, _ = profileFieldsDocument("profile-fields-partial")
		case "profile-clear":
			document = `{"id":"fixture-profile-fields","client_id":"fixture-profile-client","display_name":"Александр Тестов","birthday":null}`
		case "profile-no-contacts":
			document = `{"id":"fixture-profile-fields","client_id":"fixture-profile-client","display_name":"Александр Тестов"}`
		default:
			return identity.Profile{}, errors.New("unknown profile scenario")
		}
		decoder := yandex.New("fixture-profile-client", "synthetic-only", "https://fixture.invalid/callback", profileFieldsTransport{document: document, token: code})
		return decoder.VerifyToken(ctx, code)
	}
	if code == "p9" {
		return identity.Profile{Subject: code, DisplayName: "Без дополнительных полей"}, nil
	}
	if len(code) != 2 || code[0] != 'p' || code[1] < '0' || code[1] > '9' {
		return identity.Profile{}, errors.New("unknown independent synthetic subject")
	}
	p, err := (meetingTestProvider{}).Verify(ctx, "owner", verifier)
	p.Subject, p.DisplayName = code, "Участник "+code
	if code == "p2" {
		p.AvatarURL = nil
	}
	return p, err
}

type independentRecord struct {
	At     string          `json:"at"`
	Method string          `json:"method"`
	Path   string          `json:"path"`
	Status int             `json:"status"`
	Body   json.RawMessage `json:"body,omitempty"`
	SHA256 string          `json:"sha256"`
}
type independentFixture struct {
	h            *meetingHTTPTest
	mu           sync.Mutex
	records      []independentRecord
	seq          int
	outputSuffix string
}
type independentPerson struct {
	client *http.Client
	me     meResponse
}
type independentMeeting struct {
	base, invite string
	details      meetingResponse
}

func newIndependentFixture(t *testing.T, feedback *support.Service, mediaOptions ...meetings.MediaContent) *independentFixture {
	h := &meetingHTTPTest{t: t, store: memory.New(), server: httptest.NewUnstartedServer(nil)}
	h.clock.Store(time.Date(2026, 10, 27, 10, 0, 0, 0, time.UTC).Unix())
	now := func() time.Time { return time.Unix(h.clock.Load(), 0) }
	identities := memory.NewIdentity()
	id, err := identity.New(identity.Config{PublicOrigin: "https://" + h.server.Listener.Addr().String(), SessionTTL: 7 * 24 * time.Hour, NativeCallbacks: map[string]string{"ios": "group-planning-ios://auth/callback"}}, identities, independentProvider{}, now, func(ctx context.Context, token string) (bool, error) {
		_, err := meetings.Preview(ctx, h.store, token)
		return err == nil, nil
	})
	if err != nil {
		t.Fatal(err)
	}
	var media meetings.MediaContent = memory.NewMediaContent()
	if len(mediaOptions) > 0 {
		media = mediaOptions[0]
	}
	h.app = meetings.NewService(h.store, now, meetings.WithMediaContent(media))
	if feedback == nil {
		feedback = support.New(memory.NewSupport(), nil, now)
	}
	h.server.Config.Handler = NewWithSupport(h.app, id, feedback, slog.New(slog.NewJSONHandler(&h.logs, nil)))
	h.server.StartTLS()
	h.anonymous = h.client(false)
	q := &independentFixture{h: h}
	t.Cleanup(func() {
		h.server.Close()
		if dir := os.Getenv("INDEPENDENT_REVIEW_OUTPUT"); dir != "" {
			data, err := json.MarshalIndent(q.records, "", "  ")
			if err == nil {
				err = os.WriteFile(filepath.Join(dir, strings.ReplaceAll(t.Name(), "/", "_")+q.outputSuffix+".json"), data, 0600)
			}
			if err != nil {
				t.Error(err)
			}
		}
	})
	return q
}
func (q *independentFixture) key() string {
	q.seq++
	return fmt.Sprintf("e2720000-0000-4000-8000-%012d", q.seq)
}
func (q *independentFixture) person(code string) independentPerson {
	c := q.h.client(true)
	return independentPerson{c, q.h.login(c, code, map[string]string{"kind": "home"})}
}
func (q *independentFixture) headers(p independentPerson, key string) map[string]string {
	return headersFor(q.h, p.me, key)
}
func independentRoute(path string) string {
	parts := strings.Split(strings.Split(path, "?")[0], "/")
	if len(parts) > 4 && (parts[3] == "meetings" || parts[3] == "invitations") {
		parts[4] = "{id}"
		if parts[3] == "invitations" {
			parts[4] = "{token}"
		}
	}
	if len(parts) > 7 && (parts[5] == "media" || parts[5] == "messages") {
		if parts[5] == "media" {
			parts[6] = "{media_id}"
		} else {
			parts[6] = "{entry_id}"
		}
	}
	return strings.Join(parts, "/")
}
func (q *independentFixture) raw(c *http.Client, method, path, kind string, body []byte, headers map[string]string, expected int) []byte {
	q.h.t.Helper()
	r, err := http.NewRequest(method, q.h.server.URL+path, bytes.NewReader(body))
	if err != nil {
		q.h.t.Fatal(err)
	}
	if kind != "" {
		r.Header.Set("Content-Type", kind)
	}
	for k, v := range headers {
		r.Header.Set(k, v)
	}
	response, err := c.Do(r)
	if err != nil {
		q.h.t.Fatalf("HTTP transport: %v", err)
	}
	data, err := io.ReadAll(response.Body)
	response.Body.Close()
	if err != nil {
		q.h.t.Fatal(err)
	}
	digest := fmt.Sprintf("%x", sha256.Sum256(data))
	record := independentRecord{At: time.Now().UTC().Format(time.RFC3339Nano), Method: strings.ToLower(method), Path: independentRoute(path), Status: response.StatusCode, SHA256: digest}
	// Authentication setup is never exported. These are isolated synthetic API bodies.
	if json.Valid(data) && !strings.Contains(path, "/auth/") && path != "/api/v1/me" && !bytes.Contains(data, []byte(`"invitation_url"`)) {
		record.Body = append([]byte(nil), data...)
	}
	q.mu.Lock()
	q.records = append(q.records, record)
	q.mu.Unlock()
	q.h.t.Logf("%s %s -> %d response_sha256=%s", method, record.Path, response.StatusCode, digest)
	if expected > 0 && response.StatusCode != expected {
		q.h.t.Errorf("%s %s status %d, want %d; actual body=%s", method, record.Path, response.StatusCode, expected, data)
	}
	return data
}
func (q *independentFixture) req(c *http.Client, method, path string, body any, headers map[string]string, expected int) []byte {
	q.h.t.Helper()
	var data []byte
	if body != nil {
		var err error
		data, err = json.Marshal(body)
		if err != nil {
			q.h.t.Fatal(err)
		}
	}
	return q.raw(c, method, path, "application/json", data, headers, expected)
}
func (q *independentFixture) create(p independentPerson, day, at, zone string) independentMeeting {
	input := map[string]any{"title": "Независимая проверка", "timezone": zone}
	if day != "" {
		input["starts_on"] = day
	}
	if at != "" {
		input["starts_at"] = at
	}
	data := q.req(p.client, "POST", "/api/v1/meetings", input, q.headers(p, q.key()), 201)
	v := decodeMeetingTest[createdMeetingResponse](q.h.t, data)
	u, _ := url.Parse(v.InvitationURL)
	return independentMeeting{"/api/v1/meetings/" + v.Meeting.ID, "/api/v1/invitations/" + strings.TrimPrefix(u.Path, "/i/"), v.Meeting}
}
func (q *independentFixture) rsvp(p independentPerson, m independentMeeting, answer, revision, key string, status int) rsvpResponse {
	data := q.req(p.client, "PUT", m.invite+"/rsvp", map[string]string{"answer": answer, "expected_revision": revision}, q.headers(p, key), status)
	return decodeMeetingTest[rsvpResponse](q.h.t, data)
}
func (q *independentFixture) details(p independentPerson, m independentMeeting) meetingResponse {
	return decodeMeetingTest[meetingResponse](q.h.t, q.req(p.client, "GET", m.base, nil, nil, 200))
}
func independentPrivateFree(t *testing.T, data []byte) {
	t.Helper()
	var value any
	if err := json.Unmarshal(data, &value); err != nil {
		t.Fatal(err)
	}
	var scan func(any)
	scan = func(v any) {
		switch x := v.(type) {
		case map[string]any:
			for k, v := range x {
				switch k {
				case "login", "first_name", "last_name", "birthday", "sex", "email", "phone":
					t.Errorf("private field in public DTO: %s", k)
				}
				scan(v)
			}
		case []any:
			for _, v := range x {
				scan(v)
			}
		}
	}
	scan(value)
}
func independentPNG(t *testing.T) []byte {
	var b bytes.Buffer
	if err := png.Encode(&b, image.NewRGBA(image.Rect(0, 0, 4, 3))); err != nil {
		t.Fatal(err)
	}
	return b.Bytes()
}
func (q *independentFixture) reserve(p independentPerson, m independentMeeting, purpose, kind string, size int) mediaResponse {
	k := q.key()
	body := map[string]any{"client_request_id": k, "file_name": "synthetic.bin", "content_type": kind, "size_bytes": size, "purpose": purpose}
	return decodeMeetingTest[struct {
		Media mediaResponse `json:"media"`
	}](q.h.t, q.req(p.client, "POST", m.base+"/media/uploads", body, q.headers(p, k), 201)).Media
}

type independentPublished struct {
	Media mediaResponse      `json:"media"`
	Entry *feedEntryResponse `json:"entry"`
}

func (q *independentFixture) publish(p independentPerson, m independentMeeting, media mediaResponse, kind string, content []byte) independentPublished {
	path := m.base + "/media/" + media.ID
	q.raw(p.client, "PUT", path+"/content", kind, content, q.headers(p, ""), 200)
	return decodeMeetingTest[independentPublished](q.h.t, q.req(p.client, "POST", path+"/publish", map[string]any{}, q.headers(p, q.key()), 200))
}

func TestIndependentParticipantSummary(t *testing.T) {
	q := newIndependentFixture(t, nil)
	owner := q.person("p0")
	m := q.create(owner, "2026-10-30", "", "Europe/Moscow")
	people := []independentPerson{owner}
	for i := 1; i < 8; i++ {
		p := q.person(fmt.Sprintf("p%d", i))
		people = append(people, p)
		answer := "going"
		if i == 6 {
			answer = "maybe"
		}
		if i == 7 {
			answer = "not_going"
		}
		q.rsvp(p, m, answer, "0", q.key(), 200)
	}
	check := func(count int, excluded string) {
		for _, path := range []string{m.base, "/api/v1/meetings", "/api/v1/meetings?period=upcoming&from=2026-10-01&to=2026-11-01"} {
			data := q.req(owner.client, "GET", path, nil, nil, 200)
			independentPrivateFree(t, data)
			var v any
			json.Unmarshal(data, &v)
			found := false
			var walk func(any)
			walk = func(x any) {
				switch value := x.(type) {
				case map[string]any:
					if value["id"] == m.details.ID && value["participant_count"] != nil {
						found = true
						if value["participant_count"] != float64(count) {
							t.Errorf("count for %s = %v", path, value["participant_count"])
						}
						preview, ok := value["participant_preview"].([]any)
						if !ok || len(preview) == 0 {
							t.Error("summary lacks preview")
						}
						for _, item := range preview {
							if item.(map[string]any)["id"] == excluded {
								t.Error("declined preview person retained")
							}
						}
					}
					for _, child := range value {
						walk(child)
					}
				case []any:
					for _, child := range value {
						walk(child)
					}
				}
			}
			walk(v)
			if !found {
				t.Errorf("summary absent in %s", path)
			}
		}
	}
	check(6, "")
	d := q.details(owner, m)
	if len(d.ParticipantPreview) < 2 {
		t.Fatal("too short summary")
	}
	var chosen independentPerson
	for _, person := range people[1:6] {
		if person.me.User.ID == d.ParticipantPreview[1].ID {
			chosen = person
		}
	}
	if chosen.client == nil {
		t.Fatal("summary guest unknown")
	}
	q.rsvp(chosen, m, "not_going", "1", q.key(), 200)
	check(5, chosen.me.User.ID)
	data := q.req(owner.client, "GET", m.base+"/participants", nil, nil, 200)
	independentPrivateFree(t, data)
	var roster struct {
		Participants []participantResponse `json:"participants"`
	}
	json.Unmarshal(data, &roster)
	found := false
	for _, p := range roster.Participants {
		if p.User.ID == people[2].me.User.ID {
			found = true
			if p.User.AvatarURL != nil {
				t.Error("missing avatar fabricated")
			}
		}
	}
	if !found {
		t.Error("avatar-free participant missing")
	}
	public := q.req(q.h.anonymous, "GET", m.invite, nil, nil, 200)
	independentPrivateFree(t, public)
	for _, key := range []string{"participant_preview", "participants", "media", "memory_preview"} {
		if bytes.Contains(public, []byte(`"`+key+`"`)) {
			t.Errorf("public invitation leaks %s", key)
		}
	}
}

func TestIndependentLegacyAndCutoff(t *testing.T) {
	for _, offset := range []int64{-1, 0, 1} {
		t.Run(fmt.Sprintf("offset_%d", offset), func(t *testing.T) {
			q := newIndependentFixture(t, nil)
			o, g := q.person("p0"), q.person("p1")
			m := q.create(o, "", "2026-10-27T14:00:00+03:00", "Europe/Moscow")
			q.h.clock.Store(time.Date(2026, 10, 27, 10, 0, 0, 0, time.UTC).Unix() + offset)
			want := 409
			if offset < 0 {
				want = 200
			}
			result := q.rsvp(g, m, "going", "0", q.key(), want)
			if want == 200 && !result.CanAccessFeed {
				t.Error("accepted RSVP without access")
			}
			if want == 409 {
				q.req(g.client, "GET", m.base+"/feed", nil, nil, 403)
			}
		})
	}
	t.Run("legacy_retry_move_date_only", func(t *testing.T) {
		q := newIndependentFixture(t, nil)
		o, g, c := q.person("p0"), q.person("p1"), q.person("p2")
		m := q.create(o, "", "2026-10-27T12:00:00Z", "UTC")
		old := q.req(g.client, "GET", m.invite, nil, nil, 200)
		if !decodeMeetingTest[previewResponse](t, old).CanJoin {
			t.Fatal("pre-cutoff preview closed")
		}
		key := q.key()
		q.rsvp(c, m, "going", "0", key, 200)
		png := independentPNG(t)
		photo := q.reserve(o, m, "message", "image/png", len(png))
		q.publish(o, m, photo, "image/png", png)
		q.h.clock.Store(time.Date(2026, 10, 27, 11, 0, 0, 0, time.UTC).Unix())
		q.rsvp(g, m, "going", "0", q.key(), 409)
		preview := decodeMeetingTest[previewResponse](t, q.req(g.client, "GET", m.invite, nil, nil, 200))
		if preview.CanJoin || preview.JoinDisabledReason == nil || *preview.JoinDisabledReason != "join_closed" || preview.JoinClosesAt == nil || !preview.JoinClosesAt.Equal(time.Date(2026, 10, 27, 11, 0, 0, 0, time.UTC)) {
			t.Error("closed preview reason/time incorrect")
		}
		q.req(g.client, "GET", m.base+"/feed", nil, nil, 403)
		q.req(g.client, "GET", m.base+"/media/"+photo.ID+"/content", nil, nil, 403)
		if !q.rsvp(c, m, "going", "0", key, 200).CanAccessFeed {
			t.Error("current retry lost access")
		}
		q.rsvp(c, m, "not_going", "1", q.key(), 200)
		q.rsvp(c, m, "going", "2", q.key(), 409)
		d := q.details(o, m)
		q.req(o.client, "PATCH", m.base, map[string]string{"starts_at": "2026-10-27T15:00:00Z", "expected_revision": d.Revision}, q.headers(o, q.key()), 200)
		if !q.rsvp(g, m, "going", "0", q.key(), 200).CanAccessFeed {
			t.Error("old-format request not accepted after reschedule")
		}
		date := q.create(o, "2026-10-27", "", "UTC")
		q.h.clock.Store(time.Date(2026, 10, 27, 23, 0, 0, 0, time.UTC).Unix())
		q.rsvp(g, date, "going", "0", q.key(), 200)
	})
}

func TestIndependentReactions(t *testing.T) {
	q := newIndependentFixture(t, nil)
	o, g := q.person("p0"), q.person("p1")
	m := q.create(o, "2026-10-30", "", "UTC")
	q.rsvp(g, m, "going", "0", q.key(), 200)
	k := q.key()
	msg := decodeMeetingTest[feedEntryResponse](t, q.req(o.client, "POST", m.base+"/messages", map[string]string{"text": "Синтетическое сообщение", "client_request_id": k}, q.headers(o, k), 201))
	path := m.base + "/messages/" + msg.ID + "/reactions"
	body := map[string]any{"emoji": "❤️", "active": true}
	key := q.key()
	// A response-reading failure after server commit is injected by dropping the body.
	encoded, _ := json.Marshal(body)
	request, _ := http.NewRequest("PUT", q.h.server.URL+path, bytes.NewReader(encoded))
	request.Header.Set("Content-Type", "application/json")
	for k, v := range q.headers(g, key) {
		request.Header.Set(k, v)
	}
	response, err := g.client.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != 200 {
		t.Fatalf("commit before lost body: %d", response.StatusCode)
	}
	response.Body.Close()
	t.Log("Injected lost response body after actual HTTP commit; original request retried")
	q.req(g.client, "PUT", path, body, q.headers(g, key), 200)
	var wg sync.WaitGroup
	for range 8 {
		wg.Go(func() { q.req(g.client, "PUT", path, body, q.headers(g, key), 200) })
	}
	wg.Wait()
	check := func(hearts, fires int) {
		data := q.req(o.client, "GET", m.base+"/reactions?entry_id="+msg.ID, nil, nil, 200)
		independentPrivateFree(t, data)
		var page struct {
			Entries []messageReactionsResponse `json:"entries"`
		}
		json.Unmarshal(data, &page)
		if len(page.Entries) != 1 {
			t.Fatal("missing reaction entry")
		}
		got := map[string]int{}
		for _, r := range page.Entries[0].Reactions {
			got[r.Emoji] = r.Count
		}
		if got["❤️"] != hearts || got["🔥"] != fires {
			t.Errorf("reaction counts=%v, wanted heart=%d fire=%d", got, hearts, fires)
		}
	}
	check(1, 0)
	q.req(g.client, "PUT", path, map[string]any{"emoji": "🔥", "active": true}, q.headers(g, q.key()), 200)
	q.req(o.client, "PUT", path, body, q.headers(o, q.key()), 200)
	check(2, 1)
	q.req(g.client, "PUT", path, map[string]any{"emoji": "❤️", "active": false}, q.headers(g, q.key()), 200)
	check(1, 1)
	png := independentPNG(t)
	photo := q.reserve(o, m, "message", "image/png", len(png))
	published := q.publish(o, m, photo, "image/png", png)
	if published.Entry == nil {
		t.Fatal("attachment entry absent")
	}
	q.req(g.client, "PUT", m.base+"/messages/"+published.Entry.ID+"/reactions", body, q.headers(g, q.key()), 200)
	feed := decodeMeetingTest[feedPageResponse](t, q.req(o.client, "GET", m.base+"/feed", nil, nil, 200))
	if len(feed.Entries) == 0 {
		t.Fatal("empty feed")
	}
	q.req(g.client, "PUT", m.base+"/messages/"+feed.Entries[0].ID+"/reactions", body, q.headers(g, q.key()), 404)
	q.rsvp(g, m, "not_going", "1", q.key(), 200)
	q.req(g.client, "GET", m.base+"/reactions?entry_id="+msg.ID, nil, nil, 403)
	q.req(g.client, "PUT", path, body, q.headers(g, q.key()), 403)
}

type independentDelivery func(context.Context, support.Feedback) (support.Progress, error)

func (f independentDelivery) Send(c context.Context, v support.Feedback) (support.Progress, error) {
	return f(c, v)
}
func TestIndependentSupportAcceptanceAndRetry(t *testing.T) {
	clock := time.Date(2026, 10, 27, 10, 0, 0, 0, time.UTC)
	store := memory.NewSupport()
	calls := 0
	var first support.Feedback
	delivery := independentDelivery(func(_ context.Context, v support.Feedback) (support.Progress, error) {
		calls++
		if calls == 1 {
			first = v
			return support.Progress{MessageID: 77, SentChunks: 1}, errors.New("synthetic unavailable")
		}
		if v.ID != first.ID || v.Description != first.Description || v.Progress.MessageID != 77 {
			t.Error("retry changed feedback/progress")
		}
		return support.Progress{MessageID: 77, SentChunks: 1, FileMessageID: 78}, nil
	})
	s := support.New(store, delivery, func() time.Time { return clock })
	q := newIndependentFixture(t, s)
	post := func(key, text string, extra map[string]any, status int) []byte {
		body := map[string]any{"client_request_id": key, "kind": "problem", "description": text, "screen": "meeting_chat"}
		for k, v := range extra {
			body[k] = v
		}
		return q.req(q.h.anonymous, "POST", "/api/v1/support/feedback", body, map[string]string{"Idempotency-Key": key}, status)
	}
	k := q.key()
	post(k, strings.Repeat("я", 9), nil, 422)
	q.dropResponse(q.h.anonymous, "POST", "/api/v1/support/feedback", map[string]any{"client_request_id": k, "kind": "problem", "description": "  " + strings.Repeat("я", 10) + "  ", "screen": "meeting_chat"}, map[string]string{"Idempotency-Key": k}, 201)
	a := post(k, "  "+strings.Repeat("я", 10)+"  ", nil, 201)
	b := post(k, strings.Repeat("я", 10), nil, 201)
	if !bytes.Equal(a, b) {
		t.Error("trimmed retry changed receipt")
	}
	post(k, "Изменённое сообщение", nil, 409)
	var receipt feedbackReceipt
	json.Unmarshal(a, &receipt)
	if receipt.Status != "accepted" || receipt.ID == "" {
		t.Fatal("invalid receipt")
	}
	if worked, err := s.DeliverNext(context.Background()); !worked || !errors.Is(err, support.ErrUnavailable) {
		t.Fatal("first mock attempt not retriable", err)
	}
	if first.Email != "" || first.Diagnostics != nil || first.Screenshot != nil {
		t.Error("implicit personal data")
	}
	if worked, err := s.DeliverNext(context.Background()); worked || err != nil {
		t.Fatal("worker ignored backoff")
	}
	clock = clock.Add(time.Minute)
	if worked, err := s.DeliverNext(context.Background()); !worked || err != nil {
		t.Fatal("retry not delivered", err)
	}
	if worked, err := s.DeliverNext(context.Background()); worked || err != nil {
		t.Fatal("duplicate delivery")
	}
	if calls != 2 {
		t.Errorf("delivery calls %d", calls)
	}
	post(q.key(), strings.Repeat("я", 3001), nil, 422)
	post(q.key(), strings.Repeat("я", 3000), nil, 201)
	bad := map[string]any{"screenshot": map[string]string{"file_name": "bad.png", "content_type": "image/png", "data_base64": base64.StdEncoding.EncodeToString([]byte("not a PNG"))}}
	post(q.key(), "Синтетическое сообщение", bad, 422)
	png := independentPNG(t)
	good := map[string]any{"screenshot": map[string]string{"file_name": "safe.png", "content_type": "image/png", "data_base64": base64.StdEncoding.EncodeToString(png)}}
	post(q.key(), "Синтетическое сообщение", good, 201)
	oversized := map[string]any{"screenshot": map[string]string{"file_name": "large.png", "content_type": "image/png", "data_base64": base64.StdEncoding.EncodeToString(make([]byte, support.MaxScreenshotBytes+1))}}
	post(q.key(), "Синтетическое сообщение", oversized, 422)
	post(q.key(), "Синтетическое сообщение", map[string]any{"session_token": "synthetic-forbidden-key"}, 400)
	post(q.key(), "Синтетическое сообщение", nil, 201)
	post(q.key(), "Синтетическое сообщение", nil, 201)
	post(q.key(), "Синтетическое сообщение", nil, 429)
	post(k, strings.Repeat("я", 10), nil, 201)
	q.req(q.h.anonymous, "GET", "/api/v1/support/feedback/"+receipt.ID, nil, nil, 404)
	for _, secret := range []string{"Синтетическое сообщение", "synthetic-forbidden-key", base64.StdEncoding.EncodeToString(png), "synthetic unavailable"} {
		if strings.Contains(q.h.logs.String(), secret) || bytes.Contains(a, []byte(secret)) {
			t.Errorf("private input in client receipt/log")
		}
	}
	t.Log("Mock-only destination; no Telegram network transport or real recipient configured")
}

func TestIndependentPrivacy(t *testing.T) {
	q := newIndependentFixture(t, nil)
	o, g, c := q.person("p0"), q.person("p1"), q.person("p2")
	q.req(q.h.anonymous, "GET", "/api/v1/me/profile", nil, nil, 401)
	cookie := q.req(o.client, "GET", "/api/v1/me/profile", nil, nil, 200)
	profile := decodeMeetingTest[profileResponse](t, cookie)
	if profile.ID != o.me.User.ID || profile.Email == nil || profile.Phone == nil || profile.Birthday == nil || profile.Sex == nil || profile.Login == nil || profile.FirstName == nil || profile.LastName == nil {
		t.Fatal("own full profile incomplete")
	}
	verifier := strings.Repeat("v", 43)
	digest := sha256.Sum256([]byte(verifier))
	start, _ := q.h.request(q.h.anonymous, "POST", "/api/v1/auth/yandex/start", map[string]any{"client_kind": "ios", "app_challenge": base64.RawURLEncoding.EncodeToString(digest[:]), "return_context": map[string]string{"kind": "home"}}, nil, 200)
	attempt := decodeMeetingTest[authStartedResponse](t, start)
	address, _ := url.Parse(attempt.AuthorizationURL)
	_, callback := q.h.request(q.h.anonymous, "GET", "/api/v1/auth/yandex/callback?"+url.Values{"state": {address.Query().Get("state")}, "code": {"p0"}}.Encode(), nil, nil, 303)
	destination, _ := url.Parse(callback.Header.Get("Location"))
	exchange, _ := q.h.request(q.h.anonymous, "POST", "/api/v1/auth/mobile/exchange", map[string]string{"attempt_id": attempt.AttemptID, "handoff_code": destination.Query().Get("handoff_code"), "app_verifier": verifier}, nil, 200)
	native := decodeMeetingTest[exchangeResponse](t, exchange)
	bearer := q.req(q.h.anonymous, "GET", "/api/v1/me/profile", nil, map[string]string{"Authorization": "Bearer " + native.SessionToken}, 200)
	if !bytes.Equal(cookie, bearer) {
		t.Error("same identity profile differs by auth transport")
	}
	m := q.create(o, "2026-10-30", "", "UTC")
	q.rsvp(g, m, "going", "0", q.key(), 200)
	key := q.key()
	msg := decodeMeetingTest[feedEntryResponse](t, q.req(o.client, "POST", m.base+"/messages", map[string]string{"text": "Совместимость текста", "client_request_id": key}, q.headers(o, key), 201))
	q.req(o.client, "PUT", m.base+"/messages/"+msg.ID+"/reactions", map[string]any{"emoji": "❤️", "active": true}, q.headers(o, q.key()), 200)
	for _, path := range []string{m.base, "/api/v1/meetings", m.base + "/participants", m.base + "/feed", m.base + "/reactions?entry_id=" + msg.ID} {
		independentPrivateFree(t, q.req(g.client, "GET", path, nil, nil, 200))
	}
	public := q.req(c.client, "GET", m.invite, nil, nil, 200)
	independentPrivateFree(t, public)
	for _, key := range []string{"participants", "participant_preview", "media", "memory_preview", "entries"} {
		if bytes.Contains(public, []byte(`"`+key+`"`)) {
			t.Errorf("public preview leaks %s", key)
		}
	}
	q.req(c.client, "GET", m.base+"/feed", nil, nil, 403)
	// Deliberately minimal old consumer ignores all new optional properties.
	var legacy struct {
		ID, Kind       string
		PayloadVersion int `json:"payload_version"`
		Payload        struct {
			Text string `json:"text"`
		} `json:"payload"`
	}
	encoded, _ := json.Marshal(msg)
	if err := json.Unmarshal(encoded, &legacy); err != nil {
		t.Fatal(err)
	}
	if legacy.ID == "" || legacy.Kind != "message" || legacy.PayloadVersion != 1 || legacy.Payload.Text != "Совместимость текста" {
		t.Errorf("old message consumer no longer reads required fields: %+v", legacy)
	}
}

func TestIndependentMediaPublicationAndAlbum(t *testing.T) {
	q := newIndependentFixture(t, nil)
	o, g, c := q.person("p0"), q.person("p1"), q.person("p2")
	m := q.create(o, "2026-10-27", "", "UTC")
	other := q.create(o, "2026-10-27", "", "UTC")
	single := q.create(o, "2026-10-27", "", "UTC")
	q.rsvp(g, single, "going", "0", q.key(), 200)
	q.rsvp(g, m, "going", "0", q.key(), 200)
	pdf := []byte("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n")
	file := q.reserve(o, m, "message", "application/pdf", len(pdf))
	path := m.base + "/media/" + file.ID
	q.raw(o.client, "PUT", path+"/content", "application/pdf", pdf, q.headers(o, ""), 200)
	k := q.key()
	body := map[string]any{"caption": "  Правила встречи  "}
	encoded, _ := json.Marshal(body)
	request, _ := http.NewRequest("POST", q.h.server.URL+path+"/publish", bytes.NewReader(encoded))
	request.Header.Set("Content-Type", "application/json")
	for name, value := range q.headers(o, k) {
		request.Header.Set(name, value)
	}
	r, err := o.client.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	if r.StatusCode != 200 {
		t.Fatalf("PDF commit status %d", r.StatusCode)
	}
	r.Body.Close()
	t.Log("Dropped publication response body after actual commit")
	first := q.req(o.client, "POST", path+"/publish", body, q.headers(o, k), 200)
	second := q.req(o.client, "POST", path+"/publish", body, q.headers(o, k), 200)
	if !bytes.Equal(first, second) {
		t.Error("publication retry differs")
	}
	pub := decodeMeetingTest[independentPublished](t, first)
	if pub.Entry == nil || pub.Entry.Kind != "message" || pub.Entry.PayloadVersion != 1 {
		t.Fatal("attachment old message contract changed")
	}
	var legacy struct {
		Text string `json:"text"`
	}
	json.Unmarshal(pub.Entry.Payload, &legacy)
	if legacy.Text != "Правила встречи" {
		t.Errorf("legacy caption=%q", legacy.Text)
	}
	q.req(o.client, "POST", path+"/publish", map[string]string{"caption": "Другая подпись"}, q.headers(o, k), 409)
	q.req(o.client, "POST", path+"/publish", map[string]string{"caption": "Другая подпись"}, q.headers(o, q.key()), 409)
	png := independentPNG(t)
	chat := q.reserve(o, m, "message", "image/png", len(png))
	q.publish(o, m, chat, "image/png", png)
	q.req(o.client, "GET", m.base+"/memories", nil, nil, 409)
	// Advance controlled clock, then use the actual scheduled transition operation.
	q.h.clock.Store(time.Date(2026, 10, 28, 0, 0, 0, 0, time.UTC).Unix())
	for range 3 {
		job, err := q.h.app.ClaimTransition(t.Context(), meetings.DefaultTransitionOptions())
		if err != nil {
			t.Fatal(err)
		}
		if err := q.h.app.CompleteTransition(t.Context(), job); err != nil {
			t.Fatal(err)
		}
	}
	if q.details(o, m).Period != "past" {
		t.Fatal("background transition did not make meeting past")
	}
	type albumPage struct {
		Photos     []mediaResponse `json:"photos"`
		NextCursor *string         `json:"next_cursor"`
	}
	album := func(path string) albumPage {
		return decodeMeetingTest[albumPage](t, q.req(g.client, "GET", path, nil, nil, 200))
	}
	if len(album(m.base+"/memories").Photos) != 0 {
		t.Error("chat photo silently added to album")
	}
	empty := q.details(o, other)
	if empty.Period != "past" || empty.MemoryPhotoCount != 0 || len(empty.MemoryPreview) != 0 {
		t.Error("empty past summary incorrect")
	}
	q.req(o.client, "GET", other.base+"/feed", nil, nil, 200)
	singlePhoto := q.reserve(g, single, "memory", "image/png", len(png))
	q.publish(g, single, singlePhoto, "image/png", png)
	singleDetails := q.details(o, single)
	if singleDetails.MemoryPhotoCount != 1 || len(singleDetails.MemoryPreview) != 1 {
		t.Error("single past summary incorrect")
	}
	var photos []mediaResponse
	for i := 0; i < 4; i++ {
		q.h.clock.Add(1)
		photo := q.reserve(g, m, "memory", "image/png", len(png))
		photos = append(photos, photo)
		q.publish(g, m, photo, "image/png", png)
		if i == 0 && len(album(m.base+"/memories").Photos) != 1 {
			t.Error("single-photo album count")
		}
	}
	page1 := album(m.base + "/memories?limit=2")
	if len(page1.Photos) != 2 || page1.NextCursor == nil {
		t.Fatal("missing multipage cursor")
	}
	page2 := album(m.base + "/memories?limit=2&cursor=" + url.QueryEscape(*page1.NextCursor))
	seen := map[string]bool{}
	for _, photo := range append(page1.Photos, page2.Photos...) {
		if seen[photo.ID] {
			t.Error("album duplicate")
		}
		seen[photo.ID] = true
	}
	if len(seen) != 4 || page2.NextCursor != nil {
		t.Error("album omitted photo/end marker")
	}
	repeat := album(m.base + "/memories?limit=2&cursor=" + url.QueryEscape(*page1.NextCursor))
	if len(repeat.Photos) != len(page2.Photos) {
		t.Error("unstable page")
	}
	for i := range repeat.Photos {
		if repeat.Photos[i].ID != page2.Photos[i].ID {
			t.Error("pagination order changed")
		}
	}
	q.req(o.client, "GET", other.base+"/memories?limit=2&cursor="+url.QueryEscape(*page1.NextCursor), nil, nil, 422)
	list := decodeMeetingTest[meetingsPageResponse](t, q.req(o.client, "GET", "/api/v1/meetings?period=past", nil, nil, 200))
	for _, item := range list.Meetings {
		if item.ID == m.details.ID && item.MemoryPhotoCount != 4 {
			t.Error("list album summary incorrect")
		}
	}
	d := q.details(o, m)
	if d.MemoryPhotoCount != 4 || len(d.MemoryPreview) != 3 {
		t.Error("album summary mismatch")
	}
	for _, member := range []independentPerson{o, g} {
		q.req(member.client, "GET", m.base+"/media/"+photos[0].ID+"/content", nil, nil, 200)
	}
	q.req(c.client, "GET", m.base+"/media/"+photos[0].ID+"/content", nil, nil, 403)
	q.req(q.h.anonymous, "GET", m.base+"/media/"+photos[0].ID+"/content", nil, nil, 401)
	q.req(c.client, "GET", m.base+"/memories", nil, nil, 403)
	q.req(q.h.anonymous, "GET", m.base+"/memories", nil, nil, 401)
	// An independent second file fails before upload; first entry remains once.
	unfinished := q.reserve(o, m, "message", "image/png", len(png))
	q.req(o.client, "POST", m.base+"/media/"+unfinished.ID+"/publish", map[string]any{}, q.headers(o, q.key()), 409)
	feed := decodeMeetingTest[feedPageResponse](t, q.req(o.client, "GET", m.base+"/feed", nil, nil, 200))
	count := 0
	for _, entry := range feed.Entries {
		if entry.ID == pub.Entry.ID {
			count++
		}
	}
	if count != 1 {
		t.Errorf("PDF entries=%d", count)
	}
}

func TestIndependentMediaLimitsAndCleanup(t *testing.T) {
	before, _ := os.ReadDir(os.TempDir())
	known := map[string]bool{}
	for _, entry := range before {
		known[entry.Name()] = true
	}
	disk, err := files.NewMedia()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { disk.Close() })
	after, _ := os.ReadDir(os.TempDir())
	directory := ""
	for _, entry := range after {
		if !known[entry.Name()] && strings.HasPrefix(entry.Name(), "somewhere-media-") {
			if directory != "" {
				t.Fatal("ambiguous private temp fixture directory")
			}
			directory = filepath.Join(os.TempDir(), entry.Name())
		}
	}
	if directory == "" {
		t.Fatal("own temp directory not observable")
	}
	q := newIndependentFixture(t, nil, disk)
	o := q.person("p0")
	m := q.create(o, "2026-10-30", "", "UTC")
	limits := q.req(o.client, "GET", m.base+"/media/limits", nil, nil, 200)
	var advertised struct {
		Photo int `json:"max_photo_bytes"`
		File  int `json:"max_file_bytes"`
		Count int `json:"max_files"`
	}
	json.Unmarshal(limits, &advertised)
	if advertised.Photo != 10<<20 || advertised.File != 20<<20 || advertised.Count != 10 {
		t.Fatal("advertised limits differ from contract")
	}
	for _, spec := range []struct {
		kind       string
		size, want int
	}{{"image/png", advertised.Photo, 201}, {"application/pdf", advertised.File, 201}, {"image/png", advertised.Photo + 1, 422}, {"application/pdf", advertised.File + 1, 422}, {"image/gif", 32, 422}, {"text/plain", 0, 422}} {
		key := q.key()
		body := map[string]any{"client_request_id": key, "file_name": "limit.bin", "content_type": spec.kind, "size_bytes": spec.size, "purpose": "message"}
		a := q.req(o.client, "POST", m.base+"/media/uploads", body, q.headers(o, key), spec.want)
		if spec.want == 201 {
			b := q.req(o.client, "POST", m.base+"/media/uploads", body, q.headers(o, key), 201)
			if !bytes.Equal(a, b) {
				t.Error("reserve retry duplicated or changed")
			}
		}
	}
	png := independentPNG(t)
	pending := q.reserve(o, m, "message", "image/png", len(png))
	path := m.base + "/media/" + pending.ID
	q.req(o.client, "POST", path+"/publish", map[string]any{}, q.headers(o, q.key()), 409)
	q.raw(o.client, "PUT", path+"/content", "image/png", bytes.Repeat([]byte("x"), len(png)), q.headers(o, ""), 422)
	q.raw(o.client, "PUT", path+"/content", "image/png", png[:len(png)-1], q.headers(o, ""), 422)
	q.raw(o.client, "PUT", path+"/content", "image/png", png, q.headers(o, ""), 200)
	complete := q.reserve(o, m, "message", "image/png", len(png))
	q.publish(o, m, complete, "image/png", png)
	var pendingBlob string
	q.h.store.View(t.Context(), func(r meetings.Reader) error {
		item, err := r.Media(pending.ID)
		pendingBlob = item.BlobKey
		return err
	})
	if pendingBlob == "" {
		t.Fatal("pending upload lacked own bytes")
	}
	orphanKey := "11111111-1111-4111-8111-111111111111." + strings.Repeat("a", 64)
	if err := disk.Put(t.Context(), orphanKey, []byte("synthetic-orphan")); err != nil {
		t.Fatal(err)
	}
	oldTime := time.Unix(q.h.clock.Load(), 0).Add(-2 * time.Hour)
	if err := os.Chtimes(filepath.Join(directory, orphanKey), oldTime, oldTime); err != nil {
		t.Fatal(err)
	}
	if err := q.h.app.PruneMedia(t.Context()); err != nil {
		t.Fatal(err)
	}
	if _, err := disk.Get(t.Context(), orphanKey); !errors.Is(err, meetings.ErrNotFound) {
		t.Fatal("unreferenced bytes survived grace", err)
	}
	q.h.clock.Add(int64(24 * time.Hour / time.Second))
	if err := q.h.app.PruneMedia(t.Context()); err != nil {
		t.Fatal(err)
	}
	if err := q.h.store.View(t.Context(), func(r meetings.Reader) error { _, err := r.Media(pending.ID); return err }); !errors.Is(err, meetings.ErrNotFound) {
		t.Fatal("expired metadata retained", err)
	}
	if _, err := disk.Get(t.Context(), pendingBlob); !errors.Is(err, meetings.ErrNotFound) {
		t.Fatal("expired pending bytes retained", err)
	}
	if err := q.h.store.View(t.Context(), func(r meetings.Reader) error {
		items, err := r.AllMedia()
		if err != nil {
			return err
		}
		if len(items) != 1 || items[0].ID != complete.ID {
			t.Error("expired reservation retained or published metadata removed")
		}
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	q.req(o.client, "GET", m.base+"/media/"+complete.ID+"/content", nil, nil, 200)
	if err := disk.Close(); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(directory); !errors.Is(err, os.ErrNotExist) {
		t.Fatal("fixture shutdown retained private temp directory", err)
	}
	fresh := newIndependentFixture(t, nil)
	fresh.outputSuffix = "_fresh"
	freshOwner := fresh.person("p0")
	page := decodeMeetingTest[meetingsPageResponse](t, fresh.req(freshOwner.client, "GET", "/api/v1/meetings", nil, nil, 200))
	if len(page.Meetings) != 0 {
		t.Fatal("new memory fixture unexpectedly retained data")
	}
	t.Log("Only this verifier's private temporary media directory removed; new memory fixture is empty, no durability claim")
}

type independentPausedMedia struct {
	*memory.MediaContent
	entered, release chan struct{}
	enabled          bool
	mu               sync.Mutex
}

func (p *independentPausedMedia) Put(ctx context.Context, key string, data []byte) error {
	p.mu.Lock()
	pause := p.enabled
	p.mu.Unlock()
	if pause {
		close(p.entered)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-p.release:
		}
	}
	return p.MediaContent.Put(ctx, key, data)
}
func TestIndependentMediaRevocationBarrier(t *testing.T) {
	media := &independentPausedMedia{MediaContent: memory.NewMediaContent(), entered: make(chan struct{}), release: make(chan struct{})}
	q := newIndependentFixture(t, nil, media)
	o, g, c := q.person("p0"), q.person("p1"), q.person("p2")
	m := q.create(o, "2026-10-30", "", "UTC")
	q.rsvp(g, m, "going", "0", q.key(), 200)
	png := independentPNG(t)
	published := q.reserve(o, m, "message", "image/png", len(png))
	q.publish(o, m, published, "image/png", png)
	oldURL := m.base + "/media/" + published.ID + "/content"
	for _, path := range []string{m.base + "/feed", oldURL} {
		q.req(o.client, "GET", path, nil, nil, 200)
		q.req(g.client, "GET", path, nil, nil, 200)
		q.req(c.client, "GET", path, nil, nil, 403)
		q.req(q.h.anonymous, "GET", path, nil, nil, 401)
	}
	public := q.req(c.client, "GET", m.invite, nil, nil, 200)
	if bytes.Contains(public, []byte(published.ID)) {
		t.Fatal("public invitation leaked private file")
	}
	pending := q.reserve(g, m, "message", "image/png", len(png))
	media.mu.Lock()
	media.enabled = true
	media.mu.Unlock()
	done := make(chan struct{})
	go func() {
		defer close(done)
		q.raw(g.client, "PUT", m.base+"/media/"+pending.ID+"/content", "image/png", png, q.headers(g, ""), 403)
	}()
	select {
	case <-media.entered:
	case <-time.After(5 * time.Second):
		t.Fatal("upload barrier not reached")
	}
	q.rsvp(g, m, "not_going", "1", q.key(), 200)
	close(media.release)
	<-done
	q.req(g.client, "POST", m.base+"/media/"+pending.ID+"/publish", map[string]any{}, q.headers(g, q.key()), 403)
	q.req(g.client, "GET", oldURL, nil, nil, 403)
	q.h.store.View(t.Context(), func(r meetings.Reader) error {
		item, err := r.Media(pending.ID)
		if item.Status != "pending" {
			t.Error("revoked upload committed")
		}
		return err
	})
	t.Log("Actual HTTP upload paused in real binary-store port, membership revoked via HTTP, resumed upload and publication denied")
}

func TestIndependentConcurrentCutoffReschedule(t *testing.T) {
	for i := 0; i < 6; i++ {
		t.Run(fmt.Sprintf("interleave_%d", i), func(t *testing.T) {
			q := newIndependentFixture(t, nil)
			o, g := q.person("p0"), q.person("p1")
			m := q.create(o, "", "2026-10-27T12:00:00Z", "UTC")
			original := q.h.server.Config.Handler
			arrived := make(chan struct{}, 2)
			release := make(chan struct{})
			q.h.server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if (r.Method == "PUT" && strings.HasSuffix(r.URL.Path, "/rsvp")) || (r.Method == "PATCH" && r.URL.Path == m.base) {
					arrived <- struct{}{}
					<-release
				}
				original.ServeHTTP(w, r)
			})
			rsvpKey, updateKey := q.key(), q.key()
			var join, update []byte
			var wg sync.WaitGroup
			wg.Go(func() {
				join = q.req(g.client, "PUT", m.invite+"/rsvp", map[string]string{"answer": "going", "expected_revision": "0"}, q.headers(g, rsvpKey), 0)
			})
			wg.Go(func() {
				update = q.req(o.client, "PATCH", m.base, map[string]string{"starts_at": "2026-10-27T10:30:00Z", "expected_revision": "1"}, q.headers(o, updateKey), 0)
			})
			for range 2 {
				select {
				case <-arrived:
				case <-time.After(5 * time.Second):
					t.Fatal("concurrent request not at barrier")
				}
			}
			close(release)
			wg.Wait()
			response := decodeMeetingTest[rsvpResponse](t, join)
			saved := q.details(o, m)
			if response.CanAccessFeed {
				if saved.ParticipantCount != 2 || saved.StartsAt == nil || saved.StartsAt.Format(time.RFC3339) != "2026-10-27T12:00:00Z" || !bytes.Contains(update, []byte(`"error"`)) {
					t.Error("RSVP-first interleave lost atomic revision")
				}
				q.req(g.client, "GET", m.base+"/feed", nil, nil, 200)
			} else {
				if saved.ParticipantCount != 1 || !bytes.Contains(join, []byte(`"join_closed"`)) || bytes.Contains(update, []byte(`"error"`)) {
					t.Error("reschedule-first interleave admitted guest or update failed")
				}
				q.req(g.client, "GET", m.base+"/feed", nil, nil, 403)
			}
		})
	}
}
