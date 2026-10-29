import { expect, test } from '@playwright/test';
import { apiCreate, login, writeHeaders } from '@tests/helpers';
import type { Locator } from '@playwright/test';
import { trustedTouchGesture } from '@tests/helpers/trustedTouchGesture';
import { z } from 'zod';

test.use({ hasTouch: true, isMobile: true, viewport: { width: 402, height: 874 } });

test('trusted touch can swipe the photo button in both directions and cycle the album', async ({
  page,
}) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Фото под пальцем');
  const changed = await page.request.patch(`/api/v1/meetings/${meeting.id}`, {
    headers: await writeHeaders(page),
    data: {
      expected_revision: meeting.revision,
      starts_at: null,
      starts_on: '2026-10-01',
      timezone: 'UTC',
    },
  });

  expect(changed.ok()).toBe(true);
  await page.goto(`/meetings/${meeting.id}/memories?action=upload`);
  const dialog = page.getByRole('dialog', { name: 'Добавить фото в альбом' });
  const photos = await page.evaluate(() =>
    ['#aa7766', '#669977', '#7766aa'].map((color) => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas unavailable');
      }

      context.fillStyle = color;
      context.fillRect(0, 0, canvas.width, canvas.height);

      return canvas.toDataURL('image/png').split(',')[1] ?? '';
    }),
  );

  await dialog.getByLabel('Выбрать фото', { exact: true }).setInputFiles(
    photos.map((data, index) => ({
      name: `${index}.png`,
      mimeType: 'image/png',
      buffer: Buffer.from(data, 'base64'),
    })),
  );
  await dialog.getByRole('button', { name: 'Добавить в альбом' }).click();
  await expect(dialog).not.toBeVisible();
  const stack = page.getByRole('group', {
    name: 'Фото встречи. Листайте клавишами влево и вправо',
  });

  await expect(stack.locator('img')).toHaveCount(3);
  const touch = await page.context().newCDPSession(page);
  await page.evaluate(() => {
    const gestures: {
      type: string;
      pointer: string;
      trusted: boolean;
      target: string;
      pointerId: number;
      x: number;
      y: number;
      time: number;
      action: string | null | undefined;
    }[] = [];

    for (const type of [
      'pointerdown',
      'pointermove',
      'pointerup',
      'pointercancel',
      'gotpointercapture',
      'lostpointercapture',
      'click',
    ]) {
      document.addEventListener(
        type,
        (event) => {
          if (event instanceof PointerEvent) {
            gestures.push({
              type,
              pointer: event.pointerType,
              trusted: event.isTrusted,
              target: event.target instanceof Element ? event.target.tagName : '',
              pointerId: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              time: performance.now(),
              action:
                event.target instanceof Element
                  ? event.target.closest('button')?.getAttribute('aria-label')
                  : null,
            });
            document.documentElement.setAttribute(
              'data-touch-events',
              JSON.stringify(gestures),
            );
          }
        },
        true,
      );
    }
  });
  const gesture = (target: Locator, dx: number, dy = 0) =>
    trustedTouchGesture(
      page,
      touch,
      target,
      dx,
      dy,
      test.info().project.metadata['touchGesture'] === 'browser',
    );

  const swipe = async (dx: number, dy = 0) => {
    await expect(stack).toHaveAttribute('data-moving', 'false');
    await gesture(stack.getByRole('button', { name: /^Открыть фото/ }), dx, dy);
  };

  try {
    await swipe(-120);
    await expect(page.getByText('2 / 3', { exact: true })).toBeVisible();
    await swipe(120);
    await expect(page.getByText('3 / 3', { exact: true })).toBeVisible();
    await swipe(-120);
    await expect(page.getByText('1 / 3', { exact: true })).toBeVisible();
    await swipe(24);
    await swipe(0, -100);
    await expect(page.getByText('1 / 3', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('dialog', { name: 'Фото встречи', exact: true }),
    ).not.toBeVisible();
    const events = z
      .array(
        z.object({
          type: z.string(),
          pointer: z.string(),
          trusted: z.boolean(),
          target: z.string(),
        }),
      )
      .parse(
        JSON.parse(
          (await page.locator('html').getAttribute('data-touch-events')) ?? '[]',
        ),
      );

    expect(
      events.some(
        (event) => event.type === 'lostpointercapture' && event.target === 'BUTTON',
      ),
    ).toBe(true);
    expect(events.every((event) => event.pointer === 'touch' && event.trusted)).toBe(
      true,
    );
    const photo = stack.getByRole('button', { name: 'Открыть фото 1', exact: true });
    await photo.tap();
    const viewer = page.getByRole('dialog', { name: 'Фото встречи', exact: true });
    await expect(viewer).toBeVisible();
    const close = viewer.getByRole('button', { name: 'Закрыть просмотр', exact: true });
    await expect(close).toBeFocused();
    await expect(close).toHaveCSS('outline-style', 'none');
    await gesture(viewer.locator('img'), -120);
    await expect(viewer.getByText(/2 \/ 3$/)).toBeVisible();
    await gesture(viewer.locator('img'), 120);
    await expect(viewer.getByText(/1 \/ 3$/)).toBeVisible();
    await close.tap();
    await expect(viewer).not.toBeVisible();
    const focus = await stack.evaluate((element) => {
      const active = document.activeElement;

      return {
        restored: active === element || element.contains(active),
        outline: active ? getComputedStyle(active).outlineStyle : null,
      };
    });

    expect(focus.restored).toBe(true);
    expect(focus.outline).toBe('none');
    await expect(stack).toBeFocused();
    await expect(stack).toHaveCSS('outline-style', 'none');
    await expect(photo).toHaveCSS('outline-style', 'none');
  } finally {
    await test.info().attach('trusted-touch-events', {
      body: (await page.locator('html').getAttribute('data-touch-events')) ?? '[]',
      contentType: 'application/json',
    });
    await touch.detach();
  }
});
