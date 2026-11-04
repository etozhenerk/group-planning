import { useCallback, useEffect, useRef, useState } from 'react';

export const useFormViewport = () => {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const update = useCallback(() => {
    const node = viewport.current;

    if (node) {
      setOverflow(node.scrollHeight - node.clientHeight > 1);
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

  return { viewport, content, overflow, hasMore, update };
};
