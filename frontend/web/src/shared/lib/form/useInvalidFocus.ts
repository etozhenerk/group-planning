import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';

export const useInvalidFocus = (
  form: RefObject<HTMLFormElement | null>,
  attempt: number,
) => {
  useLayoutEffect(() => {
    if (!attempt) {
      return;
    }

    const field = form.current?.querySelector<HTMLElement>(
      'input[aria-invalid="true"], button[aria-invalid="true"], textarea[aria-invalid="true"], select[aria-invalid="true"]',
    );

    field?.focus({ preventScroll: true });
    field?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, [attempt, form]);
};
