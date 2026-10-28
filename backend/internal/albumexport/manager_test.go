package albumexport

import (
	"archive/zip"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type testAlbums struct {
	mu            sync.Mutex
	photos        []meetings.Media
	bytes         map[string][]byte
	denied        atomic.Bool
	gate, entered chan struct{}
	once          sync.Once
}

func (a *testAlbums) MemorySnapshot(ctx context.Context, actor meetings.Actor, meeting string) ([]meetings.Media, error) {
	if err := a.CheckMemoryAccess(ctx, actor, meeting); err != nil {
		return nil, err
	}

	a.mu.Lock()
	defer a.mu.Unlock()

	return append([]meetings.Media{}, a.photos...), nil
}

func (a *testAlbums) CheckMemoryAccess(ctx context.Context, _ meetings.Actor, _ string) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	if a.denied.Load() {
		return meetings.ErrForbidden
	}

	return nil
}

func (a *testAlbums) MediaBytes(ctx context.Context, actor meetings.Actor, meeting, id string) (meetings.Media, []byte, error) {
	if a.gate != nil {
		a.once.Do(func() { close(a.entered) })
		<-a.gate
	}

	if err := a.CheckMemoryAccess(ctx, actor, meeting); err != nil {
		return meetings.Media{}, nil, err
	}

	a.mu.Lock()
	defer a.mu.Unlock()
	for _, photo := range a.photos {
		if photo.ID == id {
			return photo, bytes.Clone(a.bytes[id]), nil
		}
	}

	return meetings.Media{}, nil, meetings.ErrNotFound
}

func albumsFixture(count int) *testAlbums {
	a := &testAlbums{bytes: map[string][]byte{}}
	for index := range count {
		a.add(index)
	}

	return a
}

func (a *testAlbums) add(index int) {
	a.mu.Lock()
	defer a.mu.Unlock()
	id := fmt.Sprint(index)
	data := []byte("original-photo-" + id)
	a.photos = append(a.photos, meetings.Media{ID: id, MeetingID: "meeting", BlobKey: id, FileName: "../same\\portrait.jpg", ContentType: "image/jpeg", Kind: "photo", Purpose: "memory", Status: "published", SizeBytes: len(data), CreatedAt: time.Now()})
	a.bytes[id] = data
}
func validSession(ctx context.Context) error { return ctx.Err() }

var testActor = meetings.Actor{ID: "owner", Name: "Owner"}

func newManager(t *testing.T, a Albums) *Manager {
	t.Helper()
	m, err := New(t.Context(), a, time.Now)
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(m.Close)

	return m
}

func begin(t *testing.T, m *Manager, actor meetings.Actor, key string) Status {
	t.Helper()
	status, err := m.Start(t.Context(), actor, "meeting", key, validSession)
	if err != nil {
		t.Fatal(err)
	}

	return status
}

func awaitState(t *testing.T, m *Manager, actor meetings.Actor, id, state string) Status {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		status, err := m.Lookup(t.Context(), actor, "meeting", id)
		if err != nil {
			t.Fatal(err)
		}

		if status.State == state {
			return status
		}

		time.Sleep(time.Millisecond)
	}

	t.Fatal("export did not reach " + state)

	return Status{}
}

func assertMissing(t *testing.T, m *Manager, actor meetings.Actor, id string) {
	t.Helper()
	if _, err := m.Lookup(t.Context(), actor, "meeting", id); !errors.Is(err, ErrMissing) {
		t.Fatalf("export remained accessible: %v", err)
	}
}

func TestArchiveFullFrozenSnapshotOriginalBytesAndSafeNames(t *testing.T) {
	a := albumsFixture(103)
	a.gate, a.entered = make(chan struct{}), make(chan struct{})
	m := newManager(t, a)
	first := begin(t, m, testActor, "one")
	<-a.entered
	if _, err := m.Open(t.Context(), testActor, "meeting", first.ID, validSession); !errors.Is(err, ErrNotReady) {
		t.Fatalf("early archive: %v", err)
	}

	a.add(103)
	repeated := begin(t, m, testActor, "one")
	if repeated.ID != first.ID || repeated.Count != 103 {
		t.Fatal("retry changed snapshot")
	}

	close(a.gate)
	awaitState(t, m, testActor, first.ID, "ready")
	for name, permissions := range map[string]os.FileMode{m.root: 0o700, filepath.Join(m.root, first.ID+".zip"): 0o600} {
		info, err := os.Stat(name)
		if err != nil || info.Mode().Perm() != permissions {
			t.Fatalf("private mode: %v %v", info, err)
		}
	}

	download, err := m.Open(t.Context(), testActor, "meeting", first.ID, validSession)
	if err != nil {
		t.Fatal(err)
	}

	if _, err := m.Open(t.Context(), testActor, "meeting", first.ID, validSession); !errors.Is(err, ErrMissing) {
		t.Fatalf("duplicate reader: %v", err)
	}

	data, err := io.ReadAll(download)
	if err != nil || int64(len(data)) != download.Size() {
		t.Fatalf("read: %v", err)
	}

	archive, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil || len(archive.File) != 103 {
		t.Fatalf("archive count or integrity: %v", err)
	}

	seen := map[string]bool{}
	for index, file := range archive.File {
		if strings.ContainsAny(file.Name, "/\\:") || seen[file.Name] {
			t.Fatalf("unsafe duplicate %q", file.Name)
		}

		seen[file.Name] = true
		reader, err := file.Open()
		if err != nil {
			t.Fatal(err)
		}

		original, err := io.ReadAll(reader)
		_ = reader.Close()
		if err != nil || !bytes.Equal(original, a.bytes[fmt.Sprint(index)]) {
			t.Fatalf("photo %d transformed: %v", index, err)
		}
	}

	if err := download.Close(); err != nil {
		t.Fatal(err)
	}

	assertMissing(t, m, testActor, first.ID)
	entries, err := os.ReadDir(m.root)
	if err != nil || len(entries) != 0 {
		t.Fatal("completed archive retained", err)
	}
}

func TestCanceledPreparationRetainsCapacityUntilIOExits(t *testing.T) {
	a := albumsFixture(1)
	a.gate, a.entered = make(chan struct{}), make(chan struct{})
	m := newManager(t, a)
	first := begin(t, m, testActor, "first")
	<-a.entered
	m.Cancel(testActor, "meeting", first.ID)
	assertMissing(t, m, testActor, first.ID)
	if _, err := m.Start(t.Context(), testActor, "meeting", "second", validSession); !errors.Is(err, ErrBusy) {
		t.Fatalf("canceled IO released owner slot: %v", err)
	}

	other := meetings.Actor{ID: "other"}
	begin(t, m, other, "other")
	if _, err := m.Start(t.Context(), meetings.Actor{ID: "third"}, "meeting", "third", validSession); !errors.Is(err, ErrBusy) {
		t.Fatalf("more than two slots: %v", err)
	}

	close(a.gate)
	deadline := time.Now().Add(time.Second)
	for {
		_, err := m.Start(t.Context(), testActor, "meeting", "retry", validSession)
		if err == nil {
			break
		}

		if !errors.Is(err, ErrBusy) || time.Now().After(deadline) {
			t.Fatalf("capacity not released: %v", err)
		}

		time.Sleep(time.Millisecond)
	}
}

func TestConcurrentRetriesOwnExactlyOneLease(t *testing.T) {
	m := newManager(t, albumsFixture(1))
	var wg sync.WaitGroup
	ids := make(chan string, 20)
	for range 20 {
		wg.Go(func() {
			status, err := m.Start(t.Context(), testActor, "meeting", "same", validSession)
			if err != nil {
				t.Error(err)
				return
			}

			ids <- status.ID
		})
	}

	wg.Wait()
	close(ids)
	unique := map[string]bool{}
	for id := range ids {
		unique[id] = true
	}

	if len(unique) != 1 {
		t.Fatal("duplicate jobs", unique)
	}
}

func TestAccessExpirySessionAndShutdownCleanup(t *testing.T) {
	for _, cause := range []string{"expiry", "session", "membership", "cancel", "close"} {
		t.Run(cause, func(t *testing.T) {
			a := albumsFixture(1)
			m := newManager(t, a)
			var revoked atomic.Bool
			check := func(ctx context.Context) error {
				if revoked.Load() {
					return meetings.ErrUnauthenticated
				}

				return ctx.Err()
			}
			status, err := m.Start(t.Context(), testActor, "meeting", cause, check)
			if err != nil {
				t.Fatal(err)
			}

			awaitState(t, m, testActor, status.ID, "ready")
			assertMissing(t, m, meetings.Actor{ID: "other"}, status.ID)
			download, err := m.Open(t.Context(), testActor, "meeting", status.ID, validSession)
			if err != nil {
				t.Fatal(err)
			}

			switch cause {
			case "expiry":
				m.mu.Lock()
				m.jobs[status.ID].status.ExpiresAt = time.Unix(1, 0)
				m.mu.Unlock()
				m.sweep()
			case "session":
				revoked.Store(true)
				m.sweep()
			case "membership":
				a.denied.Store(true)
				m.sweep()
			case "cancel":
				m.Cancel(testActor, "meeting", status.ID)
			case "close":
				m.Close()
			}

			if n, err := download.Read(make([]byte, 32)); n != 0 || err == nil {
				t.Fatal("revoked download returned bytes")
			}

			_ = download.Close()
			if _, err := os.Stat(filepath.Join(m.root, status.ID+".zip")); !errors.Is(err, os.ErrNotExist) {
				t.Fatal("temporary archive remained", err)
			}
		})
	}
}

func TestBackgroundCleanupWithoutRequests(t *testing.T) {
	m := newManager(t, albumsFixture(1))
	var revoked atomic.Bool
	status, err := m.Start(t.Context(), testActor, "meeting", "idle", func(context.Context) error {
		if revoked.Load() {
			return meetings.ErrUnauthenticated
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	awaitState(t, m, testActor, status.ID, "ready")
	revoked.Store(true)
	deadline := time.Now().Add(3 * time.Second)
	for {
		_, err := os.Stat(filepath.Join(m.root, status.ID+".zip"))
		if errors.Is(err, os.ErrNotExist) {
			break
		}

		if time.Now().After(deadline) {
			t.Fatal("idle revoked archive retained")
		}

		time.Sleep(10 * time.Millisecond)
	}
}

func TestFailedArchiveNeverBecomesDownloadable(t *testing.T) {
	a := albumsFixture(2)
	a.photos[1].SizeBytes++
	m := newManager(t, a)
	status := begin(t, m, testActor, "failure")
	awaitState(t, m, testActor, status.ID, "failed")
	if _, err := m.Open(t.Context(), testActor, "meeting", status.ID, validSession); !errors.Is(err, ErrNotReady) {
		t.Fatal("partial download", err)
	}

	if _, err := os.Stat(filepath.Join(m.root, status.ID+".zip")); !errors.Is(err, os.ErrNotExist) {
		t.Fatal("failed archive retained")
	}

	m.Cancel(testActor, "meeting", status.ID)
	begin(t, m, testActor, "retry")
}

func TestArchiveRejectsChangedSnapshotAndBoundedWrites(t *testing.T) {
	a := albumsFixture(1)
	a.gate, a.entered = make(chan struct{}), make(chan struct{})
	m := newManager(t, a)
	status := begin(t, m, testActor, "changed")
	<-a.entered
	a.mu.Lock()
	a.photos[0].BlobKey = "replacement"
	a.mu.Unlock()
	close(a.gate)
	awaitState(t, m, testActor, status.ID, "failed")
	var buffer bytes.Buffer
	writer := &boundedWriter{writer: &buffer, remaining: 3}
	if _, err := writer.Write([]byte("four")); !errors.Is(err, ErrMissing) || buffer.Len() != 0 {
		t.Fatal("disk bound not enforced")
	}
}
