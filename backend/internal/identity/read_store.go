package identity

import "context"

// ReadRecords exposes the immutable records needed for session/profile lookups.
type ReadRecords interface {
	Session(string) (Session, bool)
	User(string) (User, bool)
}

// ReadStore optionally provides consistent reads without the mutation lock.
// Stores implementing only Store retain their existing Update behavior.
type ReadStore interface {
	View(context.Context, func(ReadRecords) error) error
}

func (s *Service) readRecords(ctx context.Context, fn func(ReadRecords) error) error {
	if reader, ok := s.store.(ReadStore); ok {
		return reader.View(ctx, fn)
	}

	return s.store.Update(ctx, func(records Records) error { return fn(records) })
}
