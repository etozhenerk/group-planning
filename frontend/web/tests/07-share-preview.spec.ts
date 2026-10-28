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

  expect(image).toBe(new URL('/share-card.png', invitation).href);
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

test('home exposes one complete preview to a crawler without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    ignoreHTTPSErrors: true,
    userAgent: 'TelegramBot (like TwitterBot)',
  });

  const page = await context.newPage();
  const url = new URL('/', baseURL).href;
  const response = await page.goto(url);

  expect(response?.status()).toBe(200);
  await expect(page.locator('title')).toHaveCount(1);
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'somewhere — встречи с друзьями',
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    'content',
    /Пригласите друзей на встречу/,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', url);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', url);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );
  const image = await page.locator('meta[property="og:image"]').getAttribute('content');

  expect(image).toBe(new URL('/share-card.png', url).href);
  const picture = await context.request.get(image ?? '');

  expect(picture.status()).toBe(200);
  expect(picture.headers()['content-type']).toContain('image/png');
  const png = await picture.body();

  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
  await context.close();
});

test('public invitation preview follows cover add, replacement and removal', async ({
  page,
  browser,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Обложка для приглашения');
  const context = await browser.newContext({
    javaScriptEnabled: false,
    ignoreHTTPSErrors: true,
    userAgent: 'TelegramBot (like TwitterBot)',
  });

  const publicPage = await context.newPage();
  let previousImage = '';

  for (const color of ['#aa7766', '#669977', null]) {
    const data = color
      ? await page.evaluate((fill) => {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 240;
          const drawing = canvas.getContext('2d');

          if (!drawing) {
            throw new Error('No canvas');
          }

          drawing.fillStyle = fill;
          drawing.fillRect(0, 0, 320, 240);

          return canvas.toDataURL('image/png').split(',')[1];
        }, color)
      : null;

    const meeting = await apiMeeting(page, created.meeting.id);
    const response = await page.request.patch(`/api/v1/meetings/${meeting.id}`, {
      headers: await writeHeaders(page),
      data: {
        expected_revision: meeting.revision,
        cover: data ? { media_type: 'image/png', data } : null,
      },
    });

    expect(response.status()).toBe(200);
    expect((await publicPage.goto(created.invitation_url))?.status()).toBe(200);
    const image = await publicPage
      .locator('meta[property="og:image"]')
      .getAttribute('content');

    expect(image).toBeTruthy();
    expect(image).not.toBe(previousImage);
    const picture = await context.request.get(image ?? '');
    const head = await context.request.head(image ?? '');

    expect(picture.status()).toBe(200);
    expect(head.status()).toBe(200);
    expect((await head.body()).length).toBe(0);
    expect(picture.headers()['content-type']).toContain('image/png');
    const png = await picture.body();
    const width = color ? 320 : 1200;
    const height = color ? 240 : 630;

    expect(png.readUInt32BE(16)).toBe(width);
    expect(png.readUInt32BE(20)).toBe(height);
    await expect(publicPage.locator('meta[property="og:image:width"]')).toHaveAttribute(
      'content',
      String(width),
    );
    await expect(publicPage.locator('meta[property="og:image:height"]')).toHaveAttribute(
      'content',
      String(height),
    );
    await expect(publicPage.locator('meta[property="og:image:type"]')).toHaveAttribute(
      'content',
      'image/png',
    );

    if (color) {
      expect(new URL(image ?? '').pathname).toMatch(
        /^\/api\/v1\/invitations\/.+\/cover$/,
      );
      expect(new URL(image ?? '').searchParams.get('v')).toBeTruthy();
      const pixel = await page.evaluate(async (url) => {
        const photo = new Image();
        photo.src = url;
        await photo.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const drawing = canvas.getContext('2d');

        if (!drawing) {
          throw new Error('No canvas');
        }

        drawing.drawImage(photo, 0, 0, 1, 1);

        return Array.from(drawing.getImageData(0, 0, 1, 1).data).slice(0, 3);
      }, image ?? '');

      expect(pixel).toEqual(
        [1, 3, 5].map((start) => Number.parseInt(color.slice(start, start + 2), 16)),
      );
    } else {
      expect(image).toBe(new URL('/share-card.png', created.invitation_url).href);
    }

    if (previousImage) {
      expect((await context.request.get(previousImage)).status()).toBe(404);
    }

    previousImage = image ?? '';
  }

  await context.close();
});
