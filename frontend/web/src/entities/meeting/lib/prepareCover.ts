import { preparedCoverSchema } from '@/entities/meeting/model/cover';
import type { PreparedCover } from '@/entities/meeting/model/cover';

export const prepareCover = (file: File, signal: AbortSignal): Promise<PreparedCover> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('@/entities/meeting/lib/prepareCover.worker.ts', import.meta.url),
      { type: 'module' },
    );

    const abort = () => {
      worker.terminate();
      reject(new DOMException('Cancelled', 'AbortError'));
    };

    const done = () => {
      worker.terminate();
      signal.removeEventListener('abort', abort);
    };

    if (signal.aborted) {
      abort();

      return;
    }

    signal.addEventListener('abort', abort, { once: true });
    worker.onmessage = (event: MessageEvent<unknown>) => {
      done();
      const response = event.data;

      if (response && typeof response === 'object' && 'cover' in response) {
        const parsed = preparedCoverSchema.safeParse(response.cover);

        if (parsed.success) {
          resolve(parsed.data);

          return;
        }
      }

      reject(
        new Error(
          response &&
            typeof response === 'object' &&
            'error' in response &&
            typeof response.error === 'string'
            ? response.error
            : 'Не удалось открыть фото. Выберите другое.',
        ),
      );
    };

    worker.onerror = () => {
      done();
      reject(new Error('Не удалось открыть фото. Выберите другое.'));
    };

    worker.postMessage(file);
  });
