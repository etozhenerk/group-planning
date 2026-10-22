import { useEffect, useRef, useState } from 'react';

export const useStickyControls = () => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const controls = controlsRef.current;

    if (!sentinel || !controls) {
      return;
    }

    let observer: IntersectionObserver;
    const observe = () => {
      observer?.disconnect();
      const top = Number.parseFloat(getComputedStyle(controls).top) || 0;
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry) {
            setPinned(!entry.isIntersecting && entry.boundingClientRect.top <= top);
          }
        },
        { rootMargin: `-${top}px 0px 0px 0px`, threshold: 1 },
      );
      observer.observe(sentinel);
    };

    observe();
    window.addEventListener('resize', observe);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', observe);
    };
  }, []);

  return { sentinelRef, controlsRef, pinned };
};
