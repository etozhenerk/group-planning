// Package imagecontent validates bounded still images and strips metadata.
package imagecontent

import (
	"bytes"
	"encoding/binary"
	"errors"
	"image"
	"image/jpeg"
	"image/png"

	_ "golang.org/x/image/webp"
)

// Prepare returns re-encoded content and its actual type. WebP is normalized to PNG.
// No uploaded EXIF, comments, profiles or other metadata are copied.
func Prepare(data []byte, mediaType string, maximum int) ([]byte, string, error) {
	invalid := errors.New("invalid_image")
	if len(data) == 0 || len(data) > maximum {
		return nil, "", errors.New("image_size")
	}

	config, format, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil || "image/"+format != mediaType || (format != "jpeg" && format != "png" && format != "webp") {
		return nil, "", invalid
	}

	if config.Width < 1 || config.Height < 1 || config.Width > 8192 || config.Height > 8192 || int64(config.Width)*int64(config.Height) > 16_000_000 {
		return nil, "", errors.New("image_dimensions")
	}

	if animated(data, format) {
		return nil, "", invalid
	}

	pixels, decoded, err := image.Decode(bytes.NewReader(data))
	if err != nil || decoded != format || pixels.Bounds().Dx() != config.Width || pixels.Bounds().Dy() != config.Height {
		return nil, "", invalid
	}

	var buffer bytes.Buffer
	pixels = orientImage(pixels, imageOrientation(data, format))
	if format == "jpeg" {
		err = jpeg.Encode(&buffer, pixels, &jpeg.Options{Quality: 90})
	} else {
		err = png.Encode(&buffer, pixels)
		mediaType = "image/png"
	}

	if err != nil {
		return nil, "", invalid
	}

	if buffer.Len() > maximum {
		return nil, "", errors.New("image_size")
	}

	return buffer.Bytes(), mediaType, nil
}

func animated(data []byte, format string) bool {
	if format == "png" {
		for offset := 8; offset+12 <= len(data); {
			length := int64(binary.BigEndian.Uint32(data[offset : offset+4]))
			if string(data[offset+4:offset+8]) == "acTL" {
				return true
			}

			if length > int64(len(data)-offset-12) {
				return true
			}

			offset += int(length) + 12
		}
	}

	if format == "webp" {
		for offset := 12; offset+8 <= len(data); {
			kind := string(data[offset : offset+4])
			length := int64(binary.LittleEndian.Uint32(data[offset+4 : offset+8]))
			if kind == "ANIM" || kind == "ANMF" {
				return true
			}

			if length > int64(len(data)-offset-8) {
				return true
			}

			offset += 8 + int(length) + (int(length) & 1)
		}
	}

	return false
}
