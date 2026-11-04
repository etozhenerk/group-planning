import { useEffect, useRef, useState } from "react";

export const useStickyActions = () => {
  const scroll = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLFormElement>(null);
  const [sticky, setSticky] = useState(false);
  useEffect(() => {
    const measure = () => {
      if (scroll.current && content.current) {
        setSticky(
          content.current.scrollHeight > scroll.current.clientHeight + 1,
        );
      }
    };
    const observer = new ResizeObserver(measure);
    if (scroll.current) {
      observer.observe(scroll.current);
    }
    if (content.current) {
      observer.observe(content.current);
    }
    measure();
    return () => observer.disconnect();
  }, []);
  return { scroll, content, sticky };
};
