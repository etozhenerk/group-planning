import { designTokens } from '@/shared/config/design-tokens';
import { useMediaQuery } from '@/shared/lib/media/useMediaQuery';
import { useMobileLayout } from '@/shared/lib/media/useMobileLayout';

export const useChatLayout = () => ({
  mobile: useMobileLayout(),
  compact: useMediaQuery(`(height <= ${designTokens.breakpointChatCompactHeight})`),
  narrow: useMediaQuery(`(width <= ${designTokens.breakpointChatNarrowWidth})`),
});
