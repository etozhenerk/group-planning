// Generated from design-system/tokens.json · 7.13.0. Do not edit.
import { foundationTokens } from '@/shared/config/design-tokens/foundations';
import { componentTokens } from '@/shared/config/design-tokens/components';
import { chatComponentTokens } from '@/shared/config/design-tokens/chat-components';
import { mobileComponentTokens } from '@/shared/config/design-tokens/mobile-components';
import { conversationTokens } from '@/shared/config/design-tokens/conversation-components';
import { galleryTokens } from '@/shared/config/design-tokens/gallery-components';

export const designTokens = {
  ...foundationTokens,
  ...componentTokens,
  ...chatComponentTokens,
  ...mobileComponentTokens,
  ...conversationTokens,
  ...galleryTokens,
} as const;
