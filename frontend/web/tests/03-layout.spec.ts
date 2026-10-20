import { test, expect } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';

for (const width of [320, 390, 768, 1440]) {
  test(`layout and keyboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Кто придёт');
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'К содержимому' })).toBeFocused();
    await page.screenshot({
      path: `test-results/onboarding-${width}.png`,
      fullPage: true,
    });
    await login(page, 'Саша');
    const created = await apiCreate(page, `Раскладка ${width}`);
    await page.goto(`/meetings/${created.meeting.id}`);
    await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
    const size = await page
      .getByRole('button', { name: 'Отправить сообщение' })
      .boundingBox();

    expect(size?.width).toBeGreaterThanOrEqual(44);
    expect(size?.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    const title = await page.getByTestId('conversation-title').boundingBox();
    const share = page.getByRole('button', { name: 'Пригласить друзей', exact: true });
    const info = page.getByRole('button', { name: 'Информация о встрече' });

    for (const action of width >= 1170 ? [share] : [share, info]) {
      const bounds = await action.boundingBox();
      const center = (bounds?.y ?? 0) + (bounds?.height ?? 0) / 2;
      expect(center).toBeCloseTo((title?.y ?? 0) + (title?.height ?? 0) / 2, 0);
    }

    await share.click();
    const invitation = page.getByRole('dialog', { name: 'Приглашение для друзей' });
    await expect(invitation).toBeVisible();
    await expect(invitation).toHaveCSS(
      'animation-name',
      width < 740 ? /sheet-enter/ : /dialog-enter/,
    );
    const copy = invitation.getByRole('button', { name: 'Скопировать ссылку' });
    await expect(copy).toBeVisible();
    await expect(copy).not.toHaveCSS('font-size', '0px');
    await page.screenshot({
      path: `test-results/share-sheet-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    const panel = await invitation.boundingBox();

    if (width < 740) {
      expect((panel?.y ?? 0) + (panel?.height ?? 0)).toBeCloseTo(900, 0);
    }

    await page.keyboard.press('Escape');
    await expect(share).toBeFocused();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

    if (width < 1170) {
      await expect(page.getByTestId('details-sidebar')).toHaveCount(0);
      await expect(page.getByRole('term').filter({ hasText: 'Когда' })).toHaveCount(0);
      await info.click();
      await expect(page.getByRole('dialog', { name: 'Детали встречи' })).toBeVisible();
      await expect(page.getByRole('term').filter({ hasText: 'Когда' })).toHaveCount(1);
      await page.keyboard.press('Escape');
      await expect(info).toBeFocused();
    } else {
      await expect(info).toHaveCount(0);
      await expect(page.getByTestId('details-sidebar')).toBeVisible();
      await expect(page.getByRole('term').filter({ hasText: 'Когда' })).toHaveCount(1);
    }

    await page.screenshot({ path: `test-results/meeting-${width}.png`, fullPage: true });
  });
}

test('dialog respects reduced motion and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Без движения');
  await page.goto(`/meetings/${created.meeting.id}`);
  const info = page.getByRole('button', { name: 'Информация о встрече' });
  await info.click();
  const dialog = page.getByRole('dialog', { name: 'Детали встречи' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS('animation-name', 'none');
  await page.keyboard.press('Escape');
  await expect(info).toBeFocused();
});
