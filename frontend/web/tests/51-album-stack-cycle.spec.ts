import { test, expect } from '@playwright/test';
import { apiCreate, login, writeHeaders } from '@tests/helpers';

test('both stack swipe directions advance and the last photo reassembles without resizing', async ({
  page,
}) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Порядок фотостопки');
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

  const viewer = page.getByRole('dialog', { name: 'Фото встречи', exact: true });
  await expect(stack.locator('img')).toHaveCount(3);
  const swipe = async (direction: number) => {
    await expect(stack).toHaveAttribute('data-moving', 'false');
    const box = await stack.boundingBox();

    if (!box) {
      throw new Error('Missing stack');
    }

    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + direction * 140, y, { steps: 8 });
    await page.mouse.up();
  };

  await swipe(-1);
  await expect(page.getByText('2 / 3', { exact: true })).toBeVisible();
  await expect(viewer).not.toBeVisible();
  await swipe(1);
  await expect(page.getByText('3 / 3', { exact: true })).toBeVisible();
  await expect(viewer).not.toBeVisible();
  const recording = stack.evaluate(async (element) => {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        observer.disconnect();
        reject(new Error('Stack reset did not start'));
      }, 5000);

      const observer = new MutationObserver(() => {
        if (element.getAttribute('data-resetting') === 'true') {
          clearTimeout(timer);
          observer.disconnect();
          resolve();
        }
      });

      observer.observe(element, {
        attributes: true,
        attributeFilter: ['data-resetting'],
      });
    });
    const frames: { opacity: number; scale: number; width: number; height: number }[] =
      [];

    const front = element.querySelector<HTMLElement>('[data-front="true"]');

    if (!front) {
      throw new Error('Missing front card');
    }

    while (element.getAttribute('data-resetting') === 'true') {
      const style = getComputedStyle(front);
      const matrix = new DOMMatrixReadOnly(style.transform);
      frames.push({
        opacity: Number(style.opacity),
        scale: Math.hypot(matrix.a, matrix.b),
        width: front.offsetWidth,
        height: front.offsetHeight,
      });
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }

    return frames;
  });

  const [motion] = await Promise.all([recording, swipe(1)]);

  expect(motion.length).toBeGreaterThan(2);
  expect(motion.some((frame) => frame.opacity > 0 && frame.opacity < 1)).toBe(true);
  expect(motion.every((frame) => Math.abs(frame.scale - 1) < 0.001)).toBe(true);
  expect(new Set(motion.map((frame) => `${frame.width}:${frame.height}`)).size).toBe(1);
  await expect(page.getByText('1 / 3', { exact: true })).toBeVisible();
  await expect(viewer).not.toBeVisible();
  await stack.focus();
  await stack.press('ArrowLeft');
  await expect(page.getByText('3 / 3', { exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await swipe(1);
  await expect(page.getByText('1 / 3', { exact: true })).toBeVisible();
  await expect(stack).toHaveAttribute('data-resetting', 'false');
  await expect(stack).toHaveAttribute('data-moving', 'false');
});

test('a single photo separates every drag from a deliberate tap', async ({ page }) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Одно фото без случайного открытия');
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
  await dialog
    .getByLabel('Выбрать фото', { exact: true })
    .setInputFiles('public/share-card.png');
  await dialog.getByRole('button', { name: 'Добавить в альбом' }).click();
  await expect(dialog).not.toBeVisible();
  const stack = page.getByRole('group', {
    name: 'Фото встречи. Листайте клавишами влево и вправо',
  });

  const viewer = page.getByRole('dialog', { name: 'Фото встречи', exact: true });
  await expect(stack.locator('img')).toHaveCount(1);

  for (const [dx, dy] of [
    [130, 0],
    [-130, 0],
    [24, 0],
    [0, 40],
  ]) {
    const box = await stack.boundingBox();

    if (!box) {
      throw new Error('Missing stack');
    }

    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + (dx ?? 0), y + (dy ?? 0), { steps: 8 });
    await page.mouse.up();
    await expect(viewer).not.toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/meetings/${meeting.id}/memories$`));
    await expect(page.getByText('1 / 1', { exact: true })).toBeVisible();
    await expect(stack).toHaveAttribute('data-moving', 'false');
    await expect(stack).toHaveAttribute('data-resetting', 'false');
  }

  await stack.getByRole('button', { name: 'Открыть фото 1', exact: true }).click();
  await expect(viewer).toBeVisible();
});
