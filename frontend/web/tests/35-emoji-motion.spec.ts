import { test, expect } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';
import {
  controlSurfaceMotion,
  finishSurfaceMotion,
  sampleSurfaceMotion,
} from '@tests/helpers/surface-motion';

test.use({ hasTouch: true });

for (const width of [390, 1440]) {
  test(`emoji panel retains exit and reverses from its current frame at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await controlSurfaceMotion(page, '[data-emoji-panel]');
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Движение эмодзи');
    await page.goto(`/meetings/${meeting.id}`);
    const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
    await input.fill('До XX после');
    await input.evaluate((element) => {
      if (element instanceof HTMLTextAreaElement) {
        element.setSelectionRange(3, 5);
        element.dispatchEvent(new Event('select', { bubbles: true }));
      }
    });
    await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
    const panel = page.locator('[data-emoji-panel]');
    await expect(panel).toHaveAttribute('data-motion', 'opening');
    const first = await sampleSurfaceMotion(panel, 0);
    const middle = await sampleSurfaceMotion(panel, 90);
    expect(first.opacity).toBe(0);
    expect(middle.duration).toBe(180);
    expect(middle.opacity).toBeGreaterThan(0);
    expect(middle.opacity).toBeLessThan(1);

    if (width < 740) {
      expect(first.height).toBe(0);
      expect(Number.parseFloat(String(first.keyframes[0]?.['height']))).toBe(0);
      expect(middle.height).toBeGreaterThan(0);
      expect(middle.composerBottom).toBeLessThanOrEqual(middle.top);
    } else {
      expect(middle.height).toBe(first.height);
      expect(middle.keyframes.every((frame) => !('height' in frame))).toBe(true);
    }

    await page.screenshot({ path: test.info().outputPath('emoji-enter-middle.png') });
    await finishSurfaceMotion(panel);
    await expect(panel).toHaveAttribute('data-motion', 'open');
    const opened = await sampleSurfaceMotion(panel);
    expect(opened.opacity).toBe(1);
    await page.keyboard.press('Escape');
    await expect(panel).toHaveAttribute('inert', '');
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
    await expect(panel).toHaveCSS('pointer-events', 'none');
    await expect(page.getByRole('region', { name: 'Выбор эмодзи' })).toHaveCount(0);
    const closing = await sampleSurfaceMotion(panel, 75);
    expect(closing.duration).toBe(150);
    expect(closing.opacity).toBeGreaterThan(0);
    expect(closing.opacity).toBeLessThan(1);
    await expect(
      page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }),
    ).toBeFocused();
    await page.screenshot({ path: test.info().outputPath('emoji-exit-middle.png') });
    await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
    await expect(panel).toHaveAttribute('data-motion', 'opening');
    const reopened = await sampleSurfaceMotion(panel, 0);
    await test.info().attach('reopen-samples', {
      body: JSON.stringify({ closing, reopened }, null, 2),
      contentType: 'application/json',
    });
    expect(reopened.opacity).toBeCloseTo(closing.opacity, 3);
    expect(reopened.height).toBeCloseTo(closing.height, 1);
    await expect(panel).not.toHaveAttribute('inert');
    await finishSurfaceMotion(panel);
    await expect(panel).toHaveAttribute('data-motion', 'open');
    await expect(input).toHaveValue('До XX после');
    await page
      .getByRole('button', { name: 'Вернуться к клавиатуре', exact: true })
      .click();
    await expect(input).toBeFocused();
    expect(
      await input.evaluate(
        (element) =>
          element instanceof HTMLTextAreaElement && [
            element.selectionStart,
            element.selectionEnd,
          ],
      ),
    ).toEqual([3, 5]);
    await finishSurfaceMotion(panel);
    await expect(panel).toHaveCount(0);
    await test.info().attach('motion-samples', {
      body: JSON.stringify({ first, middle, opened, closing, reopened }, null, 2),
      contentType: 'application/json',
    });
  });

  test(`reduced emoji motion is immediate and returns focus at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await controlSurfaceMotion(page, '[data-emoji-panel]');
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Эмодзи без движения');
    await page.goto(`/meetings/${meeting.id}`);
    const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
    await input.fill('Сохранённый черновик');
    const opener = page.getByRole('button', { name: 'Выбрать эмодзи', exact: true });
    await opener.click();
    const panel = page.locator('[data-emoji-panel]');
    await expect(panel).toHaveAttribute('data-motion', 'open');
    expect(await panel.evaluate((element) => element.getAnimations().length)).toBe(0);
    await panel.getByRole('searchbox').focus();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect(input).toHaveValue('Сохранённый черновик');
    await page.screenshot({ path: test.info().outputPath('emoji-reduced-closed.png') });
  });
}
