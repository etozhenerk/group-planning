import { useLayoutEffect, useRef, useState } from 'react';

export const useFeedbackLayout = () => {
  const root = useRef<HTMLFormElement>(null),
    content = useRef<HTMLDivElement>(null),
    footer = useRef<HTMLDivElement>(null);

  const [pinned, setPinned] = useState(false);
  useLayoutEffect(() => {
    const measure = () => {
      if (root.current && content.current && footer.current) {
        setPinned(
          content.current.offsetHeight + footer.current.offsetHeight >
            root.current.clientHeight,
        );
      }
    };

    const observer = new ResizeObserver(measure);
    [root.current, content.current, footer.current].forEach((el) => {
      if (el) {
        observer.observe(el);
      }
    });
    measure();

    return () => observer.disconnect();
  }, []);

  return { root, content, footer, pinned };
};
