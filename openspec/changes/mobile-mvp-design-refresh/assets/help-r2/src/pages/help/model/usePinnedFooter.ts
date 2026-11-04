import { useLayoutEffect, useRef, useState } from "react";
export const usePinnedFooter = () => {
  const content = useRef<HTMLDivElement>(null),
    footer = useRef<HTMLDivElement>(null),
    [pinned, setPinned] = useState(false);
  useLayoutEffect(() => {
    const measure = () => {
      if (content.current && footer.current)
        setPinned(
          content.current.offsetHeight + footer.current.offsetHeight >
            (window.visualViewport?.height ?? innerHeight),
        );
    };
    const observer = new ResizeObserver(measure);
    if (content.current) observer.observe(content.current);
    if (footer.current) observer.observe(footer.current);
    window.visualViewport?.addEventListener("resize", measure);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);
  return { content, footer, pinned };
};
