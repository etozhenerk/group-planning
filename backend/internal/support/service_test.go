package support_test

import (
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"image"
	"image/png"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
	"github.com/etozhenerk/group-planning/backend/internal/support"
)

func input(n int) support.Input {
	return support.Input{ClientRequestID: fmt.Sprintf("10000000-0000-4000-8000-%012d", n), Kind: "problem", Description: "Не открывается экран встречи", Screen: "meeting_chat"}
}

func submit(s *support.Service, n int) (support.Receipt, error) {
	v := input(n)
	return s.Submit(context.Background(), v, v.ClientRequestID, "test-source")
}

type deliveryFunc func(context.Context, support.Feedback) (support.Progress, error)

func (f deliveryFunc) Send(ctx context.Context, v support.Feedback) (support.Progress, error) {
	return f(ctx, v)
}

func TestAcceptanceIsAtomicAndIdempotent(t *testing.T) {
	store := memory.NewSupport()
	now := time.Now()
	service := support.New(store, nil, func() time.Time { return now })
	var group sync.WaitGroup
	receipts := make(chan support.Receipt, 12)
	for i := 0; i < 12; i++ {
		group.Go(func() {
			receipt, err := submit(service, 1)
			if err != nil {
				t.Error(err)
			}

			receipts <- receipt
		})
	}

	group.Wait()
	close(receipts)
	var first support.Receipt
	for receipt := range receipts {
		if first.ID == "" {
			first = receipt
		}

		if receipt != first || !strings.HasPrefix(receipt.Reference, "SW-") {
			t.Fatal("duplicate acceptance changed receipt")
		}
	}

	changed := input(1)
	changed.Description += " снова"
	if _, err := service.Submit(context.Background(), changed, changed.ClientRequestID, "other"); !errors.Is(err, support.ErrIdempotencyConflict) {
		t.Fatalf("changed content: %v", err)
	}

	for i := 2; i <= 5; i++ {
		if _, err := submit(service, i); err != nil {
			t.Fatal(err)
		}
	}

	if _, err := submit(service, 6); !errors.Is(err, support.ErrRateLimited) {
		t.Fatalf("missing rate limit: %v", err)
	}

	if repeat, err := submit(service, 1); err != nil || repeat != first {
		t.Fatal("accepted retry charged rate limit")
	}

	now = now.Add(10 * time.Minute)
	if _, err := submit(service, 6); err != nil {
		t.Fatal(err)
	}
}

func TestValidationAndScreenshot(t *testing.T) {
	service := support.New(memory.NewSupport(), nil, time.Now)
	for _, modify := range []func(*support.Input){
		func(v *support.Input) { v.Description = " коротко " }, func(v *support.Input) { v.Description = strings.Repeat("🙂", 3001) },
		func(v *support.Input) { v.Kind = "unknown" }, func(v *support.Input) { v.Screen = "https://private.test/?token=secret" },
		func(v *support.Input) { email := "Name <mail@example.test>"; v.Email = &email },
		func(v *support.Input) {
			v.Diagnostics = &support.Diagnostics{Platform: "web", ClientVersion: "", Browser: ""}
		},
		func(v *support.Input) {
			v.Screenshot = &support.ScreenshotInput{FileName: "screen.png", ContentType: "image/png", DataBase64: base64.StdEncoding.EncodeToString([]byte("not an image"))}
		},
	} {
		v := input(1)
		modify(&v)
		_, err := service.Submit(context.Background(), v, v.ClientRequestID, "source")
		var invalid support.ValidationError
		if !errors.As(err, &invalid) {
			t.Fatalf("accepted invalid input: %v", err)
		}
	}

	store := memory.NewSupport()
	service = support.New(store, nil, time.Now)
	var imageBytes bytes.Buffer
	if err := png.Encode(&imageBytes, image.NewRGBA(image.Rect(0, 0, 4, 3))); err != nil {
		t.Fatal(err)
	}

	v := input(1)
	v.Screenshot = &support.ScreenshotInput{FileName: "screen.png", ContentType: "image/png", DataBase64: base64.StdEncoding.EncodeToString(imageBytes.Bytes())}
	if _, err := service.Submit(context.Background(), v, v.ClientRequestID, "source"); err != nil {
		t.Fatal(err)
	}

	if err := store.Update(context.Background(), func(r support.Records) error {
		stored, _, err := r.ByKey(v.ClientRequestID)
		if err != nil {
			return err
		}

		if stored.Diagnostics != nil || stored.Email != "" || stored.Screenshot == nil {
			t.Fatal("implicit data or missing screenshot")
		}

		_, err = png.Decode(bytes.NewReader(stored.Screenshot.Data))

		return err
	}); err != nil {
		t.Fatal(err)
	}
}

func TestDeliveryRetrySurvivesServiceRecreation(t *testing.T) {
	store := memory.NewSupport()
	now := time.Now()
	calls := 0
	delivery := deliveryFunc(func(_ context.Context, item support.Feedback) (support.Progress, error) {
		calls++
		if calls == 1 {
			return support.Progress{MessageID: 8, SentChunks: 1}, errors.New("private upstream error")
		}

		if item.Progress.MessageID != 8 {
			t.Error("lost acknowledgement")
		}

		return support.Progress{MessageID: 8, SentChunks: 1, FileMessageID: 9}, nil
	})
	service := support.New(store, delivery, func() time.Time { return now })
	if _, err := submit(service, 1); err != nil {
		t.Fatal(err)
	}

	if work, err := service.DeliverNext(context.Background()); !work || !errors.Is(err, support.ErrUnavailable) {
		t.Fatal("missing retryable delivery failure")
	}

	if work, err := service.DeliverNext(context.Background()); work || err != nil {
		t.Fatal("retried before backoff")
	}

	now = now.Add(time.Minute)
	service = support.New(store, delivery, func() time.Time { return now })
	if work, err := service.DeliverNext(context.Background()); !work || err != nil {
		t.Fatal("stored retry not delivered")
	}

	if work, err := service.DeliverNext(context.Background()); work || err != nil {
		t.Fatal("already delivered feedback resent")
	}
}

func TestConcurrentWorkersDoNotSendTheSameLease(t *testing.T) {
	started := make(chan struct{})
	finish := make(chan struct{})
	done := make(chan error, 1)
	service := support.New(memory.NewSupport(), deliveryFunc(func(context.Context, support.Feedback) (support.Progress, error) {
		close(started)
		<-finish

		return support.Progress{MessageID: 1}, nil
	}), time.Now)
	if _, err := submit(service, 1); err != nil {
		t.Fatal(err)
	}

	go func() { _, err := service.DeliverNext(context.Background()); done <- err }()
	<-started
	if work, err := service.DeliverNext(context.Background()); work || err != nil {
		t.Error("duplicate delivery lease")
	}

	close(finish)
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}
