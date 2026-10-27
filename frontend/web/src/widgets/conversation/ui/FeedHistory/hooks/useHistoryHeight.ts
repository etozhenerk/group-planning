import { useLayoutEffect, useRef, useState } from 'react';

export const useHistoryHeight = (visible: boolean) => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;

    if (!visible || !element) {
      return;
    }

    const measure = () =>
      setHeight((previous) => Math.max(previous, element.getBoundingClientRect().height));

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, [visible]);

  return { ref, height };
};
