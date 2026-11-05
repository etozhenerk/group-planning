import { describe, expect, it } from 'vitest';
import postcss from 'postcss';
import { designMediaPlugin } from '#design-media';
import { foundationTokens } from '#design-foundations';
import { galleryTokens } from '#design-gallery';

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

  it('resolves the published narrow breakpoint for compact form controls', async () => {
    const result = await postcss([designMediaPlugin()]).process(
      '@media (width < design-token(breakpoint.chatNarrowWidth)) {.date {gap: 4px}}',
      { from: undefined },
    );

    expect(result.css).toContain(
      `@media (width < ${foundationTokens.breakpointChatNarrowWidth})`,
    );
    expect(result.css).not.toContain('design-token(');
  });

  it('resolves the published gallery height without a CSS literal', async () => {
    const result = await postcss([designMediaPlugin()]).process(
      '@media (max-height: design-token(component.mobileVibe.compactHeightBoundary)) {.deck {flex: none}}',
      { from: undefined },
    );

    expect(result.css).toContain(
      `@media (max-height: ${galleryTokens.componentMobileVibeCompactHeightBoundary})`,
    );
    expect(result.css).not.toContain('design-token(');
  });
});
