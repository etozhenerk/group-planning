package meetings

import (
	"context"
	"strings"
	"unicode"
	"unicode/utf8"
)

// PrepareMedia reserves a bounded upload after checking current membership.
func (s *Service) PrepareMedia(ctx context.Context, actor Actor, id string, input MediaInput, key string) (Media, error) {
	if err := checkActor(actor); err != nil {
		return Media{}, err
	}

	input.FileName = strings.TrimSpace(input.FileName)
	if err := validateMediaInput(input); err != nil {
		return Media{}, err
	}

	if s.media == nil {
		return Media{}, ErrMediaUnavailable
	}

	var result Media
	err := s.updateAs(ctx, actor, func(w Writer) error {
		details, err := privateSnapshot(w, id, actor.ID)
		if err != nil {
			return err
		}

		if err := mediaPurposeAllowed(details.Meeting, input.Purpose); err != nil {
			return err
		}

		requestKey, err := keyFor(actor, "media-upload:"+id, key)
		if err != nil {
			return err
		}

		hash := requestHash(input)
		receipt, exists, err := s.receipt(w, requestKey, hash)
		if err != nil {
			return err
		}

		if exists {
			result, err = w.Media(receipt.ResourceID)
			return err
		}

		records, err := w.MeetingMedia(id)
		if err != nil {
			return err
		}

		used, pending := 0, 0
		for _, item := range records {
			if item.UploadedBy.ID == actor.ID && item.ClientRequestID == input.ClientRequestID {
				if item.CreationHash != hash {
					return ErrIdempotencyConflict
				}

				result = item

				return s.remember(w, requestKey, hash, item.ID)
			}

			used += max(item.SizeBytes, item.DeclaredSize)
			if item.UploadedBy.ID == actor.ID && item.Status != "published" {
				pending++
			}
		}

		if used+input.SizeBytes > MaxMeetingMediaBytes || pending >= 50 {
			return &Conflict{Code: "media_quota"}
		}

		kind := "file"
		if strings.HasPrefix(input.ContentType, "image/") {
			kind = "photo"
		}

		result = Media{ID: randomUUID(), MeetingID: id, FileName: input.FileName, ContentType: input.ContentType, Kind: kind, Purpose: input.Purpose, Status: "pending", SizeBytes: input.SizeBytes, DeclaredSize: input.SizeBytes, CreatedAt: s.now().UTC(), UploadedBy: actor, ClientRequestID: input.ClientRequestID, CreationHash: hash}
		if err := w.SaveMedia(result); err != nil {
			return err
		}

		return s.remember(w, requestKey, hash, result.ID)
	})

	return result, err
}

func validateMediaInput(input MediaInput) error {
	fields := map[string]string{}
	if id, err := ParseUUID(input.ClientRequestID); err != nil || id != input.ClientRequestID {
		fields["client_request_id"] = "invalid"
	}

	if input.FileName == "" || utf8.RuneCountInString(input.FileName) > 255 || strings.ContainsAny(input.FileName, "/\\") || strings.IndexFunc(input.FileName, unicode.IsControl) >= 0 {
		fields["file_name"] = "invalid"
	}

	photo := strings.HasPrefix(input.ContentType, "image/")
	valid := input.ContentType == "image/jpeg" || input.ContentType == "image/png" || input.ContentType == "image/webp" || input.ContentType == "application/pdf" || input.ContentType == "text/plain" || input.ContentType == "application/zip"
	if !valid {
		fields["content_type"] = "unsupported"
	}

	if input.SizeBytes <= 0 || input.SizeBytes > MaxFileBytes || (photo && input.SizeBytes > MaxPhotoBytes) {
		fields["size_bytes"] = "invalid"
	}

	if input.Purpose != "message" && input.Purpose != "memory" {
		fields["purpose"] = "invalid"
	}

	if input.Purpose == "memory" && !photo {
		fields["content_type"] = "photo_required"
	}

	if len(fields) > 0 {
		return ValidationError{fields}
	}

	return nil
}

func mediaPurposeAllowed(meeting Meeting, purpose string) error {
	if purpose == "memory" && meeting.Status != Past {
		return &Conflict{Code: "meeting_not_past"}
	}

	return nil
}
