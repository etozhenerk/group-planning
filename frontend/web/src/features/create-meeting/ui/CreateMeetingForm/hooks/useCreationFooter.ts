import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useVisualViewport } from '@/shared/lib/viewport';

export const useCreationFooter = (
  form: RefObject<HTMLFormElement | null>,
  mobile: boolean,
) => {
  const footer = useRef<HTMLDivElement>(null);
  useVisualViewport(form, mobile);

  useLayoutEffect(() => {
    const node = form.current;
    const panel = footer.current;

    if (!mobile || !node || !panel) {
      return;
    }

    const measure = () =>
      node.style.setProperty(
        '--create-footer-height',
        `${panel.getBoundingClientRect().height}px`,
      );

    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    measure();

    return () => {
      observer.disconnect();
      node.style.removeProperty('--create-footer-height');
    };
  }, [form, mobile]);

  return footer;
};
