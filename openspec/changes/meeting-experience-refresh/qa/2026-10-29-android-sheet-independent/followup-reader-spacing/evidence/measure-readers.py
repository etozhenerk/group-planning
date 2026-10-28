"""Independent screenshot geometry check; reads PNGs, never modifies baselines."""
import hashlib
import json
import pathlib
import struct
import zlib

root = pathlib.Path(__file__).parent

def read_png(path):
    blob = path.read_bytes()
    offset, compressed = 8, b''
    while offset < len(blob):
        length = struct.unpack('>I', blob[offset:offset + 4])[0]
        tag, chunk = blob[offset + 4:offset + 8], blob[offset + 8:offset + 8 + length]
        offset += length + 12
        if tag == b'IHDR':
            width, height, depth, colour, *_ = struct.unpack('>IIBBBBB', chunk)
        elif tag == b'IDAT':
            compressed += chunk
    assert depth == 8 and colour in (2, 6)
    channels = 3 if colour == 2 else 4
    size, raw, offset = width * channels, zlib.decompress(compressed), 0
    previous, rows = bytearray(size), []
    for _ in range(height):
        filtering = raw[offset]
        row = bytearray(raw[offset + 1:offset + 1 + size])
        offset += size + 1
        for x in range(size):
            left = row[x - channels] if x >= channels else 0
            above = previous[x]
            corner = previous[x - channels] if x >= channels else 0
            estimate = left + above - corner
            distances = [abs(estimate - value) for value in (left, above, corner)]
            paeth = (left, above, corner)[distances.index(min(distances))]
            predictor = (0, left, above, (left + above) // 2, paeth)[filtering]
            row[x] = (row[x] + predictor) & 255
        rows.append(row)
        previous = row
    return width, height, channels, rows

measurements = []
for name in ['readers-loading-fixed.png'] + [f'readers-fixed-{i}.png' for i in range(4)]:
    width, height, channels, rows = read_png(root / 'instrumentation' / name)
    def pixel(x, y):
        return tuple(rows[y][x * channels:x * channels + 3])
    background = (48, 49, 56)
    sheet_top = next(y for y in range(600, height) if pixel(width // 2, y) == background)
    header = b''.join(bytes(row[24 * channels:700 * channels]) for row in rows[1010:1100])
    avatar_colour = (57, 58, 66) if name == 'readers-loading-fixed.png' else (194, 175, 159)
    runs, start = [], None
    for y in range(1100, 1510):
        matches = pixel(50, y) == avatar_colour
        if matches and start is None:
            start = y
        if not matches and start is not None:
            if y - start >= 20:
                runs.append({'top': start, 'bottom': y - 1, 'center': (start + y - 1) / 2})
            start = None
    centres = [run['center'] for run in runs]
    measurements.append({'file': name, 'size': [width, height], 'sheetTopPx': sheet_top,
                         'headerCropSha256': hashlib.sha256(header).hexdigest(),
                         'avatarRunsAtX50': runs, 'centersPx': centres,
                         'centerPitchDpAtDensity2': [(b - a) / 2 for a, b in zip(centres, centres[1:])]})

loading, ready = measurements[0], measurements[-1]
result = {'method': 'Decode actual PNG bytes, sample avatar vertical runs at x50; compare sheet top at x360 and identical header crop x24..699/y1010..1099. No app assertions used for these measurements.',
          'measurements': measurements,
          'loadingReadyCenterDeltasPx': [b - a for a, b in zip(loading['centersPx'], ready['centersPx'])],
          'allSheetTopsSame': len({m['sheetTopPx'] for m in measurements}) == 1,
          'allHeaderPixelsSame': len({m['headerCropSha256'] for m in measurements}) == 1}
assert len(loading['centersPx']) == len(ready['centersPx']) == 3
assert result['loadingReadyCenterDeltasPx'] == [0, 0, 0]
assert ready['centerPitchDpAtDensity2'] == [67, 67]
assert result['allSheetTopsSame'] and result['allHeaderPixelsSame']
(root / 'reader-geometry.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
