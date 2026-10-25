package meetings_test

import (
	"bytes"
	"encoding/base64"
	"encoding/binary"
	"errors"
	"hash/crc32"
	"image"
	"image/color"
	"image/jpeg"
	"strings"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestCoverRejectsAnimationAndStripsJPEGMetadata(t *testing.T) {
	f := setup(t)
	input := validInput()
	pngInput := coverInput(t, color.RGBA{R: 255, A: 255})
	pngData, err := base64.StdEncoding.DecodeString(pngInput.Data)
	must(t, err)
	chunk := make([]byte, 20)
	binary.BigEndian.PutUint32(chunk[:4], 8)
	copy(chunk[4:8], "acTL")
	binary.BigEndian.PutUint32(chunk[8:12], 2)
	binary.BigEndian.PutUint32(chunk[16:20], crc32.ChecksumIEEE(chunk[4:16]))
	animated := append(append(append([]byte{}, pngData[:33]...), chunk...), pngData[33:]...)
	input.Cover = &meetings.CoverInput{MediaType: "image/png", Data: base64.StdEncoding.EncodeToString(animated)}
	_, err = f.app.Create(ctx, owner, input, key(100))
	var validation meetings.ValidationError
	if !errors.As(err, &validation) || validation.Fields["cover"] != "format" {
		t.Fatalf("animation accepted: %v", err)
	}

	var jpegBytes bytes.Buffer
	must(t, jpeg.Encode(&jpegBytes, image.NewRGBA(image.Rect(0, 0, 2, 2)), nil))
	secret := []byte("private-photo-metadata")
	comment := append([]byte{0xff, 0xfe, 0, byte(len(secret) + 2)}, secret...)
	data := append(append(append([]byte{}, jpegBytes.Bytes()[:2]...), comment...), jpegBytes.Bytes()[2:]...)
	input.Cover = &meetings.CoverInput{MediaType: "image/jpeg", Data: base64.StdEncoding.EncodeToString(data)}
	created, err := f.app.Create(ctx, owner, input, key(100))
	must(t, err)
	cover, err := f.app.ReadCover(ctx, owner, created.Details.Meeting.ID, created.Details.Meeting.CoverVersion)
	must(t, err)
	if bytes.Contains(cover.Data, secret) || cover.MediaType != "image/jpeg" {
		t.Fatal("private metadata retained")
	}

	_, err = jpeg.Decode(bytes.NewReader(cover.Data))
	must(t, err)
}

func resizedPNGHeader(t *testing.T, width, height uint32) string {
	t.Helper()
	data, err := base64.StdEncoding.DecodeString(coverInput(t, color.RGBA{A: 255}).Data)
	must(t, err)
	binary.BigEndian.PutUint32(data[16:20], width)
	binary.BigEndian.PutUint32(data[20:24], height)
	binary.BigEndian.PutUint32(data[29:33], crc32.ChecksumIEEE(data[12:29]))

	return base64.StdEncoding.EncodeToString(data)
}

func TestCoverValidationRejectsUnboundedOrInvalidInputWithoutWrites(t *testing.T) {
	valid := coverInput(t, color.RGBA{R: 255, A: 255})
	cases := map[string]meetings.CoverInput{
		"svg":        {MediaType: "image/svg+xml", Data: base64.StdEncoding.EncodeToString([]byte("<svg/>"))},
		"url":        {MediaType: "image/png", Data: "https://example.test/image.png"},
		"base64":     {MediaType: "image/png", Data: "%%%"},
		"empty":      {MediaType: "image/png"},
		"wrong mime": {MediaType: "image/jpeg", Data: valid.Data},
		"oversize":   {MediaType: "image/png", Data: strings.Repeat("A", base64.StdEncoding.EncodedLen(meetings.MaxCoverBytes)+4)},
		"width":      {MediaType: "image/png", Data: resizedPNGHeader(t, 8193, 1)},
		"pixels":     {MediaType: "image/png", Data: resizedPNGHeader(t, 4001, 4000)},
		"truncated":  {MediaType: "image/png", Data: base64.StdEncoding.EncodeToString([]byte("\x89PNG\r\n\x1a\n"))},
	}
	for name, cover := range cases {
		t.Run(name, func(t *testing.T) {
			f := setup(t)
			input := validInput()
			input.Cover = &cover
			_, err := f.app.Create(ctx, owner, input, key(100))
			var validation meetings.ValidationError
			if !errors.As(err, &validation) || validation.Fields["cover"] == "" {
				t.Fatalf("wrong rejection: %v", err)
			}

			must(t, f.store.View(ctx, func(r meetings.Reader) error {
				all, err := r.Meetings()
				if len(all) != 1 {
					t.Fatal("invalid photo created a meeting")
				}

				return err
			}))
		})
	}
}
