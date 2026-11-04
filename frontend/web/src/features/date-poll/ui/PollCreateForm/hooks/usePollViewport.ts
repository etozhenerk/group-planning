import { useEffect } from 'react';
import { useFormViewport } from '@/shared/lib/form';

export const usePollViewport = (attempt: number) => {
  const scroll = useFormViewport();
  const { content } = scroll;

  useEffect(() => {
    if (attempt === 0) {
      return;
    }

    const invalid = content.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    invalid?.focus({ preventScroll: true });
    invalid?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, [attempt, content]);

  return scroll;
};
