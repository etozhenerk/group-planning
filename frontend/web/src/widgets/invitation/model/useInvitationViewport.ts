import { useLayoutEffect, useRef } from 'react';

export const useInvitationViewport = () => {
  const screen = useRef<HTMLDivElement>(null);
  const footer = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const update = () => {
      const node = screen.current;

      if (!node) {
        return;
      }

      node.style.setProperty(
        '--invitation-page-top',
        `${Math.max(0, node.getBoundingClientRect().top + window.scrollY)}px`,
      );
      node.style.setProperty(
        '--invitation-footer-height',
        `${footer.current?.getBoundingClientRect().height ?? 0}px`,
      );
    };

    const observer = new ResizeObserver(update);

    if (screen.current) {
      observer.observe(screen.current);
    }

    if (footer.current) {
      observer.observe(footer.current);
    }

    update();
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return { screen, footer };
};
