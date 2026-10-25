import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';

export const useVisualViewport = (ref: RefObject<HTMLElement | null>, active = true) => {
  useLayoutEffect(() => {
    const node = ref.current;
    const viewport = window.visualViewport;

    if (!active || !node || !viewport) {
      return;
    }

    const update = () => {
      // Pinch zoom belongs to the browser; it must not resize the application.
      if (Math.abs(viewport.scale - 1) > 0.01) {
        return;
      }

      node.style.setProperty('--visual-viewport-height', `${viewport.height}px`);
      node.style.setProperty('--visual-viewport-top', `${viewport.offsetTop}px`);
      node.style.setProperty(
        '--visual-viewport-bottom',
        `${Math.max(0, innerHeight - viewport.height - viewport.offsetTop)}px`,
      );
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    window.addEventListener('resize', update);

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      node.style.removeProperty('--visual-viewport-height');
      node.style.removeProperty('--visual-viewport-top');
      node.style.removeProperty('--visual-viewport-bottom');
    };
  }, [ref, active]);
};
