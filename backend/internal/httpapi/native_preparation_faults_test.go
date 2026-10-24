package httpapi

import (
	"bytes"
	"io"
	"net/http"
	"strings"
	"sync"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type nativeTaskRetry struct {
	key, body string
	attempts  int
	exact     bool
}

type nativePreparationFaults struct {
	mu           sync.Mutex
	store        meetings.Store
	service      *meetings.Service
	peopleReads  int
	peopleFailAt int
	conflict     bool
	retries      map[string]*nativeTaskRetry
}

func (f *nativePreparationFaults) handler(api http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		scenario := r.Header.Get("X-Somewhere-Test-Scenario")
		f.mu.Lock()
		fail := false
		if scenario == "task-owner" && strings.HasSuffix(r.URL.Path, "/participants") {
			f.peopleReads++
			fail = f.peopleReads == f.peopleFailAt
		}

		retry := r.Method == http.MethodPost && (scenario == "task-owner" && strings.HasSuffix(r.URL.Path, "/preparation-tasks") || scenario == "task-recipient" && strings.HasSuffix(r.URL.Path, "/accept"))
		if retry {
			data, err := io.ReadAll(r.Body)
			if err != nil {
				f.mu.Unlock()
				http.Error(w, "fixture body read failed", 500)

				return
			}

			r.Body = io.NopCloser(bytes.NewReader(data))
			if f.retries == nil {
				f.retries = map[string]*nativeTaskRetry{}
			}

			record := f.retries[scenario]
			if record == nil {
				record = &nativeTaskRetry{key: r.Header.Get("Idempotency-Key"), body: string(data), exact: true}
				f.retries[scenario] = record
				fail = true
			}

			record.attempts++
			record.exact = record.exact && record.key != "" && record.key == r.Header.Get("Idempotency-Key") && record.body == string(data)
		}

		conflict := scenario == "task-conflict" && r.Method == http.MethodPost && strings.HasSuffix(r.URL.Path, "/accept") && !f.conflict
		if conflict {
			f.conflict = true
		}

		f.mu.Unlock()
		if fail {
			http.Error(w, "fixture unavailable before commit", 503)
			return
		}

		if conflict {
			parts := strings.Split(r.URL.Path, "/")
			var task meetings.PreparationTask
			err := f.store.View(r.Context(), func(reader meetings.Reader) error {
				var err error
				task, err = reader.PreparationTask(parts[len(parts)-2])

				return err
			})
			if err == nil {
				_, err = f.service.ActOnPreparationTask(r.Context(), task.Author, task.MeetingID, task.ID, meetings.PreparationActionInput{Action: meetings.TaskAccept, ExpectedRevision: 1}, "d3c70000-0000-4000-8000-000000000599")
			}

			if err != nil {
				http.Error(w, "fixture conflict failed", 500)
				return
			}
		}

		api.ServeHTTP(w, r)
	})
}
