// Generated from design-system/tokens.json · 7.15.0. Do not edit.
import { foundationTokens } from '@/shared/config/design-tokens/foundations';
import { componentTokens } from '@/shared/config/design-tokens/components';
import { chatComponentTokens } from '@/shared/config/design-tokens/chat-components';
import { mobileComponentTokens } from '@/shared/config/design-tokens/mobile-components';
import { conversationTokens } from '@/shared/config/design-tokens/conversation-components';
import { galleryTokens } from '@/shared/config/design-tokens/gallery-components';
import { serviceTokens } from '@/shared/config/design-tokens/service-components';
import { onboardingTokens } from '@/shared/config/design-tokens/onboarding-components';

export const designTokens = {
  ...foundationTokens,
  ...componentTokens,
  ...chatComponentTokens,
  ...mobileComponentTokens,
  ...conversationTokens,
  ...galleryTokens,
  ...serviceTokens,
  ...onboardingTokens,
} as const;
