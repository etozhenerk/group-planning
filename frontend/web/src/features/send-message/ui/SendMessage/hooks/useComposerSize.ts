import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';

const resize = (field: HTMLTextAreaElement) => {
  field.style.height = 'auto';
  field.style.height = `${field.scrollHeight + field.offsetHeight - field.clientHeight}px`;
};

export const useComposerSize = (
  input: RefObject<HTMLTextAreaElement | null>,
  text: string,
) => {
  useLayoutEffect(() => {
    if (input.current) {
      resize(input.current);
    }
  }, [input, text]);

  useLayoutEffect(() => {
    const field = input.current;

    if (!field) {
      return;
    }

    let width = field.getBoundingClientRect().width;
    let frame: number | undefined;
    const observer = new ResizeObserver(() => {
      const nextWidth = field.getBoundingClientRect().width;

      if (nextWidth !== width) {
        width = nextWidth;

        if (frame !== undefined) {
          cancelAnimationFrame(frame);
        }

        frame = requestAnimationFrame(() => {
          frame = undefined;
          resize(field);
        });
      }
    });

    observer.observe(field);

    return () => {
      observer.disconnect();

      if (frame !== undefined) {
        cancelAnimationFrame(frame);
      }
    };
  }, [input]);
};
