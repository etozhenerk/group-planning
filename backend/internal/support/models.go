// Package support accepts explicitly submitted feedback and coordinates delivery.
package support

import (
	"context"
	"errors"
	"time"
)

var (
	ErrUnavailable         = errors.New("feedback unavailable")
	ErrRateLimited         = errors.New("feedback rate limited")
	ErrIdempotencyConflict = errors.New("feedback key reused")
)

// ValidationError exposes only safe field codes.
type ValidationError struct{ Fields map[string]string }

func (e ValidationError) Error() string { return "invalid feedback" }

const (
	MaxScreenshotBytes = 5 << 20
	MaxStoredBytes     = 50 << 20
)

// Viewport is present only when the user enabled diagnostics.
type (
	Viewport struct {
		Width  int `json:"width"`
		Height int `json:"height"`
	}
	// Diagnostics contains a closed allowlist, without URLs or automatic identity.
	Diagnostics struct {
		ClientVersion string    `json:"client_version"`
		Platform      string    `json:"platform"`
		OS            string    `json:"os,omitempty"`
		Browser       string    `json:"browser,omitempty"`
		Viewport      *Viewport `json:"viewport,omitempty"`
	}
)

// ScreenshotInput is the one explicitly selected screenshot.
type (
	ScreenshotInput struct {
		FileName    string `json:"file_name"`
		ContentType string `json:"content_type"`
		DataBase64  string `json:"data_base64"`
	}
	// Input contains no implicit profile/contact/session fields.
	Input struct {
		ClientRequestID string           `json:"client_request_id"`
		Kind            string           `json:"kind"`
		Description     string           `json:"description"`
		Screen          string           `json:"screen"`
		Email           *string          `json:"email"`
		Screenshot      *ScreenshotInput `json:"screenshot"`
		Diagnostics     *Diagnostics     `json:"diagnostics"`
	}
)

// Screenshot contains normalized image bytes, inaccessible through public routes.
type (
	Screenshot struct {
		FileName, ContentType string
		Data                  []byte
	}
	// Progress permits retrying a failed attachment without resending acknowledged text.
	Progress struct {
		MessageID, FileMessageID int64
		SentChunks               int
	}
	// Feedback is a stored record, distinct from the public receipt.
	Feedback struct {
		ID, Key, RequestHash, Reference, Kind, Description, Screen, Email string
		Screenshot                                                        *Screenshot
		Diagnostics                                                       *Diagnostics
		CreatedAt, NextAttemptAt, LeaseUntil                              time.Time
		LeaseID                                                           string
		Attempts                                                          int
		Delivered                                                         bool
		Progress                                                          Progress
	}
)

// Receipt confirms acceptance, not external channel delivery.
type (
	Receipt struct{ ID, Reference string }
	// RateWindow counts accepted requests for a temporary opaque source key.
	RateWindow struct {
		Key       string
		Count     int
		ExpiresAt time.Time
	}
	// Records is valid only inside the storage transaction; callbacks do no I/O.
	Records interface {
		ByKey(string) (Feedback, bool, error)
		All() ([]Feedback, error)
		Put(Feedback) error
		Rate(string) (RateWindow, bool, error)
		PutRate(RateWindow) error
		PruneRates(time.Time) error
	}
)

// Store atomically accepts feedback, receipts, rate limits and delivery leases.
type (
	Store interface {
		Update(context.Context, func(Records) error) error
	}
	// Delivery sends only the explicit submission, without access to identity or chat.
	Delivery interface {
		Send(context.Context, Feedback) (Progress, error)
	}
)
