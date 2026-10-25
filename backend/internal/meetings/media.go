package meetings

import (
	"context"
	"time"
)

const (
	// MaxPhotoBytes and MaxFileBytes are enforced before and after normalization.
	MaxPhotoBytes = 10 << 20
	MaxFileBytes  = 20 << 20
	// MaxMediaSelection is the per-picker batch limit advertised to clients.
	MaxMediaSelection = 10
	// MaxMeetingMediaBytes caps accepted content and pending reservations.
	MaxMeetingMediaBytes = 1 << 30
)

// Media is metadata; private content stays behind the MediaContent port.
type Media struct {
	ID, MeetingID, FileName, ContentType, Kind, Purpose, Status   string
	SizeBytes, DeclaredSize                                       int
	CreatedAt                                                     time.Time
	UploadedBy                                                    Actor
	ClientRequestID, CreationHash, UploadDigest, BlobKey, EntryID string
}

// MediaInput reserves one upload, identified independently of transport retries.
type MediaInput struct {
	ClientRequestID, FileName, ContentType, Purpose string
	SizeBytes                                       int
}

// MediaContent stores immutable bytes outside meeting transactions.
type MediaContent interface {
	Put(context.Context, string, []byte) error
	Get(context.Context, string) ([]byte, error)
	Delete(context.Context, string) error
	Prune(context.Context, []string, time.Time) error
}

// Option configures an explicitly injected application dependency.
type Option func(*Service)

// WithMediaContent binds storage without making the domain construct an adapter.
func WithMediaContent(content MediaContent) Option { return func(s *Service) { s.media = content } }

// PublishedMedia contains the committed attachment and its optional feed entry.
type PublishedMedia struct {
	Media Media
	Entry *FeedEntry
}

// MemoriesPage is a stable page of explicitly published album photos.
type MemoriesPage struct {
	Photos     []Media
	NextCursor string
}
