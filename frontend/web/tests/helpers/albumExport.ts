import { createHash, randomUUID } from 'node:crypto';
import { crc32 } from 'node:zlib';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { apiCreate, apiMeeting, writeHeaders } from '@tests/helpers';
import { mediaResultSchema } from '@/shared/api';

export const seedExportAlbum = async (
  page: Page,
  count = 3,
  beforePast?: (created: Awaited<ReturnType<typeof apiCreate>>) => Promise<void>,
) => {
  const created = await apiCreate(page, 'Альбом для скачивания');
  await beforePast?.(created);
  const id = created.meeting.id;
  const latest = beforePast ? await apiMeeting(page, id) : created.meeting;
  const headers = await writeHeaders(page);
  const changed = await page.request.patch(`/api/v1/meetings/${id}`, {
    headers,
    data: {
      expected_revision: latest.revision,
      starts_at: null,
      starts_on: '2026-10-01',
      timezone: 'UTC',
    },
  });

  expect(changed.ok()).toBe(true);
  const photos = await page.evaluate(
    (length) =>
      Array.from({ length }, (_, index) => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 48;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Canvas unavailable');
        }

        context.fillStyle = `rgb(${index},${255 - index},128)`;
        context.fillRect(0, 0, canvas.width, canvas.height);

        return canvas.toDataURL('image/png').split(',')[1] ?? '';
      }),
    count,
  );

  const hashes: string[] = [];

  for (const photo of photos) {
    const bytes = Buffer.from(photo, 'base64');
    const key = randomUUID();
    const reservation = await page.request.post(`/api/v1/meetings/${id}/media/uploads`, {
      headers: { ...headers, 'Idempotency-Key': key },
      data: {
        client_request_id: key,
        file_name: 'Фото.png',
        content_type: 'image/png',
        size_bytes: bytes.length,
        purpose: 'memory',
      },
    });

    expect(reservation.ok()).toBe(true);
    const { media } = mediaResultSchema.parse(await reservation.json());
    const path = `/api/v1/meetings/${id}/media/${media.id}`;
    const upload = await page.request.put(`${path}/content`, {
      headers: { ...headers, 'Content-Type': 'image/png' },
      data: bytes,
    });

    expect(upload.ok()).toBe(true);
    const published = await page.request.post(`${path}/publish`, {
      headers: { ...headers, 'Idempotency-Key': randomUUID() },
      data: {},
    });

    expect(published.ok()).toBe(true);
    const original = await page.request.get(`${path}/content`);
    expect(original.ok()).toBe(true);
    hashes.push(
      createHash('sha256')
        .update(await original.body())
        .digest('hex'),
    );
  }

  return { ...created, id, hashes };
};

// The server deliberately writes ZIP Store, avoiding a second compression of photos.
export const archivePhotos = (bytes: Buffer) => {
  const end = bytes.length - 22;
  expect(bytes.readUInt32LE(end)).toBe(0x06054b50);
  expect(bytes.readUInt16LE(end + 20)).toBe(0);
  const count = bytes.readUInt16LE(end + 10);
  let position = bytes.readUInt32LE(end + 16);
  const entries: { name: string; hash: string }[] = [];

  for (let index = 0; index < count; index++) {
    expect(bytes.readUInt32LE(position)).toBe(0x02014b50);
    expect(bytes.readUInt16LE(position + 10)).toBe(0);
    const size = bytes.readUInt32LE(position + 24);
    expect(bytes.readUInt32LE(position + 20)).toBe(size);
    const nameLength = bytes.readUInt16LE(position + 28);
    const extraLength = bytes.readUInt16LE(position + 30);
    const commentLength = bytes.readUInt16LE(position + 32);
    const name = bytes
      .subarray(position + 46, position + 46 + nameLength)
      .toString('utf8');

    expect(name).not.toMatch(/[/\\]|\.\./);
    const local = bytes.readUInt32LE(position + 42);
    expect(bytes.readUInt32LE(local)).toBe(0x04034b50);
    const start =
      local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);

    const data = bytes.subarray(start, start + size);
    expect(data.length).toBe(size);
    expect(crc32(data)).toBe(bytes.readUInt32LE(position + 16));
    entries.push({ name, hash: createHash('sha256').update(data).digest('hex') });
    position += 46 + nameLength + extraLength + commentLength;
  }

  expect(new Set(entries.map((entry) => entry.name)).size).toBe(count);

  return entries;
};
