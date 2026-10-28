import { test, expect } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';
import {
  controlSurfaceMotion,
  finishSurfaceMotion,
  sampleSurfaceMotion,
} from '@tests/helpers/surface-motion';

test.use({ hasTouch: true });

for (const width of [390, 1440]) {
  test(`composer action menu animates, reverses and opens a form without waiting at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await controlSurfaceMotion(page, '[data-action-menu]');
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Движение меню');
    await page.goto(`/meetings/${meeting.id}`);
    const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
    await input.fill('Черновик под меню');
    const opener = page.getByRole('button', { name: 'Добавить к встрече', exact: true });
    await opener.click();
    const menu = page.locator('[data-action-menu]');
    await expect(menu).toHaveAttribute('data-motion', 'opening');
    const first = await sampleSurfaceMotion(menu, 0);
    const middle = await sampleSurfaceMotion(menu, 90);
    expect(first.opacity).toBe(0);
    expect(first.offsetY).toBe(8);
    expect(middle.duration).toBe(180);
    expect(middle.opacity).toBeGreaterThan(0);
    expect(middle.opacity).toBeLessThan(1);
    expect(middle.offsetY).toBeGreaterThan(0);
    expect(middle.offsetY).toBeLessThan(8);
    expect(middle.scaleX).toBe(1);
    expect(middle.scaleY).toBe(1);
    await expect(menu.getByRole('menuitem', { name: 'Фото', exact: true })).toBeFocused();
    await page.keyboard.press('End');
    await expect(menu.getByRole('menuitem', { name: 'Предложить задачу' })).toBeFocused();
    await page.screenshot({ path: test.info().outputPath('menu-enter-middle.png') });
    await finishSurfaceMotion(menu);
    await expect(menu).toHaveAttribute('data-motion', 'open');
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('inert', '');
    await expect(menu).toHaveAttribute('aria-hidden', 'true');
    await expect(menu).toHaveCSS('pointer-events', 'none');
    await expect(page.getByRole('menu', { name: 'Добавить к встрече' })).toHaveCount(0);
    await expect(opener).toBeFocused();
    const closing = await sampleSurfaceMotion(menu, 75);
    expect(closing.duration).toBe(150);
    expect(closing.opacity).toBeGreaterThan(0);
    expect(closing.opacity).toBeLessThan(1);
    await page.screenshot({ path: test.info().outputPath('menu-exit-middle.png') });
    await opener.click();
    await expect(menu).toHaveAttribute('data-motion', 'opening');
    const reopened = await sampleSurfaceMotion(menu, 0);
    expect(reopened.opacity).toBeCloseTo(closing.opacity, 3);
    expect(reopened.offsetY).toBeCloseTo(closing.offsetY, 3);
    await finishSurfaceMotion(menu);
    await expect(menu).toHaveAttribute('data-motion', 'open');
    await page.goBack();
    await expect(menu).toHaveAttribute('data-motion', 'closing');
    await expect(opener).toBeFocused();
    await finishSurfaceMotion(menu);
    await expect(menu).toHaveCount(0);
    await opener.click();
    await expect(menu).toHaveAttribute('data-motion', 'opening');
    await finishSurfaceMotion(menu);
    await expect(menu).toHaveAttribute('data-motion', 'open');
    await menu.getByRole('menuitem', { name: 'Предложить дату' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Новая дата встречи', exact: true }),
    ).toBeVisible();
    await expect(menu).toHaveAttribute('data-motion', 'closing');
    await expect(menu).toHaveAttribute('inert', '');
    await expect(input).toHaveValue('Черновик под меню');
    await page.screenshot({ path: test.info().outputPath('form-before-menu-exit.png') });
    await finishSurfaceMotion(menu);
    await expect(menu).toHaveCount(0);
    await test.info().attach('menu-motion-samples', {
      body: JSON.stringify({ first, middle, closing, reopened }, null, 2),
      contentType: 'application/json',
    });
  });

  test(`reduced composer action menu switches immediately and restores focus at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await controlSurfaceMotion(page, '[data-action-menu]');
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Меню без движения');
    await page.goto(`/meetings/${meeting.id}`);
    const opener = page.getByRole('button', { name: 'Добавить к встрече', exact: true });
    await opener.click();
    const menu = page.locator('[data-action-menu]');
    await expect(menu).toHaveAttribute('data-motion', 'open');
    expect(await menu.evaluate((element) => element.getAnimations().length)).toBe(0);
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: 'Файл', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(opener).toBeFocused();
    await opener.click();
    await expect(menu).toHaveAttribute('data-motion', 'open');
    await page.goBack();
    await expect(menu).toHaveCount(0);
    await expect(opener).toBeFocused();
    await page.screenshot({ path: test.info().outputPath('menu-reduced-closed.png') });
  });
}

for (const width of [390, 1440]) {
  test(`action exit retains its own title through the last frame at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Заголовок закрываемой панели');
    await page.goto(`/meetings/${meeting.id}`);

    for (const [action, title] of [
      ['date', 'Новая дата встречи'],
      ['place', 'Предложить место'],
      ['task', 'Предложить задачу'],
      ['photo', 'Отправить фото'],
      ['file', 'Отправить файл'],
    ] as const) {
      await page.goto(`/meetings/${meeting.id}?action=${action}`);
      const dialog = page.getByRole('dialog', { name: title, exact: true });
      await expect(dialog).toHaveAttribute('data-motion', 'open');
      await dialog.evaluate((element) => {
        element.setAttribute('data-exit-probe', 'true');
        const titles: string[] = [];
        const observer = new MutationObserver(() => {
          if (element.getAttribute('data-motion') === 'closing') {
            titles.push(element.querySelector('h2')?.textContent ?? '');
            element.setAttribute('data-exit-titles', titles.join('\n'));
          }

          if (!element.hasAttribute('open')) {
            observer.disconnect();
          }
        });

        observer.observe(element, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: ['open', 'data-motion'],
        });
      });
      await dialog.getByRole('button', { name: 'Закрыть', exact: true }).click();
      const closed = page.locator('[data-exit-probe="true"]');
      await expect(closed).not.toBeVisible();
      const observed = ((await closed.getAttribute('data-exit-titles')) ?? '')
        .split('\n')
        .filter(Boolean);

      expect(observed.length).toBeGreaterThan(0);
      expect(observed.every((value) => value === title)).toBe(true);
    }
  });
}
