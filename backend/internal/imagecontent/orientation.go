package imagecontent

import (
	"bytes"
	"encoding/binary"
	"image"
)

// Only the bounded TIFF orientation field is read; other metadata is discarded.
func imageOrientation(data []byte, format string) uint16 {
	switch format {
	case "jpeg":
		for offset := 2; offset+4 <= len(data); {
			if data[offset] != 0xff {
				return 1
			}

			marker := data[offset+1]
			if marker == 0xda || marker == 0xd9 {
				return 1
			}

			if marker == 0xff {
				offset++
				continue
			}

			if marker == 0x01 || (marker >= 0xd0 && marker <= 0xd7) {
				offset += 2
				continue
			}

			size := int(binary.BigEndian.Uint16(data[offset+2 : offset+4]))
			if size < 2 || offset+2+size > len(data) {
				return 1
			}

			chunk := data[offset+4 : offset+2+size]
			if marker == 0xe1 && bytes.HasPrefix(chunk, []byte("Exif\x00\x00")) {
				return tiffOrientation(chunk[6:])
			}

			offset += 2 + size
		}
	case "png":
		for offset := 8; offset+12 <= len(data); {
			size := int64(binary.BigEndian.Uint32(data[offset : offset+4]))
			if size > int64(len(data)-offset-12) {
				return 1
			}

			if string(data[offset+4:offset+8]) == "eXIf" {
				return tiffOrientation(data[offset+8 : offset+8+int(size)])
			}

			offset += 12 + int(size)
		}
	case "webp":
		for offset := 12; offset+8 <= len(data); {
			size := int64(binary.LittleEndian.Uint32(data[offset+4 : offset+8]))
			if size > int64(len(data)-offset-8) {
				return 1
			}

			if string(data[offset:offset+4]) == "EXIF" {
				chunk := data[offset+8 : offset+8+int(size)]
				chunk = bytes.TrimPrefix(chunk, []byte("Exif\x00\x00"))

				return tiffOrientation(chunk)
			}

			offset += 8 + int(size) + (int(size) & 1)
		}
	}

	return 1
}

func tiffOrientation(data []byte) uint16 {
	if len(data) < 8 {
		return 1
	}

	var order binary.ByteOrder
	switch string(data[:2]) {
	case "II":
		order = binary.LittleEndian
	case "MM":
		order = binary.BigEndian
	default:
		return 1
	}

	if order.Uint16(data[2:4]) != 42 {
		return 1
	}

	offset := uint64(order.Uint32(data[4:8]))
	if offset < 8 || offset+2 > uint64(len(data)) {
		return 1
	}

	count := uint64(order.Uint16(data[offset : offset+2]))
	offset += 2
	if count > 4096 || count*12 > uint64(len(data))-offset {
		return 1
	}

	for i := uint64(0); i < count; i++ {
		entry := data[offset+i*12 : offset+(i+1)*12]
		if order.Uint16(entry[:2]) == 0x112 && order.Uint16(entry[2:4]) == 3 && order.Uint32(entry[4:8]) == 1 {
			value := order.Uint16(entry[8:10])
			if value >= 1 && value <= 8 {
				return value
			}

			return 1
		}
	}

	return 1
}

func orientImage(source image.Image, orientation uint16) image.Image {
	if orientation <= 1 || orientation > 8 {
		return source
	}

	bounds := source.Bounds()
	width, height := bounds.Dx(), bounds.Dy()
	outputWidth, outputHeight := width, height
	if orientation >= 5 {
		outputWidth, outputHeight = height, width
	}

	result := image.NewNRGBA(image.Rect(0, 0, outputWidth, outputHeight))
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			dx, dy := x, y
			switch orientation {
			case 2:
				dx = width - 1 - x
			case 3:
				dx, dy = width-1-x, height-1-y
			case 4:
				dy = height - 1 - y
			case 5:
				dx, dy = y, x
			case 6:
				dx, dy = height-1-y, x
			case 7:
				dx, dy = height-1-y, width-1-x
			case 8:
				dx, dy = y, width-1-x
			}

			result.Set(dx, dy, source.At(bounds.Min.X+x, bounds.Min.Y+y))
		}
	}

	return result
}
