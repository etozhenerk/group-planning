import { designTokens } from '@/shared/config/design-tokens';
import { useMediaQuery } from '@/shared/lib/media/useMediaQuery';

export const useMobileLayout = () =>
  useMediaQuery(
    `(width < ${designTokens.breakpointMobile}), (pointer: coarse) and (height <= ${designTokens.breakpointChatCompactHeight})`,
  );
