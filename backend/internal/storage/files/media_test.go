package files

import (
	"bytes"
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestPrivateImmutableStorageCleanupAndTraversal(t *testing.T) {
	content, err := NewMedia()
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(func() { _ = content.Close() })
	ctx := context.Background()
	key := "dab00000-0000-4000-8000-000000000001.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
	if err := content.Put(ctx, key, []byte("private")); err != nil {
		t.Fatal(err)
	}

	if err := content.Put(ctx, key, []byte("different")); !errors.Is(err, meetings.ErrIdempotencyConflict) {
		t.Fatal("overwrote immutable key")
	}

	data, err := content.Get(ctx, key)
	if err != nil || !bytes.Equal(data, []byte("private")) {
		t.Fatal("wrong content")
	}

	if _, err := content.Get(ctx, "../outside"); !errors.Is(err, meetings.ErrNotFound) {
		t.Fatal("allowed traversal")
	}

	info, err := os.Stat(filepath.Join(content.root, key))
	if err != nil || info.Mode().Perm() != 0o600 {
		t.Fatal("public file permissions")
	}

	old := time.Now().Add(-2 * time.Hour)
	if err := os.Chtimes(filepath.Join(content.root, key), old, old); err != nil {
		t.Fatal(err)
	}

	if err := content.Prune(ctx, []string{key}, time.Now().Add(-time.Hour)); err != nil {
		t.Fatal(err)
	}

	if _, err := content.Get(ctx, key); err != nil {
		t.Fatal("deleted live content")
	}

	if err := content.Put(ctx, key, []byte("private")); err != nil {
		t.Fatal(err)
	}

	if err := content.Prune(ctx, nil, time.Now().Add(-time.Hour)); err != nil {
		t.Fatal(err)
	}

	if _, err := content.Get(ctx, key); err != nil {
		t.Fatal("retry did not renew cleanup grace")
	}

	if err := os.Chtimes(filepath.Join(content.root, key), old, old); err != nil {
		t.Fatal(err)
	}

	if err := content.Prune(ctx, nil, time.Now().Add(-time.Hour)); err != nil {
		t.Fatal(err)
	}

	if _, err := content.Get(ctx, key); !errors.Is(err, meetings.ErrNotFound) {
		t.Fatal("orphan retained")
	}
}
