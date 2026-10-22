import { useCallback, useEffect, useRef, useState } from 'react';

export const usePollViewport = (attempt: number) => {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);
  const update = useCallback(() => {
    const node = viewport.current;

    if (node) {
      setHasMore(node.scrollHeight - node.clientHeight - node.scrollTop > 1);
    }
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(update);

    if (viewport.current) {
      observer.observe(viewport.current);
    }

    if (content.current) {
      observer.observe(content.current);
    }

    update();

    return () => observer.disconnect();
  }, [update]);

  useEffect(() => {
    if (attempt === 0) {
      return;
    }

    const invalid = content.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    invalid?.focus({ preventScroll: true });
    invalid?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, [attempt]);

  return { viewport, content, hasMore, update };
};
