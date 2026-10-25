// Package files provides private temporary binary storage for local development.
package files

import (
	"bytes"
	"context"
	"errors"
	"os"
	"path/filepath"
	"regexp"
	"sync"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

// Media owns one private process-lifetime directory. URLs never contain its path.
type Media struct {
	root string
	mu   sync.Mutex
}

var keyPattern = regexp.MustCompile(`^[a-f0-9-]{36}\.[a-f0-9]{64}$`)

// NewMedia creates temporary content storage; Close removes every file.
func NewMedia() (*Media, error) {
	directory, err := os.MkdirTemp("", "somewhere-media-")
	if err != nil {
		return nil, meetings.ErrMediaUnavailable
	}

	return &Media{root: directory}, nil
}

// Close removes published and unfinished local content at process shutdown.
func (s *Media) Close() error { s.mu.Lock(); defer s.mu.Unlock(); return os.RemoveAll(s.root) }

func (s *Media) Put(ctx context.Context, key string, data []byte) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	if !keyPattern.MatchString(key) || len(data) > meetings.MaxFileBytes {
		return meetings.ErrInvalidRecord
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	path := filepath.Join(s.root, key)
	previous, err := os.ReadFile(path)
	if err == nil {
		if bytes.Equal(previous, data) {
			if os.Chtimes(path, time.Now(), time.Now()) != nil {
				return meetings.ErrMediaUnavailable
			}

			return nil
		}

		return meetings.ErrIdempotencyConflict
	}

	if !errors.Is(err, os.ErrNotExist) {
		return meetings.ErrMediaUnavailable
	}

	temporary, err := os.CreateTemp(s.root, "upload-")
	if err != nil {
		return meetings.ErrMediaUnavailable
	}
	defer os.Remove(temporary.Name())
	_, writeErr := temporary.Write(data)
	closeErr := temporary.Close()
	if writeErr != nil || closeErr != nil || ctx.Err() != nil {
		return meetings.ErrMediaUnavailable
	}

	if os.Rename(temporary.Name(), path) != nil {
		return meetings.ErrMediaUnavailable
	}

	return nil
}

func (s *Media) Get(ctx context.Context, key string) ([]byte, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	if !keyPattern.MatchString(key) {
		return nil, meetings.ErrNotFound
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	data, err := os.ReadFile(filepath.Join(s.root, key))
	if errors.Is(err, os.ErrNotExist) {
		return nil, meetings.ErrNotFound
	}

	if err != nil {
		return nil, meetings.ErrMediaUnavailable
	}

	return data, nil
}

func (s *Media) Delete(ctx context.Context, key string) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	if !keyPattern.MatchString(key) {
		return meetings.ErrInvalidRecord
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	err := os.Remove(filepath.Join(s.root, key))
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}

	if err != nil {
		return meetings.ErrMediaUnavailable
	}

	return nil
}

// Prune removes unreferenced old content after a grace period.
func (s *Media) Prune(ctx context.Context, live []string, before time.Time) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	keep := map[string]bool{}
	for _, key := range live {
		keep[key] = true
	}

	entries, err := os.ReadDir(s.root)
	if err != nil {
		return meetings.ErrMediaUnavailable
	}

	for _, entry := range entries {
		if err := ctx.Err(); err != nil {
			return err
		}

		if entry.IsDir() || keep[entry.Name()] {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			return meetings.ErrMediaUnavailable
		}

		if info.ModTime().Before(before) {
			if err := os.Remove(filepath.Join(s.root, entry.Name())); err != nil && !errors.Is(err, os.ErrNotExist) {
				return meetings.ErrMediaUnavailable
			}
		}
	}

	return nil
}
