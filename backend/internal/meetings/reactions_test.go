package meetings_test

import (
	"sync"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestReactionsConcurrencyRetryAndRevocation(t *testing.T) {
	f := setup(t)
	id := f.created.Details.Meeting.ID
	message, err := f.app.SendMessage(ctx, owner, id, "Привет", key(40), key(40))
	must(t, err)
	respond(t, f, meetings.Going, 0, 41)
	var wg sync.WaitGroup
	for range 8 {
		wg.Go(func() {
			_, err := f.app.SetReaction(ctx, guest, id, message.ID, "❤️", true, key(42))
			if err != nil {
				t.Error(err)
			}
		})
	}

	wg.Wait()
	views, err := f.app.Reactions(ctx, owner, id, []string{message.ID})
	must(t, err)
	if len(views) != 1 || len(views[0].Reactions) != 1 || len(views[0].Reactions[0].UserIDs) != 1 || views[0].Reactions[0].Mine {
		t.Fatalf("duplicated or wrong mine: %+v", views)
	}

	_, err = f.app.SetReaction(ctx, guest, id, message.ID, "🔥", true, key(43))
	must(t, err)
	_, err = f.app.SetReaction(ctx, guest, id, message.ID, "❤️", false, key(44))
	must(t, err)
	// A lost response to the older add cannot resurrect a later removed reaction.
	view, err := f.app.SetReaction(ctx, guest, id, message.ID, "❤️", true, key(42))
	must(t, err)
	if len(view.Reactions) != 1 || view.Reactions[0].Emoji != "🔥" {
		t.Fatal("old retry resurrected removed reaction")
	}

	respond(t, f, meetings.NotGoing, 1, 45)
	views, err = f.app.Reactions(ctx, owner, id, []string{message.ID})
	must(t, err)
	if len(views[0].Reactions) != 0 {
		t.Fatal("former participant exposed")
	}

	_, err = f.app.Reactions(ctx, guest, id, []string{message.ID})
	assertError(t, err, meetings.ErrForbidden)
	_, err = f.app.SetReaction(ctx, guest, id, message.ID, "👍", true, key(46))
	assertError(t, err, meetings.ErrForbidden)
	_, err = f.app.SetReaction(ctx, owner, id, f.created.Details.Meeting.ID, "👍", true, key(47))
	assertError(t, err, meetings.ErrNotFound)
	for _, invalid := range []string{"hello", "🔥🔥", "", "<script>", "a\n"} {
		if _, err := f.app.SetReaction(ctx, owner, id, message.ID, invalid, true, key(48)); err == nil {
			t.Fatal("accepted non-emoji")
		}
	}
}
