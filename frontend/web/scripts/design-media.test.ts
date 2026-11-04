import { describe, expect, it } from 'vitest';
import postcss from 'postcss';
import { designMediaPlugin } from '#design-media';
import { foundationTokens } from '#design-foundations';

describe('published media breakpoint', () => {
  it('resolves the design token at build time because CSS variables do not work in media conditions', async () => {
    const result = await postcss([designMediaPlugin()]).process(
      '@media (width < design-token(breakpoint.mobile)) {.workspace {display: grid}}',
      { from: undefined },
    );

    expect(result.css).toContain(`@media (width < ${foundationTokens.breakpointMobile})`);
    expect(result.css).not.toContain('design-token(');
  });

  it('rejects an unpublished media role', async () => {
    await expect(
      postcss([designMediaPlugin()]).process(
        '@media (width < design-token(breakpoint.unknown)) {}',
        { from: undefined },
      ),
    ).rejects.toThrow('Unknown media design token');
  });
});
