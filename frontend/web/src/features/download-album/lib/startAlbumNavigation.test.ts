import { afterEach, expect, it, vi } from 'vitest';
import { startAlbumNavigation } from '@/features/download-album/lib/startAlbumNavigation';

const meeting = '97ac7506-97ab-4192-a6e7-093f4b06ef4f';
afterEach(() => vi.unstubAllGlobals());

it('hands the same-origin ZIP to a native download link without fetching or creating an archive Blob', () => {
  const link = { href: '', download: '', hidden: false, click: vi.fn(), remove: vi.fn() };
  const body = { append: vi.fn() };
  const createElement = vi.fn().mockReturnValue(link);
  vi.stubGlobal('document', { body, createElement });
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  startAlbumNavigation(meeting, 'export-1');
  expect(link.href).toBe(
    `/api/v1/meetings/${meeting}/memories/exports/export-1/download`,
  );
  expect(link.download).toBe('somewhere-photos.zip');
  expect(link.click).toHaveBeenCalledOnce();
  expect(link.remove).toHaveBeenCalledOnce();
  expect(fetcher).not.toHaveBeenCalled();
});

it('cleans up the temporary link even when the browser refuses the hand-off', () => {
  const link = {
    href: '',
    download: '',
    hidden: false,
    click: vi.fn(() => {
      throw new Error('Blocked');
    }),
    remove: vi.fn(),
  };

  vi.stubGlobal('document', {
    body: { append: vi.fn() },
    createElement: vi.fn().mockReturnValue(link),
  });
  expect(() => startAlbumNavigation(meeting, 'export-1')).toThrow('Blocked');
  expect(link.remove).toHaveBeenCalledOnce();
});
