import { useLayoutEffect, useRef, useState } from 'react';
import { designTokens } from '@/shared/config/design-tokens';

export const useOnboardingHeader = () => {
  const ref = useRef<HTMLElement>(null);
  const [stacked, setStacked] = useState(false);

  useLayoutEffect(() => {
    const header = ref.current;
    const brand = header?.querySelector('a');
    const skip = header?.querySelector('button');

    if (!header || !brand || !skip) {
      return;
    }

    const update = () => {
      const needed =
        brand.offsetWidth +
        skip.offsetWidth +
        Number.parseFloat(designTokens.spaceS12) +
        Number.parseFloat(designTokens.spaceS24) * 2;

      setStacked(needed > header.clientWidth);
    };

    const observer = new ResizeObserver(update);
    observer.observe(header);
    observer.observe(brand);
    observer.observe(skip);
    update();

    return () => observer.disconnect();
  }, []);

  return { ref, stacked };
};
