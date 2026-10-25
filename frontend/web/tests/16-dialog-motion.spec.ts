import { expect, test } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';

for (const width of [390, 1440]) {
  test(`dialog keeps content and scroll lock until exit ends at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Проверка анимации');
    await page.goto(`/meetings/${meeting.id}`);
    const open = page.getByRole('button', { name: 'Информация о встрече', exact: true });
    const dialog = page.getByRole('dialog', { name: 'Детали встречи' });
    await open.click();
    await expect(dialog).toHaveAttribute('data-motion', 'open');
    const height = (await dialog.boundingBox())?.height;

    if (width < 740) {
      await expect(
        dialog.getByRole('button', { name: 'Закрыть', exact: true }),
      ).toHaveCount(0);
      await page.keyboard.press('Escape');
    } else {
      await dialog.getByRole('button', { name: 'Закрыть', exact: true }).click();
    }

    await expect(dialog).toHaveAttribute('data-motion', 'closing');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Кто придёт · 1' })).toBeVisible();
    expect((await dialog.boundingBox())?.height).toBeCloseTo(height ?? 0, -1);
    await expect(page.locator('body')).toHaveCSS('position', 'fixed');
    await expect(dialog).not.toBeVisible();
    await expect(open).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');

    if (width === 390) {
      const info = page.getByRole('button', { name: 'Информация о встрече' });
      await info.click();
      const details = page.getByRole('dialog', { name: 'Детали встречи' });
      await expect(details).toHaveAttribute('data-motion', 'open');
      await page.keyboard.press('Escape');
      await expect(details).toHaveAttribute('data-motion', 'closing');
      await expect(details.getByRole('term').filter({ hasText: 'Когда' })).toBeVisible();
      await expect(details).not.toBeVisible();
      await expect(info).toBeFocused();
    }
  });
}

test('touch swipe follows the finger, returns after a short drag and dismisses after a long drag', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Свайп шторки');
  await page.goto(`/meetings/${meeting.id}`);
  const open = page.getByRole('button', { name: 'Информация о встрече' });
  await open.click();
  const dialog = page.getByRole('dialog', { name: 'Детали встречи' });
  await expect(dialog).toHaveAttribute('data-motion', 'open');
  const handle = dialog.getByTestId('dialog-drag-region');
  await expect(handle).toHaveCSS('touch-action', 'none');
  const bounds = await handle.boundingBox();
  const x = (bounds?.x ?? 0) + 80;
  const y = (bounds?.y ?? 0) + 20;
  const original = (await dialog.boundingBox())?.y ?? 0;
  const touch = await page.context().newCDPSession(page);
  await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y }],
  });
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x, y: y + 12 }],
  });
  await expect(dialog).toHaveAttribute('data-dragging', 'true');
  expect((await dialog.boundingBox())?.y).toBeCloseTo(original + 12, 0);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(dialog).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await expect(dialog).toBeVisible();
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y }],
  });
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x, y: y + 160 }],
  });
  await expect(dialog).toHaveAttribute('data-dragging', 'true');
  expect((await dialog.boundingBox())?.y).toBeCloseTo(original + 160, 0);
  await page.screenshot({ path: 'test-results/poll-sheet-drag-390.png' });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(dialog).toHaveAttribute('data-motion', 'closing');
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
  await expect(open).toBeFocused();
  await touch.detach();
  await open.click();
  await expect(dialog).toHaveAttribute('data-motion', 'open');
  await expect(dialog).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
});

for (const width of [320, 390]) {
  test(`swipe starts at the top edge, handle and side padding at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Вся верхняя область шторки');
    await page.goto(`/meetings/${meeting.id}`);
    const open = page.getByRole('button', { name: 'Информация о встрече' });
    const dialog = page.getByRole('dialog', { name: 'Детали встречи' });
    const touch = await page.context().newCDPSession(page);
    await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true });

    for (const point of [
      { x: width / 2, y: 3 },
      { x: width / 2, y: 14 },
      { x: 8, y: 32 },
    ]) {
      await open.click();
      await expect(dialog).toHaveAttribute('data-motion', 'open');
      await expect(
        dialog.getByRole('button', { name: 'Закрыть', exact: true }),
      ).toHaveCount(0);
      const bounds = await dialog.boundingBox();
      const top = bounds?.y ?? 0;
      const start = { x: point.x, y: top + point.y };
      await touch.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [start],
      });
      await touch.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: start.x, y: start.y + 160 }],
      });
      await expect(dialog).toHaveAttribute('data-dragging', 'true');
      expect((await dialog.boundingBox())?.y).toBeCloseTo(top + 160, 0);
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect(dialog).not.toBeVisible();
      await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
    }

    await touch.detach();
    await open.click();
    await expect(dialog).toHaveAttribute('data-motion', 'open');
    await page.screenshot({
      path: `test-results/poll-sheet-header-${width}.png`,
      animations: 'disabled',
    });
  });
}
