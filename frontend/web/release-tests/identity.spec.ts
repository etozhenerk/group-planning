import { test, expect } from '@playwright/test';
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

test('full version is from the unpacked artifact, without login or API', async ({
  page,
  request,
}) => {
  await request.post('/__test/select?variant=candidate');
  const info = readInfo('candidate');
  await page.route('**/api/**', (route) => route.abort());
  await page.goto('/about');
  await expect(
    page.locator('dl').getByText(`Версия ${info.version}`, { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('term')
      .filter({ hasText: /^Сборка$/ })
      .locator('+ dd'),
  ).toHaveText(String(info.build_number));
  const footer = page.locator('footer');
  await expect(footer.getByText(`Версия ${info.version}`, { exact: true })).toBeVisible();

  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await footer.scrollIntoViewIfNeeded();
    await expect(
      footer.getByText(`Версия ${info.version}`, { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    await page.screenshot({
      path: path.join(root, `version-${width}.png`),
      fullPage: true,
    });
  }

  await page.setViewportSize({ width: 320, height: 900 });
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
  await expect(footer.getByText(`Версия ${info.version}`, { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  const versionLink = footer.getByRole('link', {
    name: `Версия ${info.version}`,
    exact: true,
  });

  await versionLink.focus();
  await expect(versionLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/about');
  await page.screenshot({
    path: path.join(root, 'version-320-large-text.png'),
    fullPage: true,
  });
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
    page.locator('dl').getByText(`Версия ${previous.version}`, { exact: true }),
  ).toBeVisible();
  await request.post('/__test/select?variant=candidate');
  await expect(
    page.locator('dl').getByText(`Версия ${previous.version}`, { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator('dl').getByText(`Версия ${candidate.version}`, { exact: true }),
  ).toBeVisible();
  await request.post('/__test/select?variant=previous');
  await page.reload();
  await expect(
    page.locator('dl').getByText(`Версия ${previous.version}`, { exact: true }),
  ).toBeVisible();
});

test('a long RC is readable at 320 px', async ({ page, request }) => {
  test.skip(
    !existsSync(path.join(root, 'long/dist/build-info.json')),
    'Local long-version artifact is not supplied',
  );
  const info = readInfo('long');
  await request.post('/__test/select?variant=long');
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/about');
  await expect(
    page.locator('dl').getByText(`Версия ${info.version}`, { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await page.screenshot({
    path: path.join(root, 'version-long-320.png'),
    fullPage: true,
  });
});
