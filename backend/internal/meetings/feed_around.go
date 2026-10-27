package meetings

import "context"

// FeedRange is a bounded ascending window including the requested anchor.
type FeedRange struct {
	Details            Details
	Entries            []FeedEntry
	LatestSequence     uint64
	HasOlder, HasNewer bool
}

// AssembleFeedRange centers the anchor and fills a short side from the other.
// Each side must contain up to limit nearest entries, ordered ascending. Its
// result has independent slice storage; adapters also copy mutable entry data.
func AssembleFeedRange(before []FeedEntry, anchor FeedEntry, after []FeedEntry, latest uint64, limit int) FeedRange {
	older := min((limit-1)/2, len(before))
	newer := min(limit-1-older, len(after))
	older = min(limit-1-newer, len(before))
	entries := make([]FeedEntry, 0, older+1+newer)
	entries = append(entries, before[len(before)-older:]...)
	entries = append(entries, anchor)
	entries = append(entries, after[:newer]...)

	return FeedRange{Entries: entries, LatestSequence: latest, HasOlder: len(before) > older, HasNewer: len(after) > newer}
}

// FeedAround checks current access before looking up an anchor or history.
// It does not move any receive or read cursor.
func (s *Service) FeedAround(ctx context.Context, actor Actor, id, entryID string, limit int) (FeedRange, error) {
	if err := checkActor(actor); err != nil {
		return FeedRange{}, err
	}

	if limit < 1 || limit > 100 || entryID == "" {
		return FeedRange{}, ValidationError{map[string]string{"cursor": "invalid"}}
	}

	var result FeedRange
	err := s.store.View(ctx, func(r Reader) error {
		details, err := chatSnapshot(r, id, actor.ID)
		if err != nil {
			return err
		}

		result, err = r.FeedAround(id, entryID, limit)
		if err != nil {
			return err
		}

		result.Details = details

		return hydrateMediaEntries(r, result.Entries)
	})

	return result, err
}
