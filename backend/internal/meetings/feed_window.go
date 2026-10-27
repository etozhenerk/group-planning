package meetings

// FeedWindow contains at most query.Limit entries in ascending sequence order.
// HasMore refers to the requested direction. LatestSequence is the tail of the
// same storage snapshot, including when the requested range is empty.
// Initial and before windows select the nearest older entries; after selects
// the nearest newer entries. Adapters fetch at most limit+1 entry payloads; the memory store still
// clones its entire snapshot before entering this reader.
type FeedWindow struct {
	Entries        []FeedEntry
	LatestSequence uint64
	HasMore        bool
}
