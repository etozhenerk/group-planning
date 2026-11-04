import { useLayoutEffect, useRef } from 'react';

export const usePeriodIndicator = (period: string, count: number | undefined) => {
  const tabs = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const nav = tabs.current;

    if (!nav) {
      return;
    }

    let frame = 0;
    const measure = () => {
      const active = nav.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');

      if (active) {
        nav.style.setProperty('--period-left', `${active.offsetLeft}px`);
        nav.style.setProperty('--period-width', `${active.offsetWidth}px`);
      }
    };

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });

    observer.observe(nav);
    nav.querySelectorAll('button').forEach((button) => observer.observe(button));
    measure();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [period, count]);

  return tabs;
};
