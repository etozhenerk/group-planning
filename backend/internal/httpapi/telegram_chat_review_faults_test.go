package httpapi

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

// A new ID arms one exact request. Empty control is inert. No client header,
// product endpoint or production environment variable can activate these faults.
type chatReviewControl struct {
	ID      string `json:"id"`
	Method  string `json:"method"`
	Path    string `json:"path"`
	ActorID string `json:"actorId"`
	Mode    string `json:"mode"`
	DelayMS int    `json:"delayMs"`
}

type chatReviewFaults struct {
	mu        sync.Mutex
	directory string
	auth      *identity.Service
	consumed  map[string]bool
}

type chatReviewFaultEvent struct {
	ID       string    `json:"id"`
	Method   string    `json:"method"`
	Path     string    `json:"path"`
	Mode     string    `json:"mode"`
	Injected bool      `json:"injected"`
	Status   int       `json:"apiStatus"`
	KeyHash  string    `json:"keySha256"`
	BodyHash string    `json:"bodySha256"`
	At       time.Time `json:"at"`
}

func (f *chatReviewFaults) handler(api http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		data, err := os.ReadFile(filepath.Join(f.directory, "control.json"))
		if err != nil {
			http.Error(w, "fixture control unavailable", 500)
			return
		}

		var control chatReviewControl
		if json.Unmarshal(data, &control) != nil {
			http.Error(w, "invalid fixture control", 500)
			return
		}

		if control.ID == "" {
			api.ServeHTTP(w, r)
			return
		}

		if !validChatReviewControl(control) {
			http.Error(w, "invalid fixture control", 500)
			return
		}

		if r.Method != control.Method || r.URL.Path != control.Path {
			api.ServeHTTP(w, r)
			return
		}

		principal, _, err := (authHandlers{service: f.auth}).authenticate(r)
		if err != nil || principal.User.ID != control.ActorID {
			api.ServeHTTP(w, r)
			return
		}

		body, err := io.ReadAll(io.LimitReader(r.Body, 21<<20))
		if err != nil {
			http.Error(w, "fixture request unavailable", 500)
			return
		}

		r.Body = io.NopCloser(bytes.NewReader(body))
		f.mu.Lock()
		inject := !f.consumed[control.ID]
		f.consumed[control.ID] = true
		f.mu.Unlock()
		event := chatReviewFaultEvent{
			ID: control.ID, Method: r.Method, Path: r.URL.Path, Mode: control.Mode, Injected: inject,
			KeyHash:  fmt.Sprintf("%x", sha256.Sum256([]byte(r.Header.Get("Idempotency-Key")))),
			BodyHash: fmt.Sprintf("%x", sha256.Sum256(body)), At: time.Now().UTC(),
		}
		if inject && control.DelayMS > 0 {
			timer := time.NewTimer(time.Duration(control.DelayMS) * time.Millisecond)
			defer timer.Stop()
			select {
			case <-r.Context().Done():
				event.Status = 499
				if err := f.record(event); err != nil {
					http.Error(w, "fixture audit unavailable", 500)
				}

				return
			case <-timer.C:
			}
		}

		reply := httptest.NewRecorder()
		if inject && control.Mode == "error" {
			writeError(reply, 503, "fixture_unavailable", nil)
		} else {
			api.ServeHTTP(reply, r)
		}

		event.Status = reply.Code
		if err := f.record(event); err != nil {
			http.Error(w, "fixture audit unavailable", 500)
			return
		}

		if inject && control.Mode == "lost" && reply.Code >= 200 && reply.Code < 300 {
			writeError(w, 503, "fixture_response_lost_after_commit", nil)
			return
		}

		copyIOSReply(w, reply)
	})
}

func validChatReviewControl(c chatReviewControl) bool {
	prefix := "/api/v1/meetings/" + chatReviewMeetingID
	visualPrefix := "/api/v1/meetings/" + chatReviewVisualID
	allowedPath := c.Path == prefix || strings.HasPrefix(c.Path, prefix+"/") || c.Path == visualPrefix || strings.HasPrefix(c.Path, visualPrefix+"/")
	allowedMethod := c.Method == http.MethodGet || c.Method == http.MethodPost || c.Method == http.MethodPut || c.Method == http.MethodPatch
	knownActor := false
	for i := range chatReviewPeople[:3] {
		knownActor = knownActor || c.ActorID == chatReviewActor(i).ID
	}

	return allowedPath && allowedMethod && knownActor && c.DelayMS >= 0 && c.DelayMS <= 30000 &&
		(c.Mode == "pending" && c.DelayMS > 0 || c.Mode == "error" || c.Mode == "lost" && c.Method != http.MethodGet)
}

func (f *chatReviewFaults) record(event chatReviewFaultEvent) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	file, err := os.OpenFile(filepath.Join(f.directory, "control-events.jsonl"), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o600)
	if err != nil {
		return err
	}

	err = json.NewEncoder(file).Encode(event)
	closeErr := file.Close()
	if err != nil {
		return err
	}

	return closeErr
}
