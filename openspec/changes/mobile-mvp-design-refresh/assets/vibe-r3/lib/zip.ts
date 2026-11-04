import type { Photo } from "@preview/data";
const crc32 = (bytes: Uint8Array) => {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ -1) >>> 0;
};
export const makeAlbumZip = async (photos: Photo[], signal: AbortSignal) => {
  const local: Uint8Array[] = [],
    central: Uint8Array[] = [];
  let offset = 0;
  for (const [index, photo] of photos.entries()) {
    const response = await fetch(photo.src, { signal });
    if (!response.ok) throw new Error("photo");
    const bytes = new Uint8Array(await response.arrayBuffer()),
      name = new TextEncoder().encode(
        "photo-" +
          String(index + 1).padStart(2, "0") +
          (photo.type === "image/png" ? ".png" : ".jpg"),
      ),
      crc = crc32(bytes);
    const header = new Uint8Array(30),
      h = new DataView(header.buffer);
    h.setUint32(0, 0x04034b50, true);
    h.setUint16(4, 20, true);
    h.setUint32(14, crc, true);
    h.setUint32(18, bytes.length, true);
    h.setUint32(22, bytes.length, true);
    h.setUint16(26, name.length, true);
    local.push(header, name, bytes);
    const record = new Uint8Array(46),
      r = new DataView(record.buffer);
    r.setUint32(0, 0x02014b50, true);
    r.setUint16(4, 20, true);
    r.setUint16(6, 20, true);
    r.setUint32(16, crc, true);
    r.setUint32(20, bytes.length, true);
    r.setUint32(24, bytes.length, true);
    r.setUint16(28, name.length, true);
    r.setUint32(42, offset, true);
    central.push(record, name);
    offset += header.length + name.length + bytes.length;
  }
  const length = central.reduce((sum, part) => sum + part.length, 0),
    end = new Uint8Array(22),
    e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, photos.length, true);
  e.setUint16(10, photos.length, true);
  e.setUint32(12, length, true);
  e.setUint32(16, offset, true);
  return new Blob([...local, ...central, end], { type: "application/zip" });
};
