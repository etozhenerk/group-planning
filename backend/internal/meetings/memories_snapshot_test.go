package meetings_test

import (
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestMemorySnapshotFiltersAndRemainsFixed(t *testing.T) {
	f, _ := mediaFixture(t)
	id := f.created.Details.Meeting.ID
	if _, err := f.app.MemorySnapshot(ctx, owner, id); err == nil {
		t.Fatal("upcoming snapshot allowed")
	}

	must(t, f.store.Update(ctx, func(w meetings.Writer) error {
		item, err := w.Meeting(id)
		if err != nil {
			return err
		}

		item.Status = meetings.Past

		return w.SaveMeeting(item)
	}))
	for index, purpose := range []string{"memory", "message", "memory"} {
		photo := reservePhoto(t, f, owner, purpose, 500+index)
		_, err := f.app.UploadMedia(ctx, owner, id, photo.ID, "image/png", mediaPhoto(t))
		must(t, err)
		if index != 2 {
			_, err = f.app.PublishMedia(ctx, owner, id, photo.ID, key(510+index))
			must(t, err)
		}
	}

	snapshot, err := f.app.MemorySnapshot(ctx, owner, id)
	must(t, err)
	if len(snapshot) != 1 || snapshot[0].Purpose != "memory" || snapshot[0].Status != "published" {
		t.Fatal("included chat or unpublished photo")
	}

	later := reservePhoto(t, f, owner, "memory", 520)
	_, err = f.app.UploadMedia(ctx, owner, id, later.ID, "image/png", mediaPhoto(t))
	must(t, err)
	_, err = f.app.PublishMedia(ctx, owner, id, later.ID, key(521))
	must(t, err)
	if len(snapshot) != 1 {
		t.Fatal("snapshot mutated")
	}

	_, err = f.app.MemorySnapshot(ctx, outsider, id)
	assertError(t, err, meetings.ErrForbidden)
	assertError(t, f.app.CheckMemoryAccess(ctx, outsider, id), meetings.ErrForbidden)
	must(t, f.app.CheckMemoryAccess(ctx, owner, id))
	snapshot[0].FileName = "mutated"
	current, err := f.app.MemorySnapshot(ctx, owner, id)
	must(t, err)
	if len(current) != 2 || current[0].FileName == "mutated" {
		t.Fatal("snapshot shared store data")
	}
}
