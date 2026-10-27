package meetings_test

import (
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestChatReadLegacyEndpointsBeforeSync(t *testing.T) {
	for _, operation := range []string{"receipts", "readers"} {
		t.Run(operation, func(t *testing.T) {
			f := readFixture(t)
			id, entryID := key(2300), key(2301)
			must(t, f.store.Update(ctx, func(w meetings.Writer) error {
				if err := w.SaveMeeting(meetings.Meeting{ID: id, OrganizerID: owner.ID}); err != nil {
					return err
				}

				_, err := w.AppendEntry(meetings.FeedEntry{ID: entryID, MeetingID: id, Kind: "message", ActorID: owner.ID, ActorName: owner.Name, Payload: []byte(`{"text":"before rollout"}`)})

				return err
			}))
			must(t, f.app.InitializeChatReadState(ctx))
			query := func(actor meetings.Actor) (uint64, error) {
				if operation == "receipts" {
					result, err := f.app.QueryReadReceipts(ctx, actor, id, []string{entryID})
					if err == nil && (len(result.Receipts) != 1 || result.Receipts[0].ReaderCount != 0) {
						t.Fatal("activation invented a receipt", result)
					}

					return result.ProjectionVersion, err
				}

				result, err := f.app.MessageReaders(ctx, actor, id, entryID, "", 10)
				if err == nil && (len(result.UserIDs) != 0 || result.ReaderCount != 0 || result.NextCursor != "") {
					t.Fatal("activation invented readers", result)
				}

				return result.ProjectionVersion, err
			}
			_, err := query(outsider)
			assertError(t, err, meetings.ErrForbidden)
			must(t, f.store.View(ctx, func(r meetings.Reader) error {
				_, err := r.ChatStream(id)
				assertError(t, err, meetings.ErrNotFound)

				return nil
			}))
			if operation == "readers" {
				_, err := f.app.MessageReaders(ctx, owner, id, entryID, "stale-cursor", 10)
				assertError(t, err, meetings.ErrSyncResetRequired)
			}

			version, err := query(owner)
			must(t, err)
			if version != 0 {
				t.Fatal("read-only initialization appended journal changes", version)
			}

			var epoch string
			must(t, f.store.View(ctx, func(r meetings.Reader) error {
				stream, err := r.ChatStream(id)
				must(t, err)
				epoch = stream.Epoch
				marker, err := r.ChatReadMarker(id, owner.ID)
				must(t, err)
				if epoch == "" || marker.Baseline != 1 || marker.ReadThrough != 0 {
					t.Fatal("legacy initialization changed read baseline", stream, marker)
				}

				hints, err := r.PendingChatHints(time.Unix(f.clock.Load(), 0), 100)
				must(t, err)
				for _, hint := range hints {
					if hint.MeetingID == id {
						t.Fatal("read-only initialization published a hint", hint)
					}
				}

				return nil
			}))
			_, err = query(owner)
			must(t, err)
			snapshot, err := f.app.Sync(ctx, owner, id, meetings.SyncQuery{Limit: 10})
			must(t, err)
			if snapshot.StreamEpoch != epoch || snapshot.ProjectionVersion != 0 || len(snapshot.Entries) != 1 {
				t.Fatal("unstable initialization", snapshot)
			}
		})
	}
}
