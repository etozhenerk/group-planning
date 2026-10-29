import type { CDPSession, Locator, Page } from '@playwright/test';

export const trustedTouchGesture = async (
  page: Page,
  touch: CDPSession,
  target: Locator,
  dx: number,
  dy: number,
  browserDriver: boolean,
) => {
  const box = await target.boundingBox();

  if (!box) {
    throw new Error('Missing gesture target');
  }

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  if (browserDriver) {
    await touch.send('Input.synthesizeScrollGesture', {
      x,
      y,
      xDistance: dx,
      yDistance: dy,
      gestureSourceType: 'touch',
      preventFling: true,
    });

    return;
  }

  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y }],
  });

  for (let step = 1; step <= 8; step++) {
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + (dx * step) / 8, y: y + (dy * step) / 8 }],
    });
    await page.waitForTimeout(16);
  }

  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
