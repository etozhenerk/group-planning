import { useContext, useLayoutEffect, useRef } from 'react';
import { navigationMotion } from '@/widgets/navigation/model/motionContext';
import { designTokens } from '@/shared/config/design-tokens';

export const useNavigationMotion = (section: number, visible: boolean) => {
  const position = useContext(navigationMotion);
  const indicator = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (!visible || !position) {
      return;
    }

    const previous = position.current;
    position.current = section;

    if (
      previous === null ||
      previous === section ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const animation = indicator.current?.animate(
      [
        { transform: `translateX(${previous * 100}%)` },
        { transform: `translateX(${section * 100}%)` },
      ],
      {
        duration: Number.parseFloat(designTokens.motionDurationNavigation),
        easing: designTokens.motionEasingStandard,
      },
    );

    return () => animation?.cancel();
  }, [position, section, visible]);

  return indicator;
};
