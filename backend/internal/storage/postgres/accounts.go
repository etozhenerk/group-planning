package postgres

import (
	"context"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

// AccountUpdate takes identity then meetings locks in one database transaction.
func (s *Identity) AccountUpdate(ctx context.Context, store meetings.Store, fn func(identity.Store, meetings.Store) error) error {
	meetingStore, ok := store.(*Store)
	if !ok || meetingStore.db != s.db {
		return ErrUnavailable
	}

	return s.db.transact(ctx, true, 19372003, func(tx *transaction) error {
		if _, err := tx.exec("SELECT pg_advisory_xact_lock(19372002)"); err != nil {
			return err
		}

		return fn(accountIdentityStore{&identityTransaction{tx}}, accountMeetingStore{tx})
	})
}

type accountIdentityStore struct{ records *identityTransaction }

func (s accountIdentityStore) Update(ctx context.Context, fn func(identity.Records) error) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	return fn(s.records)
}

type accountMeetingStore struct{ tx *transaction }

func (s accountMeetingStore) View(ctx context.Context, fn func(meetings.Reader) error) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	return fn(s.tx)
}

func (s accountMeetingStore) Update(ctx context.Context, fn func(meetings.Writer) error) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	return fn(s.tx)
}
