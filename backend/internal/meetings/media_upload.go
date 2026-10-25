package meetings

import (
	"archive/zip"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"unicode/utf8"

	"github.com/etozhenerk/group-planning/backend/internal/imagecontent"
)

// UploadMedia validates bytes outside the transaction, then rechecks ownership
// and membership before committing their immutable key. A race never publishes.
func (s *Service) UploadMedia(ctx context.Context, actor Actor, meetingID, id, contentType string, data []byte) (Media, error) {
	if err := checkActor(actor); err != nil {
		return Media{}, err
	}

	if s.media == nil {
		return Media{}, ErrMediaUnavailable
	}

	var original Media
	err := s.store.View(ctx, func(r Reader) error { var err error; original, err = ownedMedia(r, actor, meetingID, id); return err })
	if err != nil {
		return Media{}, err
	}

	digest := sha256.Sum256(data)
	hash := hex.EncodeToString(digest[:])
	if original.Status != "pending" {
		if original.UploadDigest == hash {
			return original, nil
		}

		return Media{}, ErrIdempotencyConflict
	}

	if len(data) != original.DeclaredSize || contentType != original.ContentType {
		return Media{}, ValidationError{map[string]string{"content": "mismatch"}}
	}

	normalized, actualType, err := prepareMediaContent(data, contentType)
	if err != nil {
		return Media{}, err
	}

	contentDigest := sha256.Sum256(normalized)
	blobKey := id + "." + hex.EncodeToString(contentDigest[:])
	if err := s.media.Put(ctx, blobKey, normalized); err != nil {
		return Media{}, err
	}

	var result Media
	err = s.updateAs(ctx, actor, func(w Writer) error {
		current, err := ownedMedia(w, actor, meetingID, id)
		if err != nil {
			return err
		}

		if current.Status != "pending" {
			if current.UploadDigest != hash {
				return ErrIdempotencyConflict
			}

			result = current

			return nil
		}

		current.Status = "uploaded"
		current.UploadDigest = hash
		current.BlobKey = blobKey
		current.SizeBytes = len(normalized)
		current.ContentType = actualType
		if actualType != original.ContentType && actualType == "image/png" {
			current.FileName = strings.TrimSuffix(current.FileName, ".webp") + ".png"
		}

		if err := w.SaveMedia(current); err != nil {
			return err
		}

		result = current

		return nil
	})

	return result, err
}

func ownedMedia(r Reader, actor Actor, meetingID, id string) (Media, error) {
	details, err := privateSnapshot(r, meetingID, actor.ID)
	if err != nil {
		return Media{}, err
	}

	item, err := r.Media(id)
	if err != nil {
		return Media{}, err
	}

	if item.MeetingID != meetingID {
		return Media{}, ErrNotFound
	}

	if item.UploadedBy.ID != actor.ID {
		return Media{}, ErrForbidden
	}

	if err := mediaPurposeAllowed(details.Meeting, item.Purpose); err != nil {
		return Media{}, err
	}

	return item, nil
}

func prepareMediaContent(data []byte, contentType string) ([]byte, string, error) {
	invalid := func(code string) ([]byte, string, error) {
		return nil, "", ValidationError{map[string]string{"content": code}}
	}
	if len(data) == 0 || len(data) > MaxFileBytes {
		return invalid("too_large")
	}

	if strings.HasPrefix(contentType, "image/") {
		normalized, kind, err := imagecontent.Prepare(data, contentType, MaxPhotoBytes)
		if err != nil {
			return invalid(err.Error())
		}

		return normalized, kind, nil
	}

	switch contentType {
	case "application/pdf":
		if !bytes.HasPrefix(data, []byte("%PDF-")) || !bytes.Contains(data[max(0, len(data)-1024):], []byte("%%EOF")) {
			return invalid("format")
		}
	case "application/zip":
		archive, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
		if err != nil || len(archive.File) > 10000 {
			return invalid("format")
		}
	case "text/plain":
		if !utf8.Valid(data) || bytes.ContainsRune(data, 0) {
			return invalid("format")
		}
	default:
		return invalid("format")
	}

	return bytes.Clone(data), contentType, nil
}
