import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';

const dragDown = async (
  page: Page,
  target: Locator,
  trustedTouch: boolean,
  distance = 150,
) => {
  const box = await target.boundingBox();

  if (!box) {
    throw new Error('Missing drag target');
  }

  const x = box.x + box.width / 2;
  const y = box.y + Math.min(16, box.height / 2);

  if (trustedTouch) {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y }],
    });

    for (const progress of [0.1, 0.25, 0.45, 0.75, 1]) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y: y + distance * progress }],
      });
    }

    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + distance, { steps: 12 });
    await page.mouse.up();
  }
};

test('mobile handle dismisses without refresh; body pull and busy guard preserve draft; confirmed save refreshes', async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Панель без обновления');
  await page.goto(`/meetings/${meeting.id}`);
  const composer = page.getByLabel('Сообщение', { exact: true });
  await composer.fill('Черновик под панелью');
  const open = async () => {
    await page.getByRole('button', { name: 'Добавить к встрече' }).click();
    await page.getByRole('menuitem', { name: 'Предложить место', exact: true }).click();
  };

  await open();
  const sheet = page.getByRole('dialog', { name: 'Предложить место', exact: true });
  await expect(sheet).toHaveAttribute('data-motion', 'open');
  const close = sheet.getByRole('button', { name: 'Закрыть', exact: true });
  await expect(close).toHaveAttribute('data-sheet-handle');
  await expect(close.locator('svg')).toHaveCount(0);
  const reads: string[] = [];
  const documents: string[] = [];
  page.on('request', (request) => {
    if (
      request.method() === 'GET' &&
      request.url().includes(`/api/v1/meetings/${meeting.id}`)
    ) {
      reads.push(request.url());
    }

    if (request.isNavigationRequest() && request.resourceType() === 'document') {
      documents.push(request.url());
    }
  });
  await page.evaluate(() => {
    document.addEventListener('pointerup', (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const dialog = event.target.closest('dialog');

      if (!dialog) {
        return;
      }

      requestAnimationFrame(() => {
        document.documentElement.dataset.dismissFrame = JSON.stringify({
          motion: dialog.dataset.motion,
          transform: dialog.style.transform,
          backdrop: dialog.style.getPropertyValue('--backdrop-opacity'),
        });
      });
    });
  });
  const url = page.url();
  await dragDown(page, sheet.getByTestId('dialog-content'), browserName === 'chromium');
  await expect(sheet).toBeVisible();
  expect(page.url()).toBe(url);
  expect(reads).toEqual([]);
  expect(documents).toEqual([]);
  const resting = await sheet.boundingBox();
  await dragDown(page, close, browserName === 'chromium', 10);
  await expect(sheet).toBeVisible();
  await expect.poll(async () => (await sheet.boundingBox())?.y).toBe(resting?.y);
  await dragDown(page, close, browserName === 'chromium');
  await expect(sheet).not.toBeVisible();
  const exit = await page.evaluate(
    () => document.documentElement.dataset.dismissFrame ?? '',
  );

  expect(exit).toContain('"motion":"closing"');
  expect(exit).toContain('translateY(150px)');
  expect(exit).not.toContain('"backdrop":""');
  expect(reads).toEqual([]);
  expect(documents).toEqual([]);
  await expect(composer).toHaveValue('Черновик под панелью');
  await open();
  await expect(sheet).toHaveAttribute('data-motion', 'open');
  await close.focus();
  await close.press('Enter');
  await expect(sheet).not.toBeVisible();
  await open();
  await sheet.getByLabel('Новое место').fill('Кафе для проверки');
  const gate: { release?: () => void } = {};
  await page.route(
    `**/meetings/${meeting.id}/place-polls`,
    async (route) => {
      await new Promise<void>((resolve) => {
        gate.release = resolve;
      });
      await route.continue();
    },
    { times: 1 },
  );
  await sheet.getByRole('button', { name: 'Предложить место', exact: true }).click();
  await expect.poll(() => !!gate.release).toBe(true);
  await expect(close).toBeDisabled();
  const before = await sheet.boundingBox();
  await dragDown(
    page,
    sheet.getByTestId('dialog-drag-region'),
    browserName === 'chromium',
  );
  await expect(sheet).toBeVisible();
  expect((await sheet.boundingBox())?.y).toBe(before?.y);
  const readCount = reads.length;
  gate.release?.();
  await expect(sheet).not.toBeVisible();
  await expect.poll(() => reads.length).toBeGreaterThan(readCount);
  await expect(
    page.getByText('Кафе для проверки', { exact: true }).first(),
  ).toBeVisible();
  await expect(composer).toHaveValue('Черновик под панелью');
});

test('desktop modal retains its close icon', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Десктопная модалка');
  await page.goto(`/meetings/${meeting.id}?action=place`);
  const dialog = page.getByRole('dialog', { name: 'Предложить место', exact: true });
  const close = dialog.getByRole('button', { name: 'Закрыть', exact: true });
  await expect(close.locator('svg')).toBeVisible();
  await expect(dialog.locator('[data-sheet-handle]')).toHaveCount(0);
  await close.click();
  await expect(dialog).not.toBeVisible();
});
