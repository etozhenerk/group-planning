import { expect, test } from '@playwright/test';
import { apiCreate, login, writeHeaders } from '@tests/helpers';

test.use({ hasTouch: true });

for (const width of [390, 1440]) {
  test(`pointer focus preserves editable fields and selected support options at ${width}`, async ({
    page,
    browserName,
  }) => {
    await page.setViewportSize({ width, height: 874 });
    await login(page, 'Саша');
    await page.goto('/support');
    const email = page.getByRole('textbox', { name: 'Почта для ответа', exact: true });
    await email.click();
    await expect(email).toBeFocused();
    await expect(email).toHaveCSS('outline-style', 'solid');
    const description = page.getByRole('textbox', {
      name: 'Ваше сообщение',
      exact: true,
    });

    await description.click();
    await expect(description).toHaveCSS('outline-style', 'solid');
    const idea = page.getByRole('radio', { name: 'Идея', exact: true });
    const ideaLabel = page.locator('label').filter({ has: idea });
    const ideaSurface = ideaLabel.locator('span');
    await ideaLabel.click();
    await expect(idea).toBeChecked();
    // WebKit on macOS may leave a clicked radio blurred; Linux focuses it.
    await idea.focus();
    await expect(idea).toBeFocused();
    await expect(ideaSurface).toHaveCSS('outline-style', 'none');
    const selected = await ideaSurface.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );

    await ideaLabel.tap();
    await idea.focus();
    await expect(ideaSurface).toHaveCSS('outline-style', 'none');
    await idea.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await expect(idea).toBeFocused();
    await expect(ideaSurface).toHaveCSS('outline-style', 'solid');
    await idea.press('Space');
    await expect(ideaSurface).toHaveCSS('outline-style', 'solid');
    await ideaLabel.click();
    await expect(ideaSurface).toHaveCSS('outline-style', 'none');
    await expect(ideaSurface).toHaveCSS('background-color', selected);
    await email.click();
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    const screenshot = page.getByLabel('Прикрепить скриншот', { exact: true });
    const screenshotLabel = page.locator('label').filter({ has: screenshot });
    await expect(screenshot).toBeFocused();
    await expect(screenshotLabel).toHaveCSS('outline-style', 'solid');
    const chooser = page.waitForEvent('filechooser');
    await screenshot.click();
    await (await chooser).setFiles([]);
    // WebKit's intercepted picker can blur; check programmatic pointer focus too.
    await screenshot.focus();
    await expect(screenshot).toBeFocused();
    await expect(screenshotLabel).toHaveCSS('outline-style', 'none');
  });

  test(`closing an album photo restores focus without a pointer ring on the stack at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 874 });
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Фокус области вайба');
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
    const upload = page.getByRole('dialog', { name: 'Добавить фото в альбом' });
    await upload
      .getByLabel('Выбрать фото', { exact: true })
      .setInputFiles('public/share-card.png');
    await upload.getByRole('button', { name: 'Добавить в альбом' }).click();
    await expect(upload).not.toBeVisible();
    const stack = page.getByRole('group', {
      name: 'Фото встречи. Листайте клавишами влево и вправо',
    });

    const photo = stack.getByRole('button', { name: 'Открыть фото 1', exact: true });
    const viewer = page.getByRole('dialog', { name: 'Фото встречи', exact: true });

    await stack.press('ArrowRight');
    await expect(stack).toHaveCSS('outline-style', 'solid');

    for (let attempt = 0; attempt < 2; attempt++) {
      await stack.click({ position: { x: 5, y: 5 } });
      await expect(stack).toBeFocused();
      await expect(stack).toHaveCSS('outline-style', 'none');
      await photo.click();
      await expect(viewer).toBeVisible();
      await viewer.getByRole('button', { name: 'Закрыть просмотр', exact: true }).click();
      await expect(viewer).not.toBeVisible();
      await expect(page.locator('html')).toHaveAttribute(
        'data-input-modality',
        'pointer',
      );
      const focus = await stack.evaluate((element) => {
        const active = document.activeElement;

        return {
          restored: active === element || element.contains(active),
          tag: active?.tagName,
          role: active?.getAttribute('role'),
          outline: active ? getComputedStyle(active).outlineStyle : null,
          stackOutline: getComputedStyle(element).outlineStyle,
        };
      });

      await test.info().attach(`album-return-focus-${attempt}`, {
        body: JSON.stringify(focus),
        contentType: 'application/json',
      });
      expect(focus.restored).toBe(true);
      expect(focus.outline).toBe('none');
      await expect(stack).toHaveCSS('outline-style', 'none');
      await expect(photo).toHaveCSS('outline-style', 'none');
      await stack.press('ArrowRight');
      await expect(stack).toBeFocused();
      await expect(stack).toHaveCSS('outline-style', 'solid');
    }
  });

  test(`pointer modal and picker return focus without a ring; keyboard keeps it at ${width}`, async ({
    page,
    browserName,
  }) => {
    await page.setViewportSize({ width, height: 874 });
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Фокус по способу ввода');
    await page.goto(`/meetings/${meeting.id}`);
    const composer = page.getByLabel('Сообщение', { exact: true });
    await composer.fill('Черновик перед открытием');
    await composer.press('End');
    const plus = page.getByRole('button', { name: 'Добавить к встрече', exact: true });
    await plus.click();
    await page.getByRole('menuitem', { name: 'Файл', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Отправить файл', exact: true });
    await expect(dialog).toHaveAttribute('data-motion', 'open');
    const close = dialog.getByRole('button', { name: 'Закрыть', exact: true });
    const choose = dialog.getByRole('button', { name: 'Выбрать файлы', exact: true });
    await expect(close).toBeFocused();
    await expect(close).toHaveCSS('outline-style', 'none');
    const opened = page.waitForEvent('filechooser');
    await choose.click();
    await (await opened).setFiles([]);
    // The native chooser is intercepted; dispatch its documented cancel signal.
    await dialog.locator('input[type=file]').dispatchEvent('cancel', { bubbles: true });
    await expect(dialog).toBeVisible();
    await expect(choose).toBeFocused();
    await expect(choose).toHaveCSS('outline-style', 'none');
    await close.click();
    await expect(dialog).not.toBeVisible();
    await expect(plus).toBeFocused();
    await expect(plus).toHaveCSS('outline-style', 'none');
    await expect(composer).toHaveValue('Черновик перед открытием');
    await plus.press('Enter');
    const first = page.getByRole('menuitem', { name: 'Фото', exact: true });
    await expect(first).toBeFocused();
    await expect(first).toHaveCSS('outline-style', 'solid');
    await first.press('ArrowDown');
    const file = page.getByRole('menuitem', { name: 'Файл', exact: true });
    await expect(file).toBeFocused();
    await expect(file).toHaveCSS('outline-style', 'solid');
    await file.press('Enter');
    await expect(dialog).toHaveAttribute('data-motion', 'open');
    await expect(close).toBeFocused();
    await expect(close).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(choose).toBeFocused();
    await expect(choose).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(plus).toBeFocused();
    await expect(plus).toHaveCSS('outline-style', 'solid');
  });
}
