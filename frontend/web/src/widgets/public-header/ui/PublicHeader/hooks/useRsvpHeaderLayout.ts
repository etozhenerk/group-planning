import { useMediaQuery } from '@/shared/lib/media';
import { designTokens } from '@/shared/config/design-tokens';

export const useRsvpHeaderLayout = () => {
  const narrow = useMediaQuery(
    `(width <= ${designTokens.componentRsvpResultHeaderNarrowBreakpoint})`,
  );

  const medium = useMediaQuery(
    `(width <= ${designTokens.componentRsvpResultHeaderMediumBreakpoint})`,
  );

  const short = useMediaQuery(
    `(height <= ${designTokens.componentRsvpResultHeaderCompactHeight})`,
  );

  return narrow
    ? 'narrow'
    : medium
      ? short
        ? 'medium-short'
        : 'medium'
      : short
        ? 'short'
        : 'wide';
};
