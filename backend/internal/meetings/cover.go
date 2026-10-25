package meetings

// CoverInput carries a client-prepared image; URLs are never accepted as input.
type CoverInput struct {
	MediaType string
	Data      string
}

// CoverChange distinguishes an omitted patch from explicit removal (Value nil).
type CoverChange struct{ Value *CoverInput }

// Cover is immutable image content stored separately from meeting summaries.
type Cover struct {
	MeetingID     string
	Version       string
	MediaType     string
	Data          []byte
	Width, Height int
}

const (
	// MaxCoverBytes bounds both uploaded and normalized image content.
	MaxCoverBytes = 5 << 20
	// MaxCoverPixels bounds decoded image allocation.
	MaxCoverPixels = 16_000_000
	// MaxCoverDimension bounds either side of the image before decoding.
	MaxCoverDimension = 8192
)
