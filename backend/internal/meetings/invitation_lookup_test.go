package meetings_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestPublicInvitationOperations(t *testing.T) {
	f := setup(t)
	before := feed(t, f)
	exists, err := f.app.InvitationExists(ctx, f.created.InvitationToken)
	if err != nil || !exists {
		t.Fatalf("existing invitation: exists=%v err=%v", exists, err)
	}

	exists, err = f.app.InvitationExists(ctx, "invalid")
	if err != nil || exists {
		t.Fatalf("invalid invitation: exists=%v err=%v", exists, err)
	}

	preview, err := f.app.PublicPreview(ctx, f.created.InvitationToken)
	must(t, err)
	if preview.Title != f.created.Details.Meeting.Title || preview.MeetingID != f.created.Details.Meeting.ID {
		t.Fatal("incorrect public snapshot")
	}

	*preview.StartsAt = time.Time{}
	again, err := f.app.PublicPreview(ctx, f.created.InvitationToken)
	must(t, err)
	if again.StartsAt.IsZero() {
		t.Fatal("public snapshot mutated storage")
	}

	after := feed(t, f)
	if len(before.Entries) != len(after.Entries) || after.Details.ParticipantCount != 1 {
		t.Fatal("public lookup changed participation or feed")
	}

	cancelled, cancel := context.WithCancel(ctx)
	cancel()
	exists, err = f.app.InvitationExists(cancelled, f.created.InvitationToken)
	if exists || !errors.Is(err, context.Canceled) {
		t.Fatalf("cancelled lookup: exists=%v err=%v", exists, err)
	}
}

type failedInvitationStore struct {
	meetings.Store
	err error
}

func (store failedInvitationStore) View(context.Context, func(meetings.Reader) error) error {
	return store.err
}

func TestInvitationLookupPreservesStorageFailure(t *testing.T) {
	f := setup(t)
	failure := errors.New("storage unavailable")
	app := meetings.NewService(failedInvitationStore{err: failure}, time.Now)
	exists, err := app.InvitationExists(ctx, f.created.InvitationToken)
	if exists || !errors.Is(err, failure) {
		t.Fatalf("storage failure became missing invitation: exists=%v err=%v", exists, err)
	}
}
