package accounts_test

import (
	"errors"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/accounts"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestAccountTransactionRollsBackChatInvalidation(t *testing.T) {
	f := setup(t)
	owner := meetings.Actor{ID: f.id, Name: "Private name"}
	guest := meetings.Actor{ID: "88000000-0000-4000-8000-000000000002", Name: "Guest"}
	created, err := f.meetings.Create(t.Context(), owner, meetings.CreateInput{Title: "Shared", StartsOn: f.now.Add(24 * time.Hour).Format(time.DateOnly), Timezone: "UTC"}, "88000000-0000-4000-8000-000000000003")
	if err != nil {
		t.Fatal(err)
	}

	_, err = f.meetings.Respond(t.Context(), guest, "", created.InvitationToken, meetings.Going, 0, "88000000-0000-4000-8000-000000000004")
	if err != nil {
		t.Fatal(err)
	}

	id := created.Details.Meeting.ID
	var before meetings.ChatStream
	var pending int
	err = f.store.View(t.Context(), func(r meetings.Reader) error {
		var err error
		before, err = r.ChatStream(id)
		if err != nil {
			return err
		}

		hints, err := r.PendingChatHints(f.now, 100)
		pending = len(hints)

		return err
	})
	if err != nil {
		t.Fatal(err)
	}

	abort := errors.New("identity completion failed")
	err = f.atomic(t.Context(), func(_ accounts.Identity, m accounts.Meetings) error {
		if err := m.RemoveAccount(t.Context(), owner.ID); err != nil {
			return err
		}

		return abort
	})
	if !errors.Is(err, abort) {
		t.Fatal(err)
	}

	err = f.store.View(t.Context(), func(r meetings.Reader) error {
		after, err := r.ChatStream(id)
		if err != nil {
			return err
		}

		if before != after {
			t.Fatal("journal escaped outer account rollback")
		}

		hints, err := r.PendingChatHints(f.now, 100)
		if err != nil {
			return err
		}

		if len(hints) != pending {
			t.Fatal("outbox purge/insert escaped rollback")
		}

		removed, err := r.UserRemoved(owner.ID)
		if err != nil {
			return err
		}

		if removed {
			t.Fatal("account fence escaped rollback")
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	if err := accounts.New(f.atomic).Delete(t.Context(), f.input); err != nil {
		t.Fatal(err)
	}

	err = f.store.View(t.Context(), func(r meetings.Reader) error {
		after, err := r.ChatStream(id)
		if err != nil {
			return err
		}

		if after.Epoch != before.Epoch || after.LatestSequence <= before.LatestSequence {
			t.Fatal("account path missed journal")
		}

		page, err := r.ChatChanges(id, before.LatestSequence, after.LatestSequence, 100)
		if err != nil {
			return err
		}

		found := false
		for _, c := range page.Changes {
			if c.Kind == "history_invalidated" {
				found = true
			}
		}

		if !found {
			t.Fatal("missing privacy invalidation")
		}

		hints, err := r.PendingChatHints(f.now, 100)
		if err != nil {
			return err
		}

		for _, h := range hints {
			if h.Target == "user" && h.TargetID == owner.ID {
				t.Fatal("deleted recipient retained")
			}
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}
