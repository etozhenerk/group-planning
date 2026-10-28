package httpapi

import (
	"context"
	"errors"
	"io"
	"mime"
	"net/http"
	"strconv"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/albumexport"
	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (h meetingHandlers) memorySnapshot(w http.ResponseWriter, r *http.Request) {
	if !getOnly(w, r) {
		return
	}

	actor, ok := h.actor(w, r, false)
	if !ok {
		return
	}

	id, ok := parseMeetingID(w, r)
	if !ok {
		return
	}

	if _, ok := closedQuery(w, r); !ok {
		return
	}

	items, err := h.app.MemorySnapshot(r.Context(), actor, id)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	ids := make([]string, 0, len(items))
	for _, item := range items {
		ids = append(ids, item.UploadedBy.ID)
	}

	users, err := h.identity.Users(r.Context(), ids)
	if err != nil {
		h.writeMeetingError(w, err)
		return
	}

	photos := make([]mediaResponse, 0, len(items))
	for _, item := range items {
		photos = append(photos, mediaDTO(item, users))
	}

	writeJSON(w, http.StatusOK, struct {
		Photos     []mediaResponse `json:"photos"`
		NextCursor *string         `json:"next_cursor"`
	}{Photos: photos})
}

func registerAlbumExports(mux *http.ServeMux, app *meetings.Service, auth *identity.Service, manager *albumexport.Manager) {
	h := meetingHandlers{app: app, identity: auth, auth: authHandlers{service: auth}}
	mux.HandleFunc("/api/v1/meetings/{id}/memories/exports", func(w http.ResponseWriter, r *http.Request) {
		if !requireMethod(w, r, http.MethodPost) {
			return
		}

		actor, meeting, ok := h.exportRequest(w, r, manager, true)
		if !ok {
			return
		}

		key, ok := requestKey(w, r)
		if !ok {
			return
		}

		var input struct{}
		if !decodeJSON(w, r, &input) {
			return
		}

		status, err := manager.Start(r.Context(), actor, meeting, key, h.exportSession(r, actor))
		if err != nil {
			h.writeExportError(w, err)
			return
		}

		writeJSON(w, http.StatusAccepted, status)
	})
	mux.HandleFunc("/api/v1/meetings/{id}/memories/exports/{export_id}", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodDelete {
			w.Header().Set("Allow", "GET, DELETE")
			writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", nil)

			return
		}

		actor, meeting, ok := h.exportRequest(w, r, manager, r.Method == http.MethodDelete)
		if !ok {
			return
		}

		id := r.PathValue("export_id")
		status, err := manager.Lookup(r.Context(), actor, meeting, id)
		if err != nil {
			h.writeExportError(w, err)
			return
		}

		if r.Method == http.MethodDelete {
			manager.Cancel(actor, meeting, id)
			w.WriteHeader(http.StatusNoContent)

			return
		}

		writeJSON(w, http.StatusOK, status)
	})
	mux.HandleFunc("/api/v1/meetings/{id}/memories/exports/{export_id}/download", func(w http.ResponseWriter, r *http.Request) {
		if !requireMethod(w, r, http.MethodGet) {
			return
		}

		actor, meeting, ok := h.exportRequest(w, r, manager, false)
		if !ok {
			return
		}

		file, err := manager.Open(r.Context(), actor, meeting, r.PathValue("export_id"), h.exportSession(r, actor))
		if err != nil {
			h.writeExportError(w, err)
			return
		}
		defer file.Close()
		if err := http.NewResponseController(w).SetWriteDeadline(time.Now().Add(10 * time.Minute)); err != nil && !errors.Is(err, http.ErrNotSupported) {
			h.writeExportError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/zip")
		w.Header().Set("Content-Disposition", mime.FormatMediaType("attachment", map[string]string{"filename": "somewhere-photos.zip"}))
		w.Header().Set("Content-Length", strconv.FormatInt(file.Size(), 10))
		// A canceled job must also interrupt a client blocked on the network write.
		interrupted := make(chan struct{})
		stop := context.AfterFunc(file.Context(), func() {
			defer close(interrupted)
			_ = http.NewResponseController(w).SetWriteDeadline(time.Now())
		})
		defer func() {
			if !stop() {
				<-interrupted
			}
		}()
		w.WriteHeader(http.StatusOK)
		if _, err := io.CopyBuffer(w, file, make([]byte, 32<<10)); err != nil {
			// Never finish a truncated 200 as a successful download.
			panic(http.ErrAbortHandler)
		}
	})
}

func (h meetingHandlers) exportRequest(w http.ResponseWriter, r *http.Request, manager *albumexport.Manager, mutation bool) (meetings.Actor, string, bool) {
	w.Header().Set("Cache-Control", "no-store")
	actor, ok := h.actor(w, r, mutation)
	if !ok {
		return meetings.Actor{}, "", false
	}

	id, ok := parseMeetingID(w, r)
	if !ok {
		return meetings.Actor{}, "", false
	}

	if _, ok := closedQuery(w, r); !ok {
		return meetings.Actor{}, "", false
	}

	if manager == nil {
		writeError(w, http.StatusServiceUnavailable, "media_unavailable", nil)
		return meetings.Actor{}, "", false
	}

	return actor, id, true
}

func (h meetingHandlers) writeExportError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, identity.ErrUnauthenticated), errors.Is(err, identity.ErrForbidden), errors.Is(err, identity.ErrUnavailable):
		writeAuthError(w, err)
	case errors.Is(err, albumexport.ErrBusy):
		w.Header().Set("Retry-After", "5")
		writeError(w, http.StatusTooManyRequests, "album_export_busy", nil)
	case errors.Is(err, albumexport.ErrEmpty):
		writeError(w, http.StatusConflict, "album_empty", nil)
	case errors.Is(err, albumexport.ErrMissing):
		writeError(w, http.StatusNotFound, "not_found", nil)
	case errors.Is(err, albumexport.ErrNotReady):
		writeError(w, http.StatusConflict, "album_export_pending", nil)
	default:
		h.writeMeetingError(w, err)
	}
}

// Credentials are copied once; background work must not retain the POST context.
func (h meetingHandlers) exportSession(r *http.Request, actor meetings.Actor) func(context.Context) error {
	token, web, credentialError := sessionCredentials(r)

	return func(ctx context.Context) error {
		if credentialError != nil {
			return credentialError
		}

		principal, err := h.identity.Authenticate(ctx, token, web)
		if err != nil {
			return err
		}

		if principal.User.ID != actor.ID {
			return meetings.ErrUnauthenticated
		}

		return nil
	}
}
