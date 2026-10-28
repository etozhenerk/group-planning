import { expect, test } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';

for (const width of [390, 1440]) {
  test(`photo retry keeps sheet insets and completed content through exit at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Фото и завершение панели');
    await page.goto(`/meetings/${meeting.id}?action=photo`);
    const dialog = page.getByRole('dialog', { name: 'Отправить фото', exact: true });
    const bytes = Buffer.from(
      await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Canvas unavailable');
        }

        context.fillStyle = '#aa7766';
        context.fillRect(0, 0, canvas.width, canvas.height);

        return canvas.toDataURL('image/png').split(',')[1] ?? '';
      }),
      'base64',
    );

    await dialog.getByLabel('Выбрать фото', { exact: true }).setInputFiles({
      name: 'first.png',
      mimeType: 'image/png',
      buffer: bytes,
    });
    let uploads = 0;
    await page.route(`**/meetings/${meeting.id}/media/*/content`, async (route) => {
      if (route.request().method() === 'PUT' && uploads++ === 0) {
        await route.fulfill({
          status: 503,
          json: {
            error: {
              code: 'unavailable',
              field_errors: {},
              request_id: 'upload-inset',
            },
          },
        });
      } else {
        await route.continue();
      }
    });
    await dialog.getByRole('button', { name: 'Отправить', exact: true }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    const panel = await dialog.boundingBox();
    const image = await dialog.locator('img').boundingBox();
    expect(panel).not.toBeNull();
    expect(image).not.toBeNull();
    expect((image?.x ?? 0) - (panel?.x ?? 0)).toBeCloseTo(width < 740 ? 20 : 25, 0);
    await expect(dialog.getByRole('button', { name: 'Убрать first.png' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Повторить', exact: true }).click();
    await expect(dialog.getByRole('status')).toHaveText('Добавлено');
    expect(uploads).toBe(2);
    await dialog.evaluate((element) => {
      element.setAttribute('data-upload-exit-probe', 'true');
      element.setAttribute('data-upload-exit-valid', 'true');
      let samples = 0;
      const observer = new MutationObserver(() => {
        if (element.getAttribute('data-motion') === 'closing') {
          samples++;
          element.setAttribute('data-upload-exit-samples', String(samples));

          if (
            !element.querySelector('img') ||
            !element.textContent?.includes('Добавлено')
          ) {
            element.setAttribute('data-upload-exit-valid', 'false');
          }
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
    await dialog.getByRole('button', { name: 'Готово', exact: true }).click();
    const closed = page.locator('[data-upload-exit-probe]');
    await expect(closed).not.toBeVisible();
    expect(Number(await closed.getAttribute('data-upload-exit-samples'))).toBeGreaterThan(
      0,
    );
    await expect(closed).toHaveAttribute('data-upload-exit-valid', 'true');
    await page.getByRole('button', { name: 'Добавить к встрече' }).click();
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('menuitem', { name: 'Фото', exact: true }).click();
    await (
      await chooser
    ).setFiles({ name: 'second.png', mimeType: 'image/png', buffer: bytes });
    await expect(dialog.locator('img')).toHaveCount(1);
    await expect(dialog.getByRole('status')).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Убрать second.png' })).toBeVisible();
  });
}
