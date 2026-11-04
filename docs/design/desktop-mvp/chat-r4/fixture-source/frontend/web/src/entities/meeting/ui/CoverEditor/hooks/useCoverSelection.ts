import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { prepareCover } from '@/entities/meeting/lib/prepareCover';
import type { PreparedCover } from '@/entities/meeting/model/cover';

export const useCoverSelection = (
  onChange: (cover: PreparedCover | null) => void,
  onBusy: (busy: boolean) => void,
) => {
  const controller = useRef<AbortController | null>(null);
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => () => controller.current?.abort(), []);

  return {
    problem,
    busy,
    choose: async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';

      if (!file) {
        return;
      }

      controller.current?.abort();
      const operation = new AbortController();
      controller.current = operation;
      setBusy(true);
      onBusy(true);
      setProblem('');

      try {
        const result = await prepareCover(file, operation.signal);

        if (!operation.signal.aborted) {
          onChange(result);
        }
      } catch (error) {
        if (!operation.signal.aborted) {
          setProblem(
            error instanceof Error
              ? error.message
              : 'Не удалось открыть фото. Выберите другое.',
          );
        }
      } finally {
        if (!operation.signal.aborted) {
          setBusy(false);
          onBusy(false);
        }
      }
    },
    remove: () => {
      setProblem('');
      onChange(null);
    },
  };
};
