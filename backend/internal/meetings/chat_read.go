package meetings

import (
	"context"
	"errors"
	"time"
)

// ReadMarker separates the activation baseline from actual read-through.
type ReadMarker struct {
	MeetingID, UserID     string
	Baseline, ReadThrough uint64
	UpdatedAt             time.Time
}

// ReadState is private to the authenticated actor and one consistent snapshot.
type ReadState struct {
	ReadMarker
	UnreadCount       uint64
	FirstUnread       string
	ProjectionVersion uint64
}

// ReadReceipt exposes an aggregate for one message, never individual positions.
type ReadReceipt struct {
	EntryID     string
	ReaderCount uint64
}

// ReadReceipts carries batch aggregates at the current stream version.
type ReadReceipts struct {
	Receipts          []ReadReceipt
	ProjectionVersion uint64
}

// ReadersPage contains current participant IDs for bounded profile hydration.
type ReadersPage struct {
	UserIDs                        []string
	ReaderCount, ProjectionVersion uint64
	NextCursor                     string
}

// WithChatReadState enables read operations only alongside configured HTTP sync.
func WithChatReadState(enabled bool) Option { return func(s *Service) { s.readState = enabled } }

// ChatReadStateEnabled is independent of realtime transport availability.
func (s *Service) ChatReadStateEnabled() bool { return s.readState && s.ChatSyncEnabled() }

// InitializeChatReadState atomically establishes first-activation baselines before
// accepting requests. Existing markers survive restarts, disabling and rejoining.
func (s *Service) InitializeChatReadState(ctx context.Context) error {
	if !s.ChatReadStateEnabled() {
		return nil
	}

	return s.store.Update(ctx, func(w Writer) error { return w.InitializeChatReadMarkers(s.now().UTC()) })
}

func (s *Service) ensureActorReadMarker(ctx context.Context, actor Actor, id string) error {
	return s.store.Update(ctx, func(w Writer) error {
		if _, err := chatSnapshot(w, id, actor.ID); err != nil {
			return err
		}

		_, err := w.EnsureChatReadMarker(id, actor.ID, s.now().UTC())

		return err
	})
}

// MarkRead validates a real message position before monotonically merging devices.
func (s *Service) MarkRead(ctx context.Context, actor Actor, id string, sequence uint64) (ReadState, error) {
	if err := checkActor(actor); err != nil {
		return ReadState{}, err
	}

	if !s.ChatReadStateEnabled() {
		return ReadState{}, ErrNotFound
	}

	var result ReadState
	err := s.updateAs(ctx, actor, func(w Writer) error {
		if _, err := chatSnapshot(w, id, actor.ID); err != nil {
			return err
		}

		if sequence == 0 {
			return ValidationError{map[string]string{"read_through_sequence": "invalid"}}
		}

		after := sequence - 1
		page, err := w.FeedWindow(id, FeedQuery{After: &after, Limit: 1})
		if err != nil {
			return err
		}

		if len(page.Entries) != 1 || page.Entries[0].Sequence != sequence || page.Entries[0].Kind != "message" {
			return ValidationError{map[string]string{"read_through_sequence": "invalid"}}
		}

		if _, err := w.EnsureChatReadMarker(id, actor.ID, s.now().UTC()); err != nil {
			return err
		}

		if _, _, err := w.AdvanceChatReadMarker(id, actor.ID, sequence, s.now().UTC()); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return result, err
	}

	// The write, journal and outbox are committed before the response snapshot.
	err = s.store.View(ctx, func(r Reader) error {
		if _, err := chatSnapshot(r, id, actor.ID); err != nil {
			return err
		}

		var err error
		result, err = r.ChatReadState(id, actor.ID)
		if err != nil {
			return err
		}

		stream, err := r.ChatStream(id)
		result.ProjectionVersion = stream.LatestSequence

		return err
	})

	return result, err
}

// QueryReadReceipts validates the entire batch before returning any aggregate.
func (s *Service) QueryReadReceipts(ctx context.Context, actor Actor, id string, entryIDs []string) (ReadReceipts, error) {
	return s.queryReadReceipts(ctx, actor, id, entryIDs, true)
}

func (s *Service) queryReadReceipts(ctx context.Context, actor Actor, id string, entryIDs []string, initialize bool) (ReadReceipts, error) {
	if err := checkActor(actor); err != nil {
		return ReadReceipts{}, err
	}

	if !s.ChatReadStateEnabled() {
		return ReadReceipts{}, ErrNotFound
	}

	if len(entryIDs) < 1 || len(entryIDs) > 100 {
		return ReadReceipts{}, ValidationError{map[string]string{"entry_ids": "invalid"}}
	}

	result := ReadReceipts{Receipts: []ReadReceipt{}}
	err := s.store.View(ctx, func(r Reader) error {
		if _, err := chatSnapshot(r, id, actor.ID); err != nil {
			return err
		}

		seen := map[string]bool{}
		canonicalIDs := make([]string, len(entryIDs))
		for index, requestedID := range entryIDs {
			entryID, err := ParseUUID(requestedID)
			if err != nil {
				return ValidationError{map[string]string{"entry_id": "invalid"}}
			}

			if seen[entryID] {
				return ValidationError{map[string]string{"entry_ids": "duplicate"}}
			}

			seen[entryID] = true
			canonicalIDs[index] = entryID
			if _, err := ownReadMessage(r, id, actor.ID, entryID); err != nil {
				return err
			}
		}

		var err error
		result.Receipts, err = r.ChatReceiptCounts(id, actor.ID, canonicalIDs)
		if err != nil {
			return err
		}

		stream, err := r.ChatStream(id)
		if errors.Is(err, ErrNotFound) && initialize {
			return errSyncStreamMissing
		}

		result.ProjectionVersion = stream.LatestSequence

		return err
	})

	if errors.Is(err, errSyncStreamMissing) {
		if err := s.ensureChatStream(ctx, actor, id); err != nil {
			return ReadReceipts{}, err
		}

		return s.queryReadReceipts(ctx, actor, id, entryIDs, false)
	}

	return result, err
}

func ownReadMessage(r Reader, id, userID, entryID string) (FeedEntry, error) {
	if _, err := ParseUUID(entryID); err != nil {
		return FeedEntry{}, ValidationError{map[string]string{"entry_id": "invalid"}}
	}

	entry, err := r.FeedEntry(id, entryID)
	if err != nil {
		return FeedEntry{}, err
	}

	if entry.Kind != "message" || entry.ActorID != userID {
		return FeedEntry{}, ErrForbidden
	}

	return entry, nil
}

var errReadMarkerMissing = errors.New("missing read marker initialization")
