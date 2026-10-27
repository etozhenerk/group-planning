import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { createdSchema, mediaResultSchema } from '@/shared/api';
import {
  actionSurface,
  apiCreate,
  apiMeeting,
  login,
  setDate,
  writeHeaders,
} from '@tests/helpers';

const assets = path.resolve('../../openspec/changes/meeting-experience-refresh/assets');
const output = '/tmp/somewhere-web-design';

test('approved HTML and implemented screens at four widths', async ({
  page,
  context,
}) => {
  test.skip(
    process.env.SOMEWHERE_BROWSER_DESIGN === '1',
    'Shared fixture has a separate comparison',
  );
  await mkdir(output, { recursive: true });
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await login(page, 'Саша');

  for (const [title, date, place, file] of [
    ['Суббота без спешки', '2099-10-24', 'Лофт «Квартал»', 'friends.png'],
    ['Настолки у Лены', '2099-10-27', 'У Лены дома', 'boardgame.png'],
    ['Ужин в пятницу', '2099-10-23', 'Кафе «Соседи»', 'dinner.png'],
  ]) {
    const response = await page.request.post('/api/v1/meetings', {
      headers: await writeHeaders(page),
      data: {
        title,
        starts_on: date,
        timezone: 'Europe/Moscow',
        place,
        cover: {
          media_type: 'image/png',
          data: (await readFile(path.join(assets, file ?? ''))).toString('base64'),
        },
      },
    });

    expect(response.status()).toBe(201);
    createdSchema.parse(await response.json());
  }

  const album = await apiCreate(page, 'Суббота без спешки');
  const id = album.meeting.id;
  const changed = await page.request.patch(`/api/v1/meetings/${id}`, {
    headers: await writeHeaders(page),
    data: {
      expected_revision: album.meeting.revision,
      starts_at: null,
      starts_on: '2026-10-24',
      timezone: 'Europe/Moscow',
      place: 'Лофт «Квартал»',
    },
  });

  expect(changed.status()).toBe(200);
  await expect.poll(async () => (await apiMeeting(page, id)).period).toBe('past');

  for (const file of ['friends.png', 'dinner.png', 'boardgame.png']) {
    const bytes = await readFile(path.join(assets, file));
    const reserved = await page.request.post(`/api/v1/meetings/${id}/media/uploads`, {
      headers: await writeHeaders(page),
      data: {
        client_request_id: crypto.randomUUID(),
        file_name: file,
        content_type: 'image/png',
        size_bytes: bytes.length,
        purpose: 'memory',
      },
    });

    expect(reserved.status()).toBe(201);
    const media = mediaResultSchema.parse(await reserved.json()).media;
    const uploaded = await page.request.put(
      `/api/v1/meetings/${id}/media/${media.id}/content`,
      {
        headers: { ...(await writeHeaders(page)), 'Content-Type': 'image/png' },
        data: bytes,
      },
    );

    expect(uploaded.status()).toBe(200);
    const published = await page.request.post(
      `/api/v1/meetings/${id}/media/${media.id}/publish`,
      { headers: await writeHeaders(page), data: {} },
    );

    expect(published.status()).toBe(200);
  }

  const fresh = await apiCreate(page, 'Ужин в пятницу');
  const conversation = await apiCreate(page, 'Ужин в пятницу');
  const messageKey = crypto.randomUUID();
  const message = await page.request.post(
    `/api/v1/meetings/${conversation.meeting.id}/messages`,
    {
      headers: { ...(await writeHeaders(page)), 'Idempotency-Key': messageKey },
      data: { text: 'Принесу настолки!', client_request_id: messageKey },
    },
  );

  expect(message.status()).toBe(201);
  const freshChanged = await page.request.patch(`/api/v1/meetings/${fresh.meeting.id}`, {
    headers: await writeHeaders(page),
    data: {
      expected_revision: fresh.meeting.revision,
      place: 'У Саши дома',
      cover: {
        media_type: 'image/png',
        data: (await readFile(path.join(assets, 'boardgame.png'))).toString('base64'),
      },
    },
  });

  expect(freshChanged.status()).toBe(200);
  await page.evaluate(() =>
    localStorage.setItem(
      'somewhere-recent-emoji',
      JSON.stringify(['❤️', '👍', '😂', '🔥', '🎉', '🙂', '🙌']),
    ),
  );
  const reference = await context.newPage();
  await reference.route('**/__design/**', async (route) => {
    const file = new URL(route.request().url()).pathname.split('/__design/')[1] ?? '';
    const contentType = file.endsWith('.css')
      ? 'text/css'
      : file.endsWith('.js')
        ? 'application/javascript'
        : file.endsWith('.png')
          ? 'image/png'
          : file.endsWith('.svg')
            ? 'image/svg+xml'
            : 'text/html';

    await route.fulfill({ body: await readFile(path.join(assets, file)), contentType });
  });

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await reference.setViewportSize({ width, height: 1000 });

    for (const [name, actual, expected] of [
      ['list', '/meetings?view=list&period=upcoming', 'list.html'],
      [
        'calendar',
        '/meetings?view=calendar&period=upcoming&upcoming=2099-10-24',
        'calendar.html',
      ],
      ['invitations', '/invitations', 'invitations-empty.html'],
      ['profile', '/profile', 'profile-personal.html'],
      ['create', '/meetings/new', 'create.html'],
      ['support', '/support', 'report.html'],
      ['about', '/about', 'about.html'],
      ['help', '/help', 'help.html'],
      ['privacy', '/privacy', 'privacy.html'],
      ['cookies', '/cookies', 'cookies.html'],
      ['album', `/meetings/${id}/memories`, 'album.html'],
      ['memories-banner', `/meetings/${id}`, 'memories-prompt.html'],
      ['chat', `/meetings/${fresh.meeting.id}`, 'created-chat.html'],
    ]) {
      await page.goto(actual ?? '/');
      await expect(page.locator('main')).toBeVisible();

      if (name === 'create') {
        await page.getByLabel('Название', { exact: true }).fill('Ужин в пятницу');
        await setDate(page, '30.10.2099');
        await page.getByRole('textbox', { name: 'Время', exact: true }).fill('20:00');
        await page.getByLabel('Место', { exact: true }).fill('Кафе «Соседи»');
        await page.getByRole('heading', { name: 'Новая встреча' }).click();
      }

      await expect(page.locator('[aria-busy="true"]:visible')).toHaveCount(0);
      expect(runtimeErrors).toEqual([]);
      await expect(
        page.getByRole('heading', { name: 'Не удалось открыть страницу' }),
      ).toHaveCount(0);
      await expect
        .poll(() =>
          page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        )
        .toBe(true);
      await page.screenshot({
        path: `${output}/${name}-${width}-actual.png`,
        fullPage: true,
        animations: 'disabled',
      });
      await reference.goto(`/__design/${expected}`);

      await reference.screenshot({
        path: `${output}/${name}-${width}-reference.png`,
        fullPage: true,
        animations: 'disabled',
      });
    }

    if (width < 740) {
      await page
        .getByRole('button', { name: 'Информация о встрече', exact: true })
        .click();
    }

    await page
      .getByRole('button', { name: 'Пригласить друзей', exact: true })
      .first()
      .click();
    await expect(page.getByLabel('Ссылка приглашения')).toBeVisible();
    await page.screenshot({
      path: `${output}/share-${width}-actual.png`,
      animations: 'disabled',
    });
    await reference.goto('/__design/share.html');
    await reference.screenshot({
      path: `${output}/share-${width}-reference.png`,
      animations: 'disabled',
    });
    await page.keyboard.press('Escape');

    if (width < 740) {
      await expect(page.getByLabel('Ссылка приглашения')).not.toBeVisible();
      await expect(page.getByRole('dialog', { name: fresh.meeting.title })).toBeVisible();
      await page.keyboard.press('Escape');
    }

    await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Добавить к встрече', exact: true }).click();
    await page.screenshot({
      path: `${output}/menu-${width}-actual.png`,
      animations: 'disabled',
    });
    await reference.goto('/__design/chat-menu.html');
    await reference.screenshot({
      path: `${output}/menu-${width}-reference.png`,
      animations: 'disabled',
    });
    await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
    await page.screenshot({
      path: `${output}/emoji-${width}-actual.png`,
      animations: 'disabled',
    });
    await reference.goto('/__design/chat-emoji.html');
    await reference.screenshot({
      path: `${output}/emoji-${width}-reference.png`,
      animations: 'disabled',
    });

    await page.keyboard.press('Escape');

    for (const [kind, label] of [
      ['date', 'Предложить дату'],
      ['place', 'Предложить место'],
      ['task', 'Предложить задачу'],
    ] as const) {
      await page.getByRole('button', { name: 'Добавить к встрече' }).click();
      await page.getByRole('menuitem', { name: label, exact: true }).click();
      const action = actionSurface(page, label);
      await expect(action).toBeVisible();

      if (kind === 'task') {
        await action.getByLabel('Что сделать').fill('Заказать пиццу');
      }

      if (kind === 'place') {
        await action.getByLabel('Новое место').fill('Кафе «Соседи»');
        await action.getByLabel('Почему здесь').fill('Там тихо и есть большой стол.');
      }

      await action.getByRole('heading').click();
      await page.screenshot({
        path: `${output}/action-${kind}-${width}-actual.png`,
        fullPage: true,
        animations: 'disabled',
      });
      await reference.goto(
        `/__design/revisions/2026-10-27-telegram-chat/chat.html?view=${kind}`,
      );
      await reference.screenshot({
        path: `${output}/action-${kind}-${width}-reference.png`,
        fullPage: true,
        animations: 'disabled',
      });
      await action
        .getByRole('button', { name: width < 740 ? 'Закрыть' : 'Назад', exact: true })
        .click();
      await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
    }

    if (width === 390 || width === 1440) {
      const capture = async (name: string, expected: string) => {
        await page.screenshot({
          path: `${output}/${name}-${width}-actual.png`,
          animations: 'disabled',
        });
        await reference.goto(`/__design/${expected}`);
        await reference.screenshot({
          path: `${output}/${name}-${width}-reference.png`,
          animations: 'disabled',
        });
      };

      await page.goto(`/meetings/${conversation.meeting.id}`);
      const row = page
        .getByTestId('feed-message')
        .filter({ hasText: 'Принесу настолки!' });

      await expect(row).toBeVisible();
      await capture('chat-filled', 'chat.html');
      await row.getByTestId('message-actions').press('Enter');
      await expect(
        page.getByRole('dialog', { name: 'Реакция', exact: true }),
      ).toBeVisible();
      await capture(
        'reactions',
        'revisions/2026-10-27-telegram-chat/chat.html?view=quick',
      );
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Добавить к встрече' }).click();
      const chooser = page.waitForEvent('filechooser');
      await page.getByRole('menuitem', { name: 'Фото', exact: true }).click();
      await (
        await chooser
      ).setFiles([path.join(assets, 'boardgame.png'), path.join(assets, 'dinner.png')]);
      await expect(
        page.getByRole('heading', { name: 'Отправить фото', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('navigation', { name: 'Основная навигация' }),
      ).toBeVisible({ visible: width >= 740 });
      await expect(
        page.getByText('Демостенд · данные хранятся до перезапуска', { exact: true }),
      ).toBeVisible();
      await capture('upload', 'upload.html');
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Добавить к встрече' }).click();
      const documentChooser = page.waitForEvent('filechooser');
      await page.getByRole('menuitem', { name: 'Файл', exact: true }).click();
      await (
        await documentChooser
      ).setFiles({
        name: 'Правила игры.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(2_516_573)]),
      });
      await expect(page.getByLabel('Подпись к Правила игры.pdf')).toBeVisible();
      await capture('upload-file', 'upload-file.html');
      await page.keyboard.press('Escape');
      await page.goto(`/meetings/${id}/memories`);
      await page.getByRole('button', { name: 'Показать сеткой' }).click();
      await capture('album-grid', 'album-grid.html');
      await page.getByRole('button', { name: 'Открыть фото 1' }).click();
      await expect(
        page.getByRole('dialog', { name: 'Фото встречи', exact: true }),
      ).toBeVisible();
      await capture('photo', 'photo-1.html');
      await page.keyboard.press('Escape');
    }
  }
});

test('shared native design fixture matches the populated chat', async ({
  page,
  context,
}) => {
  test.skip(
    process.env.SOMEWHERE_BROWSER_DESIGN !== '1',
    'Requires opt-in shared design fixture',
  );
  await mkdir(output, { recursive: true });
  await login(page, 'Саша');
  const reference = await context.newPage();
  await reference.route('**/__design/**', async (route) => {
    const file = new URL(route.request().url()).pathname.split('/__design/')[1] ?? '';
    await route.fulfill({
      body: await readFile(path.join(assets, file)),
      contentType: file.endsWith('.css')
        ? 'text/css'
        : file.endsWith('.js')
          ? 'application/javascript'
          : file.endsWith('.png')
            ? 'image/png'
            : file.endsWith('.svg')
              ? 'image/svg+xml'
              : 'text/html',
    });
  });

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await reference.setViewportSize({ width, height: 1000 });
    await page.goto('/meetings/deb00000-0000-4000-8000-000000000002');
    await expect(page.getByText('Исполняет Миша', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '❤️: 2' })).toBeVisible();
    await page.mouse.move(0, 0);
    const capture = async (name: string, html: string) => {
      await page.screenshot({
        path: `${output}/${name}-${width}-actual.png`,
        animations: 'disabled',
      });
      await reference.goto(`/__design/${html}`);
      await reference.screenshot({
        path: `${output}/${name}-${width}-reference.png`,
        animations: 'disabled',
      });
    };

    await capture('chat-filled', 'chat.html');
    await page.getByRole('button', { name: 'Добавить к встрече' }).click();
    await capture('menu', 'chat-menu.html');
    await page.keyboard.press('Escape');
    const message = page
      .getByTestId('feed-message')
      .filter({ hasText: 'Я принесу настолки. Во что будем играть?' });

    await message.getByTestId('message-actions').press('Enter');
    await capture('reactions', 'revisions/2026-10-27-telegram-chat/chat.html?view=quick');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Выбрать эмодзи' }).click();
    await capture('emoji', 'chat-emoji.html');
    await page.goto('/profile');
    await expect(page.getByText('Александр', { exact: true })).toBeVisible();
    await capture('profile-personal', 'profile-personal.html');
    const metrics = async (surface: typeof page) => {
      const result = [];

      for (const target of [
        surface.getByRole('heading', { name: 'Саша', exact: true }),
        surface.getByText('Имя и фото видны участникам встреч', { exact: true }),
        surface.getByText('Личные данные', { exact: true }),
        surface.getByText('sasha@example.com', { exact: true }),
        surface.locator('main section').first(),
      ]) {
        result.push({
          rect: await target.boundingBox(),
          css: await target.evaluate((element) => {
            const style = getComputedStyle(element);

            return {
              fontSize: style.fontSize,
              lineHeight: style.lineHeight,
              fontWeight: style.fontWeight,
              gap: style.gap,
              padding: style.padding,
              margin: style.margin,
            };
          }),
        });
      }

      return result;
    };

    await writeFile(
      `${output}/profile-metrics-${width}.json`,
      JSON.stringify(
        { actual: await metrics(page), reference: await metrics(reference) },
        null,
        2,
      ),
    );
  }
});
