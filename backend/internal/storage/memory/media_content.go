package memory

import (
	"bytes"
	"context"
	"sync"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

// MediaContent provides immutable binary content for deterministic tests.
type MediaContent struct {
	mu      sync.Mutex
	content map[string][]byte
	created map[string]time.Time
}

// NewMediaContent starts with no uploaded files.
func NewMediaContent() *MediaContent {
	return &MediaContent{content: map[string][]byte{}, created: map[string]time.Time{}}
}

func (s *MediaContent) Put(ctx context.Context, key string, data []byte) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	if previous, ok := s.content[key]; ok && !bytes.Equal(previous, data) {
		return meetings.ErrIdempotencyConflict
	}

	s.content[key] = bytes.Clone(data)
	s.created[key] = time.Now()

	return nil
}

func (s *MediaContent) Get(ctx context.Context, key string) ([]byte, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	data, ok := s.content[key]
	if !ok {
		return nil, meetings.ErrNotFound
	}

	return bytes.Clone(data), nil
}

func (s *MediaContent) Delete(ctx context.Context, key string) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.content, key)
	delete(s.created, key)

	return nil
}

func (s *MediaContent) Prune(ctx context.Context, live []string, before time.Time) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	keep := map[string]bool{}
	for _, key := range live {
		keep[key] = true
	}

	for key, created := range s.created {
		if !keep[key] && created.Before(before) {
			delete(s.content, key)
			delete(s.created, key)
		}
	}

	return nil
}
