import { describe, expect, it } from 'vitest';
import { validateFile } from '@/features/upload-media/lib/validateFile';

const limits = {
  max_photo_bytes: 10,
  max_file_bytes: 20,
  max_files: 10,
  photo_types: ['image/png'],
  file_types: ['text/plain', 'image/png'],
};

describe('media selection validation', () => {
  it('respects server-provided limits before reserve/upload and rejects empty files', () => {
    expect(
      validateFile(
        new File(['0123456789'], 'photo.png', { type: 'image/png' }),
        limits,
        true,
      ),
    ).toBe('');
    expect(
      validateFile(
        new File(['01234567890'], 'photo.png', { type: 'image/png' }),
        limits,
        true,
      ),
    ).not.toBe('');
    expect(
      validateFile(new File([], 'empty.png', { type: 'image/png' }), limits, true),
    ).toBe('Файл пустой.');
  });
  it('distinguishes photo and file formats', () => {
    const file = new File(['hello'], 'note.txt', { type: 'text/plain' });
    expect(validateFile(file, limits, false)).toBe('');
    expect(validateFile(file, limits, true)).toBe('Этот формат не поддерживается.');
  });
});
