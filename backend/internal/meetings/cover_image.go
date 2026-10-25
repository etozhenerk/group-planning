package meetings

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"encoding/hex"
	"image"
	"image/jpeg"
	"image/png"
)

func prepareCover(input *CoverInput) (*Cover, error) {
	if input == nil {
		return nil, nil
	}

	invalid := func(reason string) (*Cover, error) { return nil, ValidationError{map[string]string{"cover": reason}} }
	if input.MediaType != "image/jpeg" && input.MediaType != "image/png" {
		return invalid("format")
	}

	if len(input.Data) > base64.StdEncoding.EncodedLen(MaxCoverBytes) {
		return invalid("too_large")
	}

	data, err := base64.StdEncoding.Strict().DecodeString(input.Data)
	if err != nil || len(data) == 0 {
		return invalid("invalid")
	}

	if len(data) > MaxCoverBytes {
		return invalid("too_large")
	}

	config, format, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil || "image/"+format != input.MediaType {
		return invalid("invalid")
	}

	if config.Width <= 0 || config.Height <= 0 || config.Width > MaxCoverDimension || config.Height > MaxCoverDimension || int64(config.Width)*int64(config.Height) > MaxCoverPixels {
		return invalid("dimensions")
	}

	if format == "png" && animatedPNG(data) {
		return invalid("format")
	}

	pixels, decodedFormat, err := image.Decode(bytes.NewReader(data))
	if err != nil || decodedFormat != format || pixels.Bounds().Dx() != config.Width || pixels.Bounds().Dy() != config.Height {
		return invalid("invalid")
	}

	var encoded bytes.Buffer
	if format == "jpeg" {
		err = jpeg.Encode(&encoded, pixels, &jpeg.Options{Quality: 85})
	} else {
		err = png.Encode(&encoded, pixels)
	}

	if err != nil {
		return invalid("invalid")
	}

	if encoded.Len() > MaxCoverBytes {
		return invalid("too_large")
	}

	digest := sha256.Sum256(encoded.Bytes())

	return &Cover{Version: hex.EncodeToString(digest[:]), MediaType: input.MediaType, Data: encoded.Bytes(), Width: config.Width, Height: config.Height}, nil
}

func animatedPNG(data []byte) bool {
	for offset := 8; offset+12 <= len(data); {
		length := int64(binary.BigEndian.Uint32(data[offset : offset+4]))
		if string(data[offset+4:offset+8]) == "acTL" {
			return true
		}

		if length > int64(len(data)-offset-12) {
			return false
		}

		offset += int(length) + 12
	}

	return false
}
