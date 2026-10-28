import { expect, test } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';

for (const width of [390, 1440]) {
  for (const photo of [false, true]) {
    const kind = photo ? 'photo' : 'file';
    const title = photo ? 'Отправить фото' : 'Отправить файл';
    const choice = photo ? 'Выбрать фото' : 'Выбрать файлы';

    test(`upload ${kind} opens the form before one explicit chooser at ${width}`, async ({
      page,
      browserName,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await login(page, 'Саша');
      const { meeting } = await apiCreate(page, 'Явный выбор вложения');
      await page.goto(`/meetings/${meeting.id}`);
      const composer = page.getByLabel('Сообщение', { exact: true });
      await composer.fill('Привет XX мир');
      await composer.evaluate((element: HTMLTextAreaElement) => {
        element.setSelectionRange(7, 9);
      });
      let choosers = 0;
      page.on('filechooser', () => choosers++);
      await page.getByRole('button', { name: 'Добавить к встрече' }).click();
      await page
        .getByRole('menuitem', { name: photo ? 'Фото' : 'Файл', exact: true })
        .click();
      const dialog = page.getByRole('dialog', { name: title, exact: true });
      await expect(dialog).toHaveAttribute('data-motion', 'open');
      const choose = dialog.getByRole('button', { name: choice, exact: true });
      await expect(choose).toBeVisible();
      expect(choosers).toBe(0);
      const before = await choose.boundingBox();
      await dialog.getByRole('button', { name: 'Закрыть', exact: true }).focus();
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
      await expect(choose).toBeFocused();
      await expect(choose).toHaveCSS('outline-width', '2px');
      await expect(choose).toHaveCSS('outline-style', 'solid');
      await expect(choose).toHaveCSS('outline-offset', '5px');
      await expect(choose).toHaveCSS('border-radius', '13px');
      expect(await choose.boundingBox()).toEqual(before);

      for (const key of ['Enter', 'Space']) {
        const opened = page.waitForEvent('filechooser');
        await choose.press(key);
        await (await opened).setFiles([]);
        await dialog.locator('input[type=file]').dispatchEvent('cancel', {
          bubbles: true,
        });
        await expect(dialog).toBeVisible();
        await expect(choose).toBeFocused();
        expect(choosers).toBe(key === 'Enter' ? 1 : 2);
      }

      if (width >= 740) {
        await page.keyboard.press('Escape');
      } else {
        await dialog.getByRole('button', { name: 'Закрыть', exact: true }).click();
      }

      await expect(dialog).not.toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Добавить к встрече' }),
      ).toBeFocused();
      await expect(composer).toHaveValue('Привет XX мир');
      expect(
        await composer.evaluate((element: HTMLTextAreaElement) => [
          element.selectionStart,
          element.selectionEnd,
        ]),
      ).toEqual([7, 9]);
    });

    test(`bubbling file cancel preserves empty and populated ${kind} form at ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await login(page, 'Саша');
      const { meeting } = await apiCreate(page, 'Отмена выбора вложения');
      await page.goto(`/meetings/${meeting.id}?action=${kind}`);
      const dialog = page.getByRole('dialog', { name: title, exact: true });
      const input = dialog.getByLabel(choice, { exact: true });
      await expect(input).toBeAttached();
      let publications = 0;
      page.on('request', (request) => {
        if (request.method() === 'POST' && request.url().endsWith('/publish')) {
          publications++;
        }
      });

      for (let attempt = 0; attempt < 3; attempt++) {
        await input.dispatchEvent('cancel', { bubbles: true });
        await expect(dialog).toBeVisible();
        await expect(
          dialog.getByRole('button', { name: choice, exact: true }),
        ).toBeFocused();
        await expect(
          dialog.getByRole('button', { name: 'Отправить', exact: true }),
        ).toBeDisabled();
      }

      const image = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9ioAAAAASUVORK5CYII=',
        'base64',
      );

      await input.setInputFiles(
        photo
          ? ['one.png', 'two.png'].map((name) => ({
              name,
              mimeType: 'image/png',
              buffer: image,
            }))
          : {
              name: 'plan.txt',
              mimeType: 'text/plain',
              buffer: Buffer.from('План встречи'),
            },
      );

      if (!photo) {
        await dialog.getByLabel('Подпись к plan.txt').fill('План встречи');
      }

      for (let attempt = 0; attempt < 3; attempt++) {
        await input.dispatchEvent('cancel', { bubbles: true });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('button', { name: 'Выбрать ещё' })).toBeFocused();

        if (photo) {
          await expect(dialog.locator('img')).toHaveCount(2);
          await expect(
            dialog.getByRole('button', { name: 'Убрать one.png' }),
          ).toBeVisible();
          await expect(
            dialog.getByRole('button', { name: 'Убрать two.png' }),
          ).toBeVisible();
        } else {
          await expect(dialog.getByLabel('Подпись к plan.txt')).toHaveValue(
            'План встречи',
          );
        }

        await expect(
          dialog.getByRole('button', { name: 'Отправить', exact: true }),
        ).toBeEnabled();
      }

      expect(publications).toBe(0);
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    });
  }
}
