import type { Plugin } from 'postcss';
import { foundationTokens } from '#design-foundations';
import { galleryTokens } from '#design-gallery';
import { onboardingTokens } from '#design-onboarding';

export const designMediaPlugin = (): Plugin => ({
  postcssPlugin: 'somewhere-design-media',
  AtRule: {
    media: (rule) => {
      rule.params = rule.params.replace(/design-token\(([^)]+)\)/g, (_, role: string) => {
        if (role === 'component.mobileVibe.compactHeightBoundary') {
          return galleryTokens.componentMobileVibeCompactHeightBoundary;
        }

        if (role === 'component.mobileOnboarding.narrowTitleBoundary') {
          return onboardingTokens.componentMobileOnboardingNarrowTitleBoundary;
        }

        if (role === 'breakpoint.chatNarrowWidth') {
          return foundationTokens.breakpointChatNarrowWidth;
        }

        if (role !== 'breakpoint.mobile') {
          throw rule.error(`Unknown media design token: ${role}`);
        }

        return foundationTokens.breakpointMobile;
      });
    },
  },
});
