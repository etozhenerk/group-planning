import { expect, it } from 'vitest';
import { safeCoverURL } from '@/entities/meeting/lib/coverURL';
import {
  checkImageBounds,
  imageDimensions,
} from '@/entities/meeting/lib/imageDimensions';

it('allows only this API origin, meeting and version without redirect credentials', () => {
  const origin = 'https://somewhere.example';
  const path = `/api/v1/meetings/meeting-a/cover?v=${'a'.repeat(64)}`;
  expect(safeCoverURL(origin + path, origin, 'meeting-a')).toBe(origin + path);

  for (const url of [
    'https://other.example' + path,
    'https://user:password@somewhere.example' + path,
    origin + path + '&extra=1',
    origin + path + '#fragment',
    origin + '/api/v1/me',
    origin + path.replace('meeting-a', 'meeting-b'),
  ]) {
    expect(safeCoverURL(url, origin, 'meeting-a')).toBeNull();
  }

  const publicURL = `${origin}/api/v1/invitations/${'x'.repeat(22)}/cover?v=${'a'.repeat(64)}`;
  expect(safeCoverURL(publicURL, origin, 'meeting-a')).toBe(publicURL);
});

it('rejects compressed image bombs before browser pixel decoding', () => {
  expect(() => checkImageBounds(8000, 8000)).not.toThrow();
  expect(() => checkImageBounds(8001, 8000)).toThrow('слишком большое');
  expect(() => checkImageBounds(0, 1)).toThrow();
  expect(() => checkImageBounds(32769, 1)).toThrow();
  expect(() => imageDimensions(new ArrayBuffer(3), 'image/png')).toThrow();
  const header = new DataView(new ArrayBuffer(33));
  header.setUint32(0, 0x89504e47);
  header.setUint32(4, 0x0d0a1a0a);
  header.setUint32(8, 13);
  header.setUint32(16, 80_000);
  header.setUint32(20, 80_000);
  const dimensions = imageDimensions(header.buffer, 'image/png');
  expect(() => checkImageBounds(dimensions.width, dimensions.height)).toThrow();
});
