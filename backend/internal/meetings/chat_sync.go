package meetings

import (
	"context"
	"errors"
)

// SyncQuery selects one initial window or a bounded continuation of the journal.
type SyncQuery struct {
	Limit                 int
	Cursor, AroundEntryID string
}

// ChatProjection materializes current permitted state at one snapshot high-water.
// Version is the snapshot change sequence, even when replaying an older event.
type ChatProjection struct {
	ResourceKind, ResourceID string
	Version                  uint64
	Entry                    *FeedEntry
	DatePoll                 *DatePollView
	PlacePoll                *PlacePollView
	PreparationTask          *PreparationTaskView
	Reactions                []MessageReactions
}

// SyncChange carries an invalidation or current projection, never a stored private copy.
type SyncChange struct {
	ChatChange
	Projection *ChatProjection
}

// SyncResult separates snapshot positions, bounded replay and history navigation.
type SyncResult struct {
	ReadState                                                  *ReadState
	Mode, StreamEpoch, ChangeCursor, NextCursor, ThroughCursor string
	Entries                                                    []FeedEntry
	Projections                                                []ChatProjection
	Changes                                                    []SyncChange
	Details                                                    Details
	LatestSequence, ProjectionVersion                          uint64
	HasOlder, HasNewer, HasMore                                bool
}

// Sync authenticates current membership in the same read snapshot as every payload.
func (s *Service) Sync(ctx context.Context, actor Actor, id string, q SyncQuery) (SyncResult, error) {
	return s.sync(ctx, actor, id, q, true)
}

var errSyncStreamMissing = errors.New("missing stream initialization")

func (s *Service) sync(ctx context.Context, actor Actor, id string, q SyncQuery, initialize bool) (SyncResult, error) {
	if err := checkActor(actor); err != nil {
		return SyncResult{}, err
	}

	if !s.ChatSyncEnabled() {
		return SyncResult{}, ErrNotFound
	}

	if q.Limit < 1 || q.Limit > 100 || (q.Cursor != "" && q.AroundEntryID != "") {
		return SyncResult{}, ErrSyncCursorInvalid
	}

	result := SyncResult{Entries: []FeedEntry{}, Projections: []ChatProjection{}, Changes: []SyncChange{}}
	err := s.store.View(ctx, func(r Reader) error {
		details, err := chatSnapshot(r, id, actor.ID)
		if err != nil {
			return err
		}

		stream, err := r.ChatStream(id)
		if errors.Is(err, ErrNotFound) {
			if q.Cursor == "" && initialize {
				return errSyncStreamMissing
			}

			return ErrSyncResetRequired
		}

		if err != nil {
			return err
		}

		result.Details, result.StreamEpoch, result.ProjectionVersion = details, stream.Epoch, stream.LatestSequence
		if s.ChatReadStateEnabled() {
			state, err := r.ChatReadState(id, actor.ID)
			if errors.Is(err, ErrNotFound) && initialize {
				return errReadMarkerMissing
			}

			if err != nil {
				return err
			}

			state.ProjectionVersion = stream.LatestSequence
			result.ReadState = &state
		}

		if q.Cursor == "" {
			return s.syncSnapshot(r, actor, stream, q, &result)
		}

		c, err := s.decodeSyncCursor(q.Cursor, actor.ID, id)
		if err != nil {
			return err
		}

		if c.Epoch != stream.Epoch || c.After < stream.RetainedAfter || c.After > stream.LatestSequence || c.Through > stream.LatestSequence {
			return ErrSyncResetRequired
		}

		through := c.Through
		if through == 0 {
			through = stream.LatestSequence
		}

		page, err := r.ChatChanges(id, c.After, through, q.Limit)
		if errors.Is(err, ErrChangeCursorInvalid) {
			return ErrSyncResetRequired
		}

		if err != nil {
			return err
		}

		result.Mode, result.HasMore = "changes", page.HasMore
		position := c.After
		for _, change := range page.Changes {
			item := SyncChange{ChatChange: change}
			if change.Kind == "entry_upsert" {
				projection, err := s.syncProjection(r, actor, details.Meeting, change.ResourceKind, change.ResourceID, stream.LatestSequence)
				if errors.Is(err, ErrNotFound) {
					item.Kind = "entry_removed"
				} else if err != nil {
					return err
				} else {
					item.Projection = &projection
				}
			}

			result.Changes = append(result.Changes, item)
			position = change.Sequence
		}

		final := s.positionCursor(actor, stream, through, 0)
		// Keep the barrier token identical throughout this cycle, including retries.
		final.Expires = c.Expires
		result.ThroughCursor = s.encodeSyncCursor(final)
		next := final
		if page.HasMore {
			next.After, next.Through = position, through
		}

		result.NextCursor = s.encodeSyncCursor(next)

		return nil
	})

	if errors.Is(err, errReadMarkerMissing) {
		if err := s.ensureActorReadMarker(ctx, actor, id); err != nil {
			return SyncResult{}, err
		}

		return s.sync(ctx, actor, id, q, false)
	}

	if errors.Is(err, errSyncStreamMissing) {
		if err := s.ensureChatStream(ctx, actor, id); err != nil {
			return SyncResult{}, err
		}

		return s.sync(ctx, actor, id, q, false)
	}

	return result, err
}

func (s *Service) ensureChatStream(ctx context.Context, actor Actor, id string) error {
	return s.store.Update(ctx, func(w Writer) error {
		if _, err := chatSnapshot(w, id, actor.ID); err != nil {
			return err
		}

		_, err := w.EnsureChatStream(id, randomUUID())
		if err == nil && s.ChatReadStateEnabled() {
			_, err = w.EnsureChatReadMarker(id, actor.ID, s.now().UTC())
		}

		return err
	})
}

func (s *Service) syncSnapshot(r Reader, actor Actor, stream ChatStream, q SyncQuery, result *SyncResult) error {
	var window FeedRange
	var err error
	anchor := q.AroundEntryID
	if anchor == "" && result.ReadState != nil {
		anchor = result.ReadState.FirstUnread
	}

	if anchor != "" {
		window, err = r.FeedAround(stream.MeetingID, anchor, q.Limit)
	} else {
		var page FeedWindow
		page, err = r.FeedWindow(stream.MeetingID, FeedQuery{Limit: q.Limit})
		window = FeedRange{Entries: page.Entries, LatestSequence: page.LatestSequence, HasOlder: page.HasMore}
	}

	if err != nil {
		return err
	}

	if err := hydrateMediaEntries(r, window.Entries); err != nil {
		return err
	}

	result.Mode, result.Entries, result.LatestSequence = "snapshot", window.Entries, window.LatestSequence
	result.HasOlder, result.HasNewer = window.HasOlder, window.HasNewer
	result.ChangeCursor = s.encodeSyncCursor(s.positionCursor(actor, stream, stream.LatestSequence, 0))
	for _, entry := range window.Entries {
		p, err := s.entrySyncProjection(r, actor, result.Details.Meeting, entry, stream.LatestSequence)
		if err != nil {
			return err
		}

		p.Entry = nil
		if p.DatePoll != nil || p.PlacePoll != nil || p.PreparationTask != nil || p.Reactions != nil {
			result.Projections = append(result.Projections, p)
		}
	}

	return nil
}
