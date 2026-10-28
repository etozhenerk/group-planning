import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { apiCreate, login, writeHeaders } from '@tests/helpers';
import { designTokens } from '@/shared/config/design-tokens';

const expectFitsWidth = async (element: Locator) => {
  await expect
    .poll(() => element.evaluate((node) => node.scrollWidth - node.clientWidth))
    .toBeLessThanOrEqual(1);
};

const changeVisualViewport = async (
  page: Page,
  height: number,
  offsetTop = 0,
  scale = 1,
) => {
  await page.evaluate(
    ({ height, offsetTop, scale }) => {
      const viewport = window.visualViewport;

      if (!viewport) {
        throw new Error('Visual viewport unavailable');
      }

      Object.defineProperties(viewport, {
        height: { configurable: true, value: height },
        offsetTop: { configurable: true, value: offsetTop },
        scale: { configurable: true, value: scale },
      });
      viewport.dispatchEvent(new Event('resize'));
    },
    { height, offsetTop, scale },
  );
};

for (const width of [320, 402, 430]) {
  test(`long meeting facts and forms stay within mobile width ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 874 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectFitsWidth(page.locator('html'));
    await login(page, 'Лена');
    await page.goto('/meetings/new');
    await expect(page.getByLabel('Название', { exact: true })).toBeVisible();
    await expectFitsWidth(page.locator('html'));
    const fonts = await page
      .locator('input:not([type="file"]), textarea')
      .evaluateAll((items) =>
        items.map((item) => parseFloat(getComputedStyle(item).fontSize)),
      );

    expect(fonts.length).toBeGreaterThan(3);
    expect(fonts.every((size) => size >= 16)).toBe(true);
    const created = await apiCreate(page, 'Длинноеназвание'.repeat(8));
    const patched = await page.request.patch(`/api/v1/meetings/${created.meeting.id}`, {
      headers: await writeHeaders(page),
      data: {
        expected_revision: created.meeting.revision,
        place: 'Длинныйадрес'.repeat(15),
        description: 'Длиннаяссылка'.repeat(60),
      },
    });

    expect(patched.status()).toBe(200);
    await page.goto(new URL(created.invitation_url).pathname);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectFitsWidth(page.locator('html'));
    await page.goto(`/meetings/${created.meeting.id}`);
    await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
    await expectFitsWidth(page.locator('html'));
    const header = page.locator('main#main > header');
    const heading = header.getByRole('button', {
      name: `Сведения о встрече «${created.meeting.title}»`,
      exact: true,
    });

    await expect(heading.getByRole('heading', { level: 1 })).toHaveText(
      created.meeting.title,
    );
    await expectFitsWidth(heading);

    for (const text of await heading.locator('span').all()) {
      await expect(text).toHaveCSS('text-overflow', 'ellipsis');
      await expect(text).toHaveCSS('overflow-x', 'hidden');
      await expect
        .poll(() => text.evaluate((node) => node.scrollHeight - node.clientHeight))
        .toBeLessThanOrEqual(1);
    }

    const back = header.getByRole('link', { name: 'К моим встречам', exact: true });
    const controls = [
      back,
      heading,
      header.getByRole('button', { name: 'Пригласить друзей', exact: true }),
      header.getByRole('button', { name: 'Информация о встрече', exact: true }),
    ];

    for (const control of controls) {
      await expect(control).toBeInViewport();
      const bounds = await control.boundingBox();
      const minimum = Number.parseFloat(designTokens.targetWeb);
      expect(bounds?.width).toBeGreaterThanOrEqual(minimum);
      expect(bounds?.height).toBeGreaterThanOrEqual(minimum);
      await control.click({ trial: true });
    }

    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(874);
    await page.getByRole('button', { name: 'Информация о встрече' }).click();
    const dialog = page.getByRole('dialog', { name: created.meeting.title });
    await expect(
      dialog.getByRole('heading', { name: created.meeting.title, exact: true }),
    ).toHaveText(created.meeting.title);
    await expect(dialog).toHaveAttribute('data-motion', 'open');
    await expectFitsWidth(dialog);
    // The body scrolls under a fixed header, so close stays reachable.
    const content = dialog.getByTestId('meeting-info-scroll');
    expect(await content.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(
      true,
    );
    await content.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await expect(
      dialog.getByRole('button', { name: 'Закрыть', exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await page.screenshot({
      path: `test-results/mobile-facts-${test.info().project.name}-${width}.png`,
    });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(874);
    await back.click();
    await expect(page).toHaveURL(/\/meetings$/);
    await expect(
      page.locator(
        `[data-testid="meeting-card"] a[href="/meetings/${created.meeting.id}"]`,
      ),
    ).toBeVisible();
  });
}

test('chat and sheet follow the visible viewport without creating a second page scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Проверка клавиатуры');
  await page.goto(`/meetings/${created.meeting.id}`);
  const message = page.getByLabel('Сообщение', { exact: true });
  await expect(message).toBeVisible();
  await expect(message).toHaveCSS('font-size', '16px');
  const original = await message.boundingBox();
  await message.focus();
  await changeVisualViewport(page, 500, 12);
  await expect
    .poll(async () => {
      const box = await message.boundingBox();

      return (box?.y ?? 0) + (box?.height ?? 0);
    })
    .toBeLessThanOrEqual(512);
  await expectFitsWidth(page.locator('html'));
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(874);
  await page.getByRole('button', { name: 'Информация о встрече' }).click();
  const dialog = page.getByRole('dialog', { name: created.meeting.title });
  await expect(dialog).toHaveAttribute('data-motion', 'open');
  await expectFitsWidth(dialog);
  const bounds = await dialog.boundingBox();
  expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(512);
  expect(bounds?.y).toBeGreaterThanOrEqual(12);
  await expect(
    dialog.getByRole('heading', { name: created.meeting.title, exact: true }),
  ).toBeInViewport();
  await page.screenshot({
    path: `test-results/mobile-keyboard-${test.info().project.name}.png`,
  });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await changeVisualViewport(page, 874);
  await expect
    .poll(async () => (await message.boundingBox())?.y)
    .toBeCloseTo(original?.y ?? 0, 0);
  const restored = await message.boundingBox();
  await changeVisualViewport(page, 400, 100, 2);
  expect(await message.boundingBox()).toEqual(restored);
  await changeVisualViewport(page, 874);
});

test('closing a mobile sheet restores the background position and permits normal page scrolling', async ({
  page,
  isMobile,
}) => {
  await page.setViewportSize({ width: 402, height: 600 });
  await login(page, 'Саша');
  const title = `Прокрутка ${test.info().project.name}`;

  for (let index = 0; index < 5; index++) {
    await apiCreate(page, `${title} ${index}`);
  }

  await page.goto('/meetings');
  await page.getByRole('button', { name: /Предстоящие/ }).click();
  const meeting = page.getByRole('link', { name: new RegExp(`${title} 4`) });
  await expect(page.getByRole('article').first()).toBeVisible();

  while ((await meeting.count()) === 0) {
    const more = page.getByRole('button', { name: 'Показать ещё', exact: true });
    const count = await page.getByRole('article').count();
    await expect(more).toBeVisible();
    await more.click();
    await expect.poll(() => page.getByRole('article').count()).toBeGreaterThan(count);
  }

  await expect(meeting).toBeVisible();
  await page.evaluate(() => scrollTo(0, 200));
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await page.evaluate(() => scrollTo(0, 200));
  await expect(
    page.getByRole('heading', { name: 'Мой профиль', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Удалить аккаунт', exact: true })
    .evaluate((element) => element.scrollIntoView({ block: 'center' }));
  const before = await page.evaluate(() => scrollY);
  const profile = page.getByRole('link', { name: 'Профиль', exact: true });
  const profileBefore = await profile.boundingBox();
  expect(before).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Удалить аккаунт', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Удалить аккаунт?' });
  await expect(dialog).toHaveAttribute('data-motion', 'open');
  await expect(page.locator('body')).toHaveCSS('position', 'fixed');
  await expect(page.locator('body')).toHaveCSS('top', `${-before}px`);
  expect((await profile.boundingBox())?.y).toBe(profileBefore?.y);

  if (!isMobile) {
    await page.mouse.move(2, 2);
    await page.mouse.wheel(0, 200);
  }

  await page.evaluate(() => scrollBy(0, 200));
  await expect(page.locator('body')).toHaveCSS('top', `${-before}px`);
  expect((await profile.boundingBox())?.y).toBe(profileBefore?.y);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(before);
  await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
  await page.evaluate(() => scrollTo(0, 0));
  expect(await page.evaluate(() => scrollY)).toBe(0);
});
