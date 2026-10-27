// Дополнительные независимые сценарии r2; подключаются только через Go overlay.
package httpapi

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
	"github.com/etozhenerk/group-planning/backend/internal/support"
	"github.com/etozhenerk/group-planning/backend/internal/support/telegram"
)

func (q *independentFixture) dropResponse(c *http.Client, method, path string, body any, headers map[string]string, expected int) {
	q.h.t.Helper()
	data, err := json.Marshal(body)
	if err != nil {
		q.h.t.Fatal(err)
	}
	request, err := http.NewRequest(method, q.h.server.URL+path, bytes.NewReader(data))
	if err != nil {
		q.h.t.Fatal(err)
	}
	request.Header.Set("Content-Type", "application/json")
	for name, value := range headers {
		request.Header.Set(name, value)
	}
	response, err := c.Do(request)
	if err != nil {
		q.h.t.Fatal(err)
	}
	response.Body.Close()
	if response.StatusCode != expected {
		q.h.t.Fatalf("drop-response commit status %d want %d", response.StatusCode, expected)
	}
	q.h.t.Logf("%s %s: committed status=%d; client discarded response before receipt parsing", method, independentRoute(path), response.StatusCode)
}

func independentField(t *testing.T, field string, actual *string, expected string) {
	t.Helper()
	if actual == nil || *actual != expected {
		t.Errorf("profile field %s mismatch, expected synthetic provider value", field)
	}
}

func TestIndependentProfileSynchronization(t *testing.T) {
	t.Run("full_and_repeated_login", func(t *testing.T) {
		q := newIndependentFixture(t, nil)
		first := q.person("profile-full")
		a := decodeMeetingTest[profileResponse](t, q.req(first.client, "GET", "/api/v1/me/profile", nil, nil, 200))
		independentField(t, "login", a.Login, "profile_fixture")
		independentField(t, "first_name", a.FirstName, "Александр")
		independentField(t, "last_name", a.LastName, "Тестов")
		independentField(t, "birthday", a.Birthday, "1990-12-23")
		independentField(t, "sex", a.Sex, "male")
		independentField(t, "email", a.Email, "profile@example.test")
		independentField(t, "phone", a.Phone, "+79990000000")
		if a.Provider != "yandex" || a.DisplayName != "Александр Тестов" || a.AvatarURL == nil || !strings.Contains(*a.AvatarURL, "fixture/portrait") {
			t.Fatal("profile differs from verified provider")
		}
		second := q.person("profile-updated")
		b := decodeMeetingTest[profileResponse](t, q.req(second.client, "GET", "/api/v1/me/profile", nil, nil, 200))
		old := decodeMeetingTest[profileResponse](t, q.req(first.client, "GET", "/api/v1/me/profile", nil, nil, 200))
		if a.ID != b.ID || a.ID != old.ID || b.DisplayName != "Алексей Тестов" || old.DisplayName != b.DisplayName {
			t.Error("relogin changed identity, lost update or revoked old session")
		}
		independentField(t, "first_name", old.FirstName, "Алексей")
		q.req(q.h.anonymous, "POST", "/api/v1/auth/yandex/start", map[string]any{"client_kind": "web", "return_context": map[string]string{"kind": "home"}, "first_name": "client-controlled"}, map[string]string{"Origin": q.h.server.URL}, 400)
		absent := q.person("p9")
		empty := decodeMeetingTest[profileResponse](t, q.req(absent.client, "GET", "/api/v1/me/profile", nil, nil, 200))
		if empty.Login != nil || empty.FirstName != nil || empty.LastName != nil || empty.Birthday != nil || empty.Sex != nil || empty.Phone != nil || empty.Email != nil || empty.AvatarURL != nil {
			t.Error("missing profile fields fabricated")
		}
		t.Log("Real Yandex JSON decoder used with closed fake transport; no actual OAuth/network claim")
	})
	t.Run("partial_birthday_unknown_sex", func(t *testing.T) {
		q := newIndependentFixture(t, nil)
		person := q.person("profile-partial")
		value := q.req(person.client, "GET", "/api/v1/me/profile", nil, nil, 200)
		profile := decodeMeetingTest[profileResponse](t, value)
		independentField(t, "birthday", profile.Birthday, "0000-12-23")
		if profile.Sex != nil || profile.FirstName != nil || bytes.Contains(value, []byte(`"age"`)) {
			t.Error("partial birthday or missing sex fabricated")
		}
	})
	t.Run("explicit_clear_missing_permissions", func(t *testing.T) {
		q := newIndependentFixture(t, nil)
		first := q.person("profile-full")
		cleared := q.person("profile-clear")
		value := decodeMeetingTest[profileResponse](t, q.req(cleared.client, "GET", "/api/v1/me/profile", nil, nil, 200))
		if value.ID != first.me.User.ID || value.Birthday != nil {
			t.Error("explicit birthday null not applied")
		}
		independentField(t, "first_name", value.FirstName, "Александр")
		next := q.person("profile-no-contacts")
		current := decodeMeetingTest[profileResponse](t, q.req(next.client, "GET", "/api/v1/me/profile", nil, nil, 200))
		independentField(t, "email", current.Email, "profile@example.test")
		independentField(t, "phone", current.Phone, "+79990000000")
		independentField(t, "first_name", current.FirstName, "Александр")
		if current.Birthday != nil || current.ID != value.ID {
			t.Error("missing provider fields reversed explicit null or changed identity")
		}
		q.req(first.client, "GET", "/api/v1/me/profile", nil, nil, 200)
		t.Log("Provider documents contain no contact fields/scopes in later token; decoder does not fabricate newly granted scopes")
	})
}

func TestIndependentUTCExactCutoff(t *testing.T) {
	for _, offset := range []int64{-1, 0, 1} {
		t.Run(time.Duration(offset*time.Second.Nanoseconds()).String(), func(t *testing.T) {
			q := newIndependentFixture(t, nil)
			owner, guest := q.person("p0"), q.person("p1")
			m := q.create(owner, "", "2026-10-27T11:00:00Z", "UTC")
			q.h.clock.Add(offset)
			expected := 409
			if offset < 0 {
				expected = 200
			}
			result := q.rsvp(guest, m, "going", "0", q.key(), expected)
			if expected == 200 && !result.CanAccessFeed {
				t.Error("UTC before-cutoff denied")
			}
			if expected == 409 {
				q.req(guest.client, "GET", m.base+"/feed", nil, nil, 403)
			}
		})
	}
}

func TestIndependentPublicationReplayAndAccessMatrix(t *testing.T) {
	q := newIndependentFixture(t, nil)
	owner, guest, outsider := q.person("p0"), q.person("p1"), q.person("p2")
	m := q.create(owner, "2026-10-27", "", "UTC")
	q.rsvp(guest, m, "going", "0", q.key(), 200)
	png := independentPNG(t)
	pdf := []byte("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n")
	q.h.clock.Store(time.Date(2026, 10, 28, 0, 0, 0, 0, time.UTC).Unix())
	job, err := q.h.app.ClaimTransition(t.Context(), meetings.DefaultTransitionOptions())
	if err != nil {
		t.Fatal(err)
	}
	if err = q.h.app.CompleteTransition(t.Context(), job); err != nil {
		t.Fatal(err)
	}
	type item struct {
		media     mediaResponse
		key       string
		published independentPublished
		body      map[string]any
	}
	var saved []item
	for _, spec := range []struct {
		purpose, kind string
		content       []byte
		caption       string
	}{{"message", "image/png", png, ""}, {"message", "application/pdf", pdf, "Синтетическая подпись"}, {"memory", "image/png", png, ""}} {
		media := q.reserve(guest, m, spec.purpose, spec.kind, len(spec.content))
		path := m.base + "/media/" + media.ID
		q.raw(guest.client, "PUT", path+"/content", spec.kind, spec.content, q.headers(guest, ""), 200)
		key := q.key()
		body := map[string]any{}
		if spec.caption != "" {
			body["caption"] = spec.caption
		}
		published := decodeMeetingTest[independentPublished](t, q.req(guest.client, "POST", path+"/publish", body, q.headers(guest, key), 200))
		saved = append(saved, item{media, key, published, body})
	}
	failed := q.reserve(guest, m, "message", "image/png", len(png))
	q.raw(guest.client, "PUT", m.base+"/media/"+failed.ID+"/content", "image/png", bytes.Repeat([]byte("x"), len(png)), q.headers(guest, ""), 422)
	q.req(guest.client, "POST", m.base+"/media/"+failed.ID+"/publish", map[string]any{}, q.headers(guest, q.key()), 409)
	for _, entry := range saved {
		replay := decodeMeetingTest[independentPublished](t, q.req(guest.client, "POST", m.base+"/media/"+entry.media.ID+"/publish", entry.body, q.headers(guest, entry.key), 200))
		if replay.Media.ID != entry.media.ID {
			t.Error("replay changed media")
		}
		if entry.published.Entry != nil && (replay.Entry == nil || replay.Entry.ID != entry.published.Entry.ID) {
			t.Error("replay duplicated message")
		}
	}
	q.req(guest.client, "POST", m.base+"/media/"+saved[0].media.ID+"/publish", map[string]any{"caption": "Недопустимая подпись фото"}, q.headers(guest, q.key()), 422)
	feed := decodeMeetingTest[feedPageResponse](t, q.req(owner.client, "GET", m.base+"/feed", nil, nil, 200))
	for _, entry := range saved[:2] {
		count := 0
		for _, actual := range feed.Entries {
			if actual.ID == entry.published.Entry.ID {
				count++
				if actual.Kind != "message" || actual.PayloadVersion != 1 {
					t.Error("legacy envelope changed")
				}
				var payload map[string]any
				json.Unmarshal(actual.Payload, &payload)
				want := "Фото"
				if entry.media.Kind == "file" {
					want = "Синтетическая подпись"
				}
				if payload["text"] != want {
					t.Error("legacy text/caption changed")
				}
			}
		}
		if count != 1 {
			t.Errorf("published entry occurrences=%d", count)
		}
	}
	album := decodeMeetingTest[struct {
		Photos []mediaResponse `json:"photos"`
	}](t, q.req(owner.client, "GET", m.base+"/memories", nil, nil, 200))
	if len(album.Photos) != 1 || album.Photos[0].ID != saved[2].media.ID {
		t.Error("album retry duplicates or chat photo auto-added")
	}
	paths := []string{m.base, m.base + "/feed", m.base + "/memories"}
	for _, entry := range saved {
		if entry.published.Media.DownloadURL == nil {
			t.Fatal("published download missing")
		}
		paths = append(paths, *entry.published.Media.DownloadURL)
		if entry.media.Kind == "photo" {
			if entry.published.Media.ThumbnailURL == nil {
				t.Fatal("published preview missing")
			}
			paths = append(paths, *entry.published.Media.ThumbnailURL)
		}
	}
	for _, path := range paths {
		q.req(owner.client, "GET", path, nil, nil, 200)
		q.req(guest.client, "GET", path, nil, nil, 200)
		q.req(outsider.client, "GET", path, nil, nil, 403)
		q.req(q.h.anonymous, "GET", path, nil, nil, 401)
	}
	details := q.details(owner, m)
	q.req(owner.client, "PATCH", m.base, map[string]any{"expected_revision": details.Revision, "cover": map[string]string{"media_type": "image/png", "data": base64.StdEncoding.EncodeToString(png)}}, q.headers(owner, q.key()), 200)
	public := q.req(q.h.anonymous, "GET", m.invite, nil, nil, 200)
	preview := decodeMeetingTest[previewResponse](t, public)
	if preview.CoverURL == nil {
		t.Fatal("public cover missing")
	}
	coverURL, _ := url.Parse(*preview.CoverURL)
	q.raw(q.h.anonymous, "GET", coverURL.RequestURI(), "", nil, nil, 200)
	for _, entry := range saved {
		if bytes.Contains(public, []byte(entry.media.ID)) {
			t.Error("public cover/invitation exposes private metadata")
		}
		q.req(q.h.anonymous, "GET", m.invite+"/media/"+entry.media.ID+"/content", nil, nil, 404)
	}
	q.rsvp(guest, m, "not_going", "1", q.key(), 200)
	for _, path := range paths {
		q.req(guest.client, "GET", path, nil, nil, 403)
	}
	for _, entry := range saved {
		q.req(guest.client, "POST", m.base+"/media/"+entry.media.ID+"/publish", entry.body, q.headers(guest, entry.key), 403)
	}
	t.Log("Metadata read through actual feed/album/meeting DTO routes; thumbnail currently shares the authenticated original route")
}

type independentRoundTrip func(*http.Request) (*http.Response, error)

func (f independentRoundTrip) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestIndependentTelegramMockTransport(t *testing.T) {
	clock := time.Date(2026, 10, 27, 10, 0, 0, 0, time.UTC)
	oldTransport := http.DefaultTransport
	defer func() { http.DefaultTransport = oldTransport }()
	calls := 0
	var requests []string
	syntheticSecret := "100000:" + strings.Repeat("synthetic", 4)
	syntheticDestination := "-1000000000000"
	http.DefaultTransport = independentRoundTrip(func(request *http.Request) (*http.Response, error) {
		if request.URL.Host != "api.telegram.org" || !strings.Contains(request.URL.Path, syntheticSecret) {
			return nil, errors.New("unexpected mock-only transport destination")
		}
		body, err := io.ReadAll(request.Body)
		if err != nil {
			return nil, err
		}
		calls++
		var payload map[string]any
		if err = json.Unmarshal(body, &payload); err != nil {
			return nil, err
		}
		if payload["chat_id"] != syntheticDestination {
			t.Error("incorrect mock destination")
		}
		message, _ := payload["text"].(string)
		requests = append(requests, message)
		if calls == 1 {
			return nil, errors.New("synthetic unavailable " + syntheticSecret)
		}
		return &http.Response{StatusCode: 200, Header: make(http.Header), Body: io.NopCloser(strings.NewReader(`{"ok":true,"result":{"message_id":101}}`))}, nil
	})
	delivery, err := telegram.New(syntheticSecret, syntheticDestination)
	if err != nil {
		t.Fatal(err)
	}
	service := support.New(memory.NewSupport(), delivery, func() time.Time { return clock })
	q := newIndependentFixture(t, service)
	key := q.key()
	description := "Синтетическое обращение независимого прогона r2"
	body := map[string]any{"client_request_id": key, "kind": "problem", "description": description, "screen": "meeting_chat", "email": "qa-r2@example.test"}
	receipt := q.req(q.h.anonymous, "POST", "/api/v1/support/feedback", body, map[string]string{"Idempotency-Key": key}, 201)
	var accepted feedbackReceipt
	json.Unmarshal(receipt, &accepted)
	if worked, err := service.DeliverNext(context.Background()); !worked || !errors.Is(err, support.ErrUnavailable) {
		t.Fatal("mock transport failure not retryable", err)
	}
	if worked, err := service.DeliverNext(context.Background()); worked || err != nil || calls != 1 {
		t.Fatal("retry before backoff", err)
	}
	clock = clock.Add(time.Minute)
	if worked, err := service.DeliverNext(context.Background()); !worked || err != nil {
		t.Fatal("recovered transport failed", err)
	}
	if calls != 2 || len(requests) != 2 || requests[0] != requests[1] || !strings.Contains(requests[0], accepted.Reference) || !strings.Contains(requests[1], description) {
		t.Error("retry lost/changed original accepted request")
	}
	if worked, err := service.DeliverNext(context.Background()); worked || err != nil {
		t.Fatal("duplicate queued delivery", err)
	}
	repeat := q.req(q.h.anonymous, "POST", "/api/v1/support/feedback", body, map[string]string{"Idempotency-Key": key}, 201)
	if !bytes.Equal(receipt, repeat) {
		t.Error("receipt changed after delivery")
	}
	for _, private := range []string{syntheticSecret, syntheticDestination, description, "qa-r2@example.test"} {
		if strings.Contains(q.h.logs.String(), private) || bytes.Contains(receipt, []byte(private)) {
			t.Error("support private data in application log/client receipt")
		}
	}
	t.Log("Actual Telegram adapter + closed mock HTTP transport; initial network failure, one-minute backoff, same reference delivered; no external connection")
}
