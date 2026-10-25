package postgres

import (
	"context"
	"strings"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

// MediaContent stores immutable bounded blobs separately from JSON metadata.
type MediaContent struct{ db *Database }

// MediaContent returns durable binary storage using the configured database.
func (db *Database) MediaContent() *MediaContent { return &MediaContent{db: db} }

func (s *MediaContent) Put(ctx context.Context, key string, data []byte) error {
	id, _, ok := strings.Cut(key, ".")
	if !ok || len(data) == 0 || len(data) > meetings.MaxFileBytes {
		return meetings.ErrInvalidRecord
	}

	result, err := s.db.pool.Exec(ctx, `INSERT INTO media_blobs(key,media_id,content) VALUES($1,$2,$3) ON CONFLICT(key) DO UPDATE SET created_at=now() WHERE media_blobs.content=EXCLUDED.content`, key, id, data)
	if err != nil {
		return storageError(err)
	}

	if result.RowsAffected() == 0 {
		return meetings.ErrIdempotencyConflict
	}

	return nil
}

func (s *MediaContent) Get(ctx context.Context, key string) ([]byte, error) {
	var data []byte
	err := s.db.pool.QueryRow(ctx, "SELECT content FROM media_blobs WHERE key=$1", key).Scan(&data)
	if err != nil {
		return nil, storageError(err)
	}

	return data, nil
}

func (s *MediaContent) Delete(ctx context.Context, key string) error {
	_, err := s.db.pool.Exec(ctx, "DELETE FROM media_blobs WHERE key=$1", key)
	if err != nil {
		return storageError(err)
	}

	return nil
}

func (s *MediaContent) Prune(ctx context.Context, live []string, before time.Time) error {
	if live == nil {
		live = []string{}
	}

	_, err := s.db.pool.Exec(ctx, "DELETE FROM media_blobs WHERE created_at < $1 AND NOT (key=ANY($2::text[]))", before, live)
	if err != nil {
		return storageError(err)
	}

	return nil
}
