package memory

import (
	"context"
	"errors"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/support"
)

func TestSupportRollbackCopiesAndClosedTransaction(t *testing.T) {
	store := NewSupport()
	ctx := context.Background()
	var retained support.Records
	value := support.Feedback{Key: "one", Screenshot: &support.Screenshot{Data: []byte{1}}, Diagnostics: &support.Diagnostics{Viewport: &support.Viewport{Width: 390}}}
	if err := store.Update(ctx, func(r support.Records) error { retained = r; return r.Put(value) }); err != nil {
		t.Fatal(err)
	}

	value.Screenshot.Data[0] = 9
	value.Diagnostics.Viewport.Width = 1
	if err := retained.Put(value); err != support.ErrUnavailable {
		t.Fatal("transaction remained usable")
	}

	rollback := errors.New("rollback")
	if err := store.Update(ctx, func(r support.Records) error {
		v, _, _ := r.ByKey("one")
		if v.Screenshot.Data[0] != 1 || v.Diagnostics.Viewport.Width != 390 {
			t.Fatal("write aliases caller data")
		}

		v.Screenshot.Data[0] = 5
		v.Key = "two"
		if err := r.Put(v); err != nil {
			return err
		}

		return rollback
	}); err != rollback {
		t.Fatal(err)
	}

	if err := store.Update(ctx, func(r support.Records) error {
		items, err := r.All()
		if err != nil {
			return err
		}

		if len(items) != 1 || items[0].Screenshot.Data[0] != 1 {
			t.Fatal("rollback/read alias leaked")
		}

		return nil
	}); err != nil {
		t.Fatal(err)
	}
}
