// Package albumexport prepares temporary private albums without owning meeting data.
package albumexport

import (
	"context"
	"crypto/rand"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

var (
	// ErrBusy means the process or owner already holds its allowed exports.
	ErrBusy = errors.New("album export capacity reached")
	// ErrEmpty means the authorized snapshot contains no photos.
	ErrEmpty = errors.New("album is empty")
	// ErrMissing deliberately does not reveal another owner's export.
	ErrMissing = errors.New("album export unavailable")
	// ErrNotReady means the archive is still preparing or preparation failed.
	ErrNotReady = errors.New("album export not ready")
)

const (
	archiveTTL         = 10 * time.Minute
	preparationTimeout = 2 * time.Minute
)

// Albums exposes only authorized application operations.
type Albums interface {
	MemorySnapshot(context.Context, meetings.Actor, string) ([]meetings.Media, error)
	MediaBytes(context.Context, meetings.Actor, string, string) (meetings.Media, []byte, error)
	CheckMemoryAccess(context.Context, meetings.Actor, string) error
}

// Status contains no server paths or private URLs.
type Status struct {
	ID        string    `json:"id"`
	State     string    `json:"state"`
	Count     int       `json:"count"`
	ExpiresAt time.Time `json:"expires_at"`
}

type job struct {
	status             Status
	actor              meetings.Actor
	meeting, key, path string
	ctx                context.Context
	cancel             context.CancelFunc
	sessionCheck       func(context.Context) error
	preparing          bool
	file               *os.File
}

// Manager bounds held archives to two and removes every temporary file on Close.
type Manager struct {
	mu     sync.Mutex
	albums Albums
	jobs   map[string]*job
	root   string
	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
	now    func() time.Time
}

// New creates a private process-scoped directory and starts access/expiry cleanup.
func New(parent context.Context, albums Albums, now func() time.Time) (*Manager, error) {
	root, err := os.MkdirTemp("", "somewhere-album-")
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithCancel(parent)
	m := &Manager{albums: albums, jobs: map[string]*job{}, root: root, ctx: ctx, cancel: cancel, now: now}
	m.wg.Add(1)
	go m.maintain()

	return m, nil
}

// Close stops all work, closes active readers, and removes the private directory.
func (m *Manager) Close() {
	m.cancel()
	m.mu.Lock()
	for id, item := range m.jobs {
		if item.file != nil {
			_ = item.file.Close()
			item.file = nil
		}

		m.removeLocked(id, item)
	}

	m.mu.Unlock()
	m.wg.Wait()
	_ = os.RemoveAll(m.root)
}

// Start captures photo IDs once; retries with the same key reuse the held job.
// sessionCheck must check the initiating session using the supplied job context.
func (m *Manager) Start(ctx context.Context, actor meetings.Actor, meeting, key string, sessionCheck func(context.Context) error) (Status, error) {
	if sessionCheck == nil {
		return Status{}, meetings.ErrUnauthenticated
	}

	if err := sessionCheck(ctx); err != nil {
		return Status{}, err
	}

	photos, err := m.albums.MemorySnapshot(ctx, actor, meeting)
	if err != nil {
		return Status{}, err
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	m.pruneLocked()
	if m.ctx.Err() != nil || ctx.Err() != nil {
		return Status{}, ErrMissing
	}

	for _, item := range m.jobs {
		if item.actor.ID == actor.ID {
			if item.ctx.Err() == nil && item.meeting == meeting && item.key == key {
				return item.status, nil
			}

			return Status{}, ErrBusy
		}
	}

	if len(photos) == 0 {
		return Status{}, ErrEmpty
	}

	if len(m.jobs) >= 2 {
		return Status{}, ErrBusy
	}

	id := rand.Text()
	jobCtx, cancel := context.WithCancel(m.ctx)
	item := &job{status: Status{ID: id, State: "preparing", Count: len(photos), ExpiresAt: m.now().Add(preparationTimeout)}, actor: actor, meeting: meeting, key: key, path: filepath.Join(m.root, id+".zip"), ctx: jobCtx, cancel: cancel, preparing: true, sessionCheck: sessionCheck}
	m.jobs[id] = item
	m.wg.Add(1)
	go m.prepare(item, photos)

	return item.status, nil
}

// Lookup checks current access and owner on every status or download request.
func (m *Manager) Lookup(ctx context.Context, actor meetings.Actor, meeting, id string) (Status, error) {
	if err := m.albums.CheckMemoryAccess(ctx, actor, meeting); err != nil {
		m.removeOwned(actor.ID, meeting, id)
		return Status{}, err
	}

	m.mu.Lock()
	m.pruneLocked()
	item := m.jobs[id]
	if item == nil || item.ctx.Err() != nil || item.actor.ID != actor.ID || item.meeting != meeting {
		m.mu.Unlock()
		return Status{}, ErrMissing
	}

	m.mu.Unlock()
	if err := item.sessionCheck(ctx); err != nil {
		m.removeOwned(actor.ID, meeting, id)
		return Status{}, ErrMissing
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	if item.ctx.Err() != nil || !m.now().Before(item.status.ExpiresAt) {
		m.removeLocked(id, item)
		return Status{}, ErrMissing
	}

	return item.status, nil
}

// Cancel only removes the requesting owner's export.
func (m *Manager) Cancel(actor meetings.Actor, meeting, id string) {
	m.removeOwned(actor.ID, meeting, id)
}

func (m *Manager) removeOwned(owner, meeting, id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if item := m.jobs[id]; item != nil && item.actor.ID == owner && item.meeting == meeting {
		m.removeLocked(id, item)
	}
}

func (m *Manager) removeLocked(id string, item *job) {
	item.cancel()
	_ = os.Remove(item.path)
	// Keep the capacity lease until I/O exits, including an unlinked open download.
	if !item.preparing && item.file == nil {
		delete(m.jobs, id)
	}
}

func (m *Manager) pruneLocked() {
	for id, item := range m.jobs {
		if item.ctx.Err() != nil || !m.now().Before(item.status.ExpiresAt) {
			m.removeLocked(id, item)
		}
	}
}

func (m *Manager) authorize(ctx context.Context, item *job) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	if err := item.ctx.Err(); err != nil {
		return err
	}

	if err := item.sessionCheck(ctx); err != nil {
		return err
	}

	return m.albums.CheckMemoryAccess(ctx, item.actor, item.meeting)
}

func (m *Manager) maintain() {
	defer m.wg.Done()
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-m.ctx.Done():
			return
		case <-ticker.C:
			m.sweep()
		}
	}
}

func (m *Manager) sweep() {
	m.mu.Lock()
	m.pruneLocked()
	items := make([]*job, 0, len(m.jobs))
	for _, item := range m.jobs {
		items = append(items, item)
	}

	m.mu.Unlock()
	for _, item := range items {
		ctx, cancel := context.WithTimeout(item.ctx, time.Second)
		err := m.authorize(ctx, item)
		cancel()
		if err != nil {
			m.removeOwned(item.actor.ID, item.meeting, item.status.ID)
		}
	}
}
