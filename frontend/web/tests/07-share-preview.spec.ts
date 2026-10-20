import { expect, test } from '@playwright/test';
import { apiCreate, apiMeeting, login, writeHeaders } from '@tests/helpers';

test('short invitation provides fresh metadata and PNG without JavaScript', async ({
  page,
  browser,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Настолки "дома"');
  const invitation = created.invitation_url;
  expect(new URL(invitation).pathname).toMatch(/^\/i\/[A-Za-z0-9_-]{22}$/);
  const description = 'Пицца & игры <script>window.injected=true</script> "до ночи"';
  const changed = await page.request.patch(`/api/v1/meetings/${created.meeting.id}`, {
    headers: await writeHeaders(page),
    data: { description, expected_revision: created.meeting.revision },
  });

  expect(changed.status()).toBe(200);
  const context = await browser.newContext({
    javaScriptEnabled: false,
    ignoreHTTPSErrors: true,
  });

  const publicPage = await context.newPage();
  const response = await publicPage.goto(invitation);
  expect(response?.status()).toBe(200);
  await expect(publicPage.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'Настолки "дома"',
  );
  await expect(publicPage.locator('meta[property="og:description"]')).toHaveAttribute(
    'content',
    description,
  );
  await expect(publicPage.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    invitation,
  );
  await expect(publicPage.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    invitation,
  );
  await expect(publicPage.locator('meta[name="description"]')).toHaveCount(1);
  await expect(publicPage.locator('title')).toHaveCount(1);
  await expect(publicPage.locator('script:not([src])')).toHaveCount(0);
  const raw = await response?.text();
  expect(raw).toContain('&lt;script&gt;');
  expect(raw).not.toContain('<script>window.injected');
  expect(raw).not.toContain('organizer_id');
  expect(raw).not.toContain('participant_count');
  const image = await publicPage
    .locator('meta[property="og:image"]')
    .getAttribute('content');

  expect(image).toBe('https://127.0.0.1:8444/share-card.png');
  const picture = await context.request.get(image ?? '');
  expect(picture.status()).toBe(200);
  expect(picture.headers()['content-type']).toContain('image/png');
  const png = await picture.body();
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
  const head = await context.request.head(invitation);
  expect(head.status()).toBe(200);
  expect((await head.body()).length).toBe(0);
  await publicPage.goto(invitation.replace('/i/', '/invitations/'));
  await expect(publicPage).toHaveURL(invitation);
  const meeting = await apiMeeting(page, created.meeting.id);
  const update = await page.request.patch(`/api/v1/meetings/${meeting.id}`, {
    headers: await writeHeaders(page),
    data: { description: 'Обновлённое описание', expected_revision: meeting.revision },
  });

  expect(update.status()).toBe(200);
  await publicPage.reload();
  await expect(publicPage.locator('meta[property="og:description"]')).toHaveAttribute(
    'content',
    'Обновлённое описание',
  );
  const missing = await publicPage.goto('/i/AAAAAAAAAAAAAAAAAAAAAA');
  expect(missing?.status()).toBe(404);
  await expect(publicPage.locator('meta[property="og:title"]')).toHaveCount(0);
  await context.close();
});
