import type { Plugin } from 'postcss';
import { foundationTokens } from '#design-foundations';

export const designMediaPlugin = (): Plugin => ({
  postcssPlugin: 'somewhere-design-media',
  AtRule: {
    media: (rule) => {
      rule.params = rule.params.replace(/design-token\(([^)]+)\)/g, (_, role: string) => {
        if (role !== 'breakpoint.mobile') {
          throw rule.error(`Unknown media design token: ${role}`);
        }

        return foundationTokens.breakpointMobile;
      });
    },
  },
});
