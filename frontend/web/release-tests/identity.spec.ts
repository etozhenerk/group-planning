import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { buildInfoSchema } from '#build-info';

const root = process.env.SOMEWHERE_RELEASE_PREVIEW_ROOT;

if (!root) {
  throw new Error('Release artifact directory required');
}

const readInfo = (variant: string) => {
  const value: unknown = JSON.parse(
    readFileSync(path.join(root, variant, 'dist/build-info.json'), 'utf8'),
  );

  return buildInfoSchema.parse(value);
};

const enlargeText = async (page: Page) => {
  await page.evaluate(() => {
    const sizes = Array.from(document.querySelectorAll<HTMLElement>('body, body *'))
      .filter((element) => element instanceof HTMLElement)
      .map((element) => ({
        element,
        size: parseFloat(getComputedStyle(element).fontSize),
      }));

    for (const { element, size } of sizes) {
      element.style.setProperty('font-size', `${size * 2}px`, 'important');
    }
  });
};

test('full version is from the unpacked artifact, without login or API', async ({
  page,
  request,
}) => {
  await request.post('/__test/select?variant=candidate');
  const info = readInfo('candidate');
  await page.route('**/api/**', (route) => route.abort());
  await page.goto('/about');
  await expect(page.locator('dl').getByText(info.version, { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole('term')
      .filter({ hasText: /^Сборка$/ })
      .locator('+ dd'),
  ).toHaveText(String(info.build_number));
  await expect(page.locator('footer')).toHaveCount(0);

  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      page.locator('dl').getByText(info.version, { exact: true }),
    ).toBeVisible();
    await expect(page.locator('footer')).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    await page.screenshot({
      path: path.join(root, `version-${width}.png`),
      fullPage: true,
    });
  }

  await page.setViewportSize({ width: 320, height: 900 });
  await enlargeText(page);
  await expect(page.locator('dl').getByText(info.version, { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await page.screenshot({
    path: path.join(root, 'version-320-large-text.png'),
    fullPage: true,
  });
});

test('version footer appears only on desktop onboarding', async ({
  page,
  request,
  browser,
}) => {
  await request.post('/__test/select?variant=candidate');
  const info = readInfo('candidate');
  await page.route('**/api/**', (route) => route.abort());
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const footer = page.locator('footer');
  const versionLink = footer.getByRole('link', {
    name: `Версия ${info.version}`,
    exact: true,
  });

  await expect(footer).toHaveCount(1);
  await expect(versionLink).toBeVisible();
  await footer.screenshot({ path: path.join(root, 'version-onboarding-1280.png') });

  for (const width of [320, 390, 739]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(footer).toBeHidden();
  }

  await page.setViewportSize({ width: 740, height: 900 });
  await expect(versionLink).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await enlargeText(page);
  await versionLink.focus();
  await expect(versionLink).toHaveAccessibleName(`Версия ${info.version}`);
  await expect(versionLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/about');
  await expect(page.locator('dl').getByText(info.version, { exact: true })).toBeVisible();
  await expect(footer).toHaveCount(0);

  const phone = await browser.newPage({
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
  });

  try {
    await phone.goto(new URL('/', page.url()).toString());
    await expect(phone.getByRole('heading', { level: 1 })).toContainText('Кто придёт');
    expect(await phone.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(
      true,
    );
    await expect(phone.locator('footer')).toBeHidden();
  } finally {
    await phone.close();
  }
});

test('an open tab keeps its identity through deployment and rollback', async ({
  page,
  request,
}) => {
  test.skip(
    !existsSync(path.join(root, 'previous/dist/build-info.json')),
    'Local comparison artifacts are not supplied',
  );
  const candidate = readInfo('candidate');
  const previous = readInfo('previous');
  await request.post('/__test/select?variant=previous');
  await page.goto('/about');
  await expect(
    page.locator('dl').getByText(previous.version, { exact: true }),
  ).toBeVisible();
  await request.post('/__test/select?variant=candidate');
  await expect(
    page.locator('dl').getByText(previous.version, { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator('dl').getByText(candidate.version, { exact: true }),
  ).toBeVisible();
  await request.post('/__test/select?variant=previous');
  await page.reload();
  await expect(
    page.locator('dl').getByText(previous.version, { exact: true }),
  ).toBeVisible();
});

test('a long RC is readable at 320 px with enlarged text', async ({ page, request }) => {
  test.skip(
    !existsSync(path.join(root, 'long/dist/build-info.json')),
    'Local long-version artifact is not supplied',
  );
  const info = readInfo('long');
  await request.post('/__test/select?variant=long');
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/about');
  await enlargeText(page);
  await expect(page.locator('dl').getByText(info.version, { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await expect(page.locator('footer')).toHaveCount(0);
  await page.screenshot({
    path: path.join(root, 'version-long-320.png'),
    fullPage: true,
  });
});
