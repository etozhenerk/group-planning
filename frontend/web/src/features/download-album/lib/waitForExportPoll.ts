export const waitForExportPoll = (signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      reject(new DOMException('Canceled', 'AbortError'));
    };

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, 1_000);

    signal.addEventListener('abort', abort, { once: true });

    if (signal.aborted) {
      abort();
    }
  });
