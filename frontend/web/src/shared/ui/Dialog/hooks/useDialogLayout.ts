import { designTokens } from '@/shared/config/design-tokens';
import { useMobileLayout, useMediaQuery } from '@/shared/lib/media';

export const useDialogLayout = (desktopPage: boolean) => {
  const mobile = useMobileLayout();
  const tablet = useMediaQuery(`(width <= ${designTokens.breakpointTablet})`);

  const compact = useMediaQuery(
    `(max-height: ${designTokens.breakpointChatCompactHeight})`,
  );

  return {
    mobile,
    compact,
    inline: desktopPage && !mobile,
    tablet: desktopPage && !mobile && tablet,
  };
};
