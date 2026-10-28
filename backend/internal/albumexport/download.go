package albumexport

import (
	"context"
	"os"
	"sync"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

// Download checks cancellation on each read and current access every second.
// The caller must Close even when the network write fails.
type Download struct {
	file       *os.File
	ctx        context.Context
	jobContext context.Context
	check      func() error
	close      func()
	once       sync.Once
	lastCheck  time.Time
	size       int64
}

// Open allows a single active download and consumes its temporary file on Close.
func (m *Manager) Open(ctx context.Context, actor meetings.Actor, meeting, id string, sessionCheck func(context.Context) error) (*Download, error) {
	if sessionCheck == nil {
		return nil, meetings.ErrUnauthenticated
	}

	if err := sessionCheck(ctx); err != nil {
		return nil, err
	}

	status, err := m.Lookup(ctx, actor, meeting, id)
	if err != nil {
		return nil, err
	}

	if status.State != "ready" {
		return nil, ErrNotReady
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	m.pruneLocked()
	item := m.jobs[id]
	if item == nil || item.file != nil || item.ctx.Err() != nil {
		return nil, ErrMissing
	}

	file, err := os.Open(item.path)
	if err != nil {
		return nil, err
	}

	info, err := file.Stat()
	if err != nil {
		_ = file.Close()
		return nil, err
	}

	item.file = file
	check := func() error {
		if err := sessionCheck(ctx); err != nil {
			return err
		}

		return m.authorize(ctx, item)
	}

	return &Download{file: file, size: info.Size(), ctx: ctx, jobContext: item.ctx, check: check, close: func() {
		m.mu.Lock()
		defer m.mu.Unlock()
		item.file = nil
		m.removeLocked(id, item)
	}}, nil
}

// Context is canceled by expiry, revocation, cancellation or manager shutdown.
func (d *Download) Context() context.Context { return d.jobContext }

// Size is the size of the fully prepared archive, for truncation detection by HTTP.
func (d *Download) Size() int64 { return d.size }

// Read returns no further bytes after cancellation or a failed access check.
func (d *Download) Read(buffer []byte) (int, error) {
	if err := d.ctx.Err(); err != nil {
		return 0, err
	}

	if err := d.jobContext.Err(); err != nil {
		return 0, err
	}

	if time.Since(d.lastCheck) >= time.Second {
		if err := d.check(); err != nil {
			return 0, err
		}

		d.lastCheck = time.Now()
	}

	return d.file.Read(buffer)
}

// Close releases the only download lease and deletes the temporary archive.
func (d *Download) Close() error {
	var err error
	d.once.Do(func() { err = d.file.Close(); d.close() })

	return err
}
