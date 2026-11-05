// Generated from design-system/tokens.json · 7.9.0. Do not edit.
import { foundationTokens } from '@/shared/config/design-tokens/foundations';
import { componentTokens } from '@/shared/config/design-tokens/components';
import { chatComponentTokens } from '@/shared/config/design-tokens/chat-components';
import { mobileComponentTokens } from '@/shared/config/design-tokens/mobile-components';
import { conversationTokens } from '@/shared/config/design-tokens/conversation-components';

export const designTokens = {
  ...foundationTokens,
  ...componentTokens,
  ...chatComponentTokens,
  ...mobileComponentTokens,
  ...conversationTokens,
} as const;
