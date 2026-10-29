// Generated from design-system/tokens.json · 5.0.0. Do not edit.
import { foundationTokens } from '@/shared/config/design-tokens/foundations';
import { componentTokens } from '@/shared/config/design-tokens/components';
import { chatComponentTokens } from '@/shared/config/design-tokens/chat-components';

export const designTokens = {
  ...foundationTokens,
  ...componentTokens,
  ...chatComponentTokens,
} as const;
