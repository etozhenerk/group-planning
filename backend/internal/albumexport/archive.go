package albumexport

import (
	"archive/zip"
	"context"
	"fmt"
	"io"
	"os"
	"path"
	"strings"
	"unicode"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func (m *Manager) prepare(item *job, photos []meetings.Media) {
	defer m.wg.Done()
	ctx, stop := context.WithTimeout(item.ctx, preparationTimeout)
	defer stop()
	err := m.writeArchive(ctx, item, photos)
	if err == nil {
		err = ctx.Err()
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	item.preparing = false
	if m.jobs[item.status.ID] != item || item.ctx.Err() != nil {
		m.removeLocked(item.status.ID, item)
		return
	}

	if err != nil {
		_ = os.Remove(item.path)
		item.status.State = "failed"

		return
	}

	item.status.State = "ready"
	item.status.ExpiresAt = m.now().Add(archiveTTL)
}

func (m *Manager) writeArchive(ctx context.Context, item *job, photos []meetings.Media) error {
	file, err := os.OpenFile(item.path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		return err
	}
	defer file.Close()
	archive := zip.NewWriter(&boundedWriter{writer: file, remaining: int64(meetings.MaxMeetingMediaBytes) + int64(len(photos))*2048 + 1024})
	total := 0
	for index, photo := range photos {
		if err := m.authorize(ctx, item); err != nil {
			return err
		}

		current, data, err := m.albums.MediaBytes(ctx, item.actor, item.meeting, photo.ID)
		if err != nil {
			return err
		}

		total += len(data)
		if current.ID != photo.ID || current.BlobKey != photo.BlobKey || current.SizeBytes != photo.SizeBytes || current.ContentType != photo.ContentType || current.MeetingID != item.meeting || current.Kind != "photo" || current.Purpose != "memory" || current.Status != "published" || len(data) != current.SizeBytes || len(data) > meetings.MaxPhotoBytes || total > meetings.MaxMeetingMediaBytes {
			return ErrMissing
		}

		header := &zip.FileHeader{Name: archiveName(index, current.FileName), Method: zip.Store, Modified: current.CreatedAt}
		header.SetMode(0o600)
		entry, err := archive.CreateHeader(header)
		if err != nil {
			return err
		}

		if _, err := entry.Write(data); err != nil {
			return err
		}
	}

	if err := m.authorize(ctx, item); err != nil {
		return err
	}

	if err := archive.Close(); err != nil {
		return err
	}

	return file.Close()
}

func archiveName(index int, original string) string {
	name := path.Base(strings.ReplaceAll(original, "\\", "/"))
	name = strings.Map(func(value rune) rune {
		if unicode.IsControl(value) || strings.ContainsRune(":*?\"<>|", value) {
			return '_'
		}

		return value
	}, name)
	name = strings.Trim(name, " .")
	if name == "" {
		name = "photo"
	}

	runes := []rune(name)
	if len(runes) > 120 {
		name = string(runes[:120])
	}

	return fmt.Sprintf("%05d-%s", index+1, name)
}

// boundedWriter also covers headers and central directory, including ZIP64.
type boundedWriter struct {
	writer    io.Writer
	remaining int64
}

func (w *boundedWriter) Write(data []byte) (int, error) {
	if int64(len(data)) > w.remaining {
		return 0, ErrMissing
	}

	n, err := w.writer.Write(data)
	w.remaining -= int64(n)

	return n, err
}
