package meetings_test

import (
	"bytes"
	"encoding/base64"
	"image"
	"image/color"
	"image/png"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func coverInput(t *testing.T, tint color.RGBA) *meetings.CoverInput {
	t.Helper()
	pixels := image.NewRGBA(image.Rect(0, 0, 3, 2))
	for y := range 2 {
		for x := range 3 {
			pixels.SetRGBA(x, y, tint)
		}
	}

	var encoded bytes.Buffer
	must(t, png.Encode(&encoded, pixels))

	return &meetings.CoverInput{MediaType: "image/png", Data: base64.StdEncoding.EncodeToString(encoded.Bytes())}
}

func TestCoverCreationAccessReplacementAndLateRetry(t *testing.T) {
	f := setup(t)
	input := validInput()
	input.Cover = coverInput(t, color.RGBA{R: 255, A: 255})
	created, err := f.app.Create(ctx, owner, input, key(100))
	must(t, err)
	f.created = created
	id, version := created.Details.Meeting.ID, created.Details.Meeting.CoverVersion
	if version == "" {
		t.Fatal("cover version missing")
	}

	original, err := f.app.ReadCover(ctx, owner, id, version)
	must(t, err)
	if original.Width != 3 || original.Height != 2 || original.MediaType != "image/png" {
		t.Fatal("wrong normalized cover")
	}

	decoded, err := png.Decode(bytes.NewReader(original.Data))
	must(t, err)
	r, g, b, _ := decoded.At(0, 0).RGBA()
	if r != 65535 || g != 0 || b != 0 {
		t.Fatal("wrong pixels")
	}

	_, err = f.app.ReadCover(ctx, guest, id, version)
	assertError(t, err, meetings.ErrForbidden)
	public, err := f.app.ReadInvitationCover(ctx, created.InvitationToken, version)
	must(t, err)
	if !bytes.Equal(public.Data, original.Data) {
		t.Fatal("invitation image mismatch")
	}

	_, err = f.app.ReadInvitationCover(ctx, "invalid", version)
	assertError(t, err, meetings.ErrNotFound)
	_, err = f.app.ReadCover(ctx, owner, id, "old")
	assertError(t, err, meetings.ErrNotFound)
	respond(t, f, meetings.Going, 0, 101)
	_, err = f.app.ReadCover(ctx, guest, id, version)
	must(t, err)
	blue := coverInput(t, color.RGBA{B: 255, A: 255})
	change := meetings.UpdateInput{ExpectedRevision: 2, Cover: &meetings.CoverChange{Value: blue}}
	_, err = f.app.Update(ctx, guest, id, change, key(102))
	assertError(t, err, meetings.ErrForbidden)
	updated, err := f.app.Update(ctx, owner, id, change, key(103))
	must(t, err)
	if updated.Meeting.Revision != 3 || updated.Meeting.CoverVersion == version {
		t.Fatal("replacement not reflected")
	}

	_, err = f.app.ReadCover(ctx, owner, id, version)
	assertError(t, err, meetings.ErrNotFound)
	repeated, err := f.app.Create(ctx, owner, input, key(100))
	must(t, err)
	if repeated.Details.Meeting.CoverVersion != updated.Meeting.CoverVersion {
		t.Fatal("late creation restored old photo")
	}

	input.Cover = blue
	_, err = f.app.Create(ctx, owner, input, key(100))
	assertError(t, err, meetings.ErrIdempotencyConflict)
	changed, err := f.app.Update(ctx, owner, id, meetings.UpdateInput{ExpectedRevision: 3, Title: meetings.Field{Present: true, Value: "Other title"}}, key(104))
	must(t, err)
	if changed.Meeting.CoverVersion != updated.Meeting.CoverVersion {
		t.Fatal("legacy patch removed cover")
	}

	respond(t, f, meetings.Maybe, 1, 105)
	_, err = f.app.ReadCover(ctx, guest, id, changed.Meeting.CoverVersion)
	assertError(t, err, meetings.ErrForbidden)
	removed, err := f.app.Update(ctx, owner, id, meetings.UpdateInput{ExpectedRevision: 5, Cover: &meetings.CoverChange{}}, key(106))
	must(t, err)
	if removed.Meeting.CoverVersion != "" || removed.Meeting.Revision != 6 {
		t.Fatal("explicit removal ignored")
	}

	_, err = f.app.ReadInvitationCover(ctx, created.InvitationToken, changed.Meeting.CoverVersion)
	assertError(t, err, meetings.ErrNotFound)
	late, err := f.app.Update(ctx, owner, id, change, key(103))
	must(t, err)
	if late.Meeting.CoverVersion != "" {
		t.Fatal("late patch restored removed cover")
	}
}

func TestCoversRemainSeparateAndReadersCannotMutatePayloads(t *testing.T) {
	f := setup(t)
	var versions []string
	for i, tint := range []color.RGBA{{R: 255, A: 255}, {B: 255, A: 255}} {
		input := validInput()
		input.Cover = coverInput(t, tint)
		created, err := f.app.Create(ctx, owner, input, key(100+i))
		must(t, err)
		cover, err := f.app.ReadCover(ctx, owner, created.Details.Meeting.ID, created.Details.Meeting.CoverVersion)
		must(t, err)
		versions = append(versions, cover.Version)
		cover.Data[0] = 0
		again, err := f.app.ReadCover(ctx, owner, cover.MeetingID, cover.Version)
		must(t, err)
		if again.Data[0] == 0 {
			t.Fatal("reader mutated stored bytes")
		}
	}

	if versions[0] == versions[1] {
		t.Fatal("different pictures shared a version")
	}

	plain, err := f.app.Details(ctx, owner, f.created.Details.Meeting.ID)
	must(t, err)
	if plain.Meeting.CoverVersion != "" {
		t.Fatal("photo leaked into another meeting")
	}
}
