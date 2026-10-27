import type { Locator, Page } from '@playwright/test';

export const controlSurfaceMotion = (page: Page, selector: string) =>
  page.addInitScript((surfaceSelector) => {
    const observer = new MutationObserver(() => {
      document.querySelectorAll(surfaceSelector).forEach((panel) => {
        panel.getAnimations().forEach((animation) => animation.pause());
      });
    });

    observer.observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-motion'],
    });
  }, selector);

export const sampleSurfaceMotion = (panel: Locator, time?: number) =>
  panel.evaluate(async (element, currentTime) => {
    const animation = element.getAnimations()[0];

    if (animation && currentTime !== undefined) {
      animation.currentTime = currentTime;
    }

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const style = getComputedStyle(element);
    const matrix = new DOMMatrixReadOnly(
      style.transform === 'none' ? undefined : style.transform,
    );

    return {
      height: element.getBoundingClientRect().height,
      top: element.getBoundingClientRect().top,
      composerBottom: element.parentElement
        ?.querySelector('textarea')
        ?.getBoundingClientRect().bottom,
      opacity: Number(style.opacity),
      offsetY: matrix.m42,
      scaleX: matrix.a,
      scaleY: matrix.d,
      motion: element.getAttribute('data-motion'),
      inline: element.getAttribute('style'),
      animationState: animation?.playState,
      duration: animation?.effect?.getTiming().duration,
      keyframes:
        animation?.effect instanceof KeyframeEffect
          ? animation.effect.getKeyframes()
          : [],
    };
  }, time);

export const finishSurfaceMotion = (panel: Locator) =>
  panel.evaluate((element) =>
    element.getAnimations().forEach((animation) => animation.finish()),
  );
