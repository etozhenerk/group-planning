package postgres

import (
	"errors"
	"fmt"
	"os"
	"reflect"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestPersistentWorkerLeaseAndIdempotency(t *testing.T) {
	db := integrationDB(t)
	ctx := t.Context()
	other, err := Open(ctx, os.Getenv("SOMEWHERE_TEST_DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer other.Close()
	key := fmt.Sprintf("%x-%x-%x-%x-%x", randBytes(4), randBytes(2), randBytes(2), randBytes(2), randBytes(6))
	now := time.Date(2001, 1, 1, 12, 0, 0, 0, time.UTC)
	clock := func() time.Time { return now }
	a, b := meetings.NewService(db.Meetings(), clock), meetings.NewService(other.Meetings(), clock)
	actor := meetings.Actor{ID: key, Name: "Worker test"}
	input := meetings.CreateInput{Title: "Lease recovery", StartsOn: "2001-01-02", Timezone: "UTC"}
	first, err := a.Create(ctx, actor, input, key)
	if err != nil {
		t.Fatal(err)
	}

	retry, err := b.Create(ctx, actor, input, key)
	if err != nil || !reflect.DeepEqual(first, retry) {
		t.Fatal("create retry differs", err)
	}

	now = time.Date(2001, 1, 3, 12, 0, 0, 0, time.UTC)
	options := meetings.DefaultTransitionOptions()
	old, err := a.ClaimTransition(ctx, options)
	if err != nil {
		t.Fatal(err)
	}

	if _, err := b.ClaimTransition(ctx, options); !errors.Is(err, meetings.ErrNotFound) {
		t.Fatal("second worker took active lease", err)
	}

	now = now.Add(options.Lease + time.Second)
	recovered, err := b.ClaimTransition(ctx, options)
	if err != nil {
		t.Fatal(err)
	}

	if recovered.ID != old.ID || recovered.LeaseToken == old.LeaseToken {
		t.Fatal("lease recovery mismatch")
	}

	if err := a.CompleteTransition(ctx, old); !errors.Is(err, meetings.ErrTransitionLeaseLost) {
		t.Fatal("stale worker committed", err)
	}

	if err := b.CompleteTransition(ctx, recovered); err != nil {
		t.Fatal(err)
	}

	if err := a.CompleteTransition(ctx, recovered); err != nil {
		t.Fatal("completion retry failed", err)
	}

	err = db.Meetings().View(ctx, func(r meetings.Reader) error {
		m, err := r.Meeting(recovered.MeetingID)
		if err != nil {
			return err
		}

		if m.Status != meetings.Past {
			return errors.New("meeting did not become past")
		}

		job, err := r.TransitionJob(m.ID, m.ScheduleVersion)
		if err != nil {
			return err
		}

		if job.State != meetings.TransitionCompleted {
			return errors.New("job not acknowledged")
		}

		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}
