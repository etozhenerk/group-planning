package imagecontent

import (
	"bytes"
	"encoding/binary"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"os"
	"testing"
)

func TestOrientationAllEightTransforms(t *testing.T) {
	source := image.NewNRGBA(image.Rect(0, 0, 2, 3))
	for y := 0; y < 3; y++ {
		for x := 0; x < 2; x++ {
			source.Set(x, y, color.NRGBA{R: uint8(y*2 + x + 1), A: 255})
		}
	}

	expected := [][]uint8{{1, 2, 3, 4, 5, 6}, {2, 1, 4, 3, 6, 5}, {6, 5, 4, 3, 2, 1}, {5, 6, 3, 4, 1, 2}, {1, 3, 5, 2, 4, 6}, {5, 3, 1, 6, 4, 2}, {6, 4, 2, 5, 3, 1}, {2, 4, 6, 1, 3, 5}}
	for index, want := range expected {
		actual := orientImage(source, uint16(index+1))
		got := []uint8{}
		for y := 0; y < actual.Bounds().Dy(); y++ {
			for x := 0; x < actual.Bounds().Dx(); x++ {
				r, _, _, _ := actual.At(x, y).RGBA()
				got = append(got, uint8(r>>8))
			}
		}

		if !bytes.Equal(got, want) {
			t.Fatalf("orientation %d: %v != %v", index+1, got, want)
		}
	}
}

func TestWebPIsDecodedAndNormalized(t *testing.T) {
	raw, err := os.ReadFile("testdata/lossless.webp")
	if err != nil {
		t.Fatal(err)
	}

	normalized, kind, err := Prepare(raw, "image/webp", 10<<20)
	if err != nil {
		t.Fatal(err)
	}

	if kind != "image/png" {
		t.Fatal("unexpected normalized format")
	}

	if _, err := png.Decode(bytes.NewReader(normalized)); err != nil {
		t.Fatal("normalized bytes invalid", err)
	}
}

func TestPrepareRotatesThenStripsEXIFAndBounds(t *testing.T) {
	source := image.NewNRGBA(image.Rect(0, 0, 20, 30))
	var encoded bytes.Buffer
	if err := jpeg.Encode(&encoded, source, nil); err != nil {
		t.Fatal(err)
	}

	tiff := []byte{'I', 'I', 42, 0, 8, 0, 0, 0, 1, 0, 0x12, 1, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0}
	payload := append([]byte("Exif\x00\x00"), tiff...)
	payload = append(payload, []byte("private-location-and-camera")...)
	marker := []byte{0xff, 0xe1, 0, 0}
	binary.BigEndian.PutUint16(marker[2:], uint16(len(payload)+2))
	raw := append(bytes.Clone(encoded.Bytes()[:2]), marker...)
	raw = append(raw, payload...)
	raw = append(raw, encoded.Bytes()[2:]...)
	content, kind, err := Prepare(raw, "image/jpeg", 5<<20)
	if err != nil {
		t.Fatal(err)
	}

	if kind != "image/jpeg" || bytes.Contains(content, []byte("Exif")) || bytes.Contains(content, []byte("private-location")) {
		t.Fatal("metadata retained")
	}

	config, _, err := image.DecodeConfig(bytes.NewReader(content))
	if err != nil || config.Width != 30 || config.Height != 20 {
		t.Fatal("orientation lost")
	}

	if _, _, err := Prepare(raw, "image/png", 5<<20); err == nil {
		t.Fatal("accepted mismatched type")
	}

	if _, _, err := Prepare(raw, "image/jpeg", 4); err == nil {
		t.Fatal("accepted oversized image")
	}

	large := image.NewNRGBA(image.Rect(0, 0, 8193, 1))
	encoded.Reset()
	if err := png.Encode(&encoded, large); err != nil {
		t.Fatal(err)
	}

	if _, _, err := Prepare(encoded.Bytes(), "image/png", 5<<20); err == nil {
		t.Fatal("accepted unbounded dimensions")
	}

	for _, invalid := range [][]byte{nil, []byte("II"), []byte("II*\x00\xff\xff\xff\xff")} {
		if tiffOrientation(invalid) != 1 {
			t.Fatal("malformed EXIF")
		}
	}
}
