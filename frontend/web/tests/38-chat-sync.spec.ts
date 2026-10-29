import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { apiCreate, login, writeHeaders } from '@tests/helpers';
import type { Centrifuge } from 'centrifuge';
import { chatChangesSchema } from '@/entities/meeting/model/chatSchema';
import { postMessage } from '@tests/helpers/readChat';
import { realtimeFault } from '@tests/helpers/realtimeFault';

test.beforeEach(async ({ page }) => {
  await login(page, 'Саша');
  const response = await page.request.get('/api/v1/chat-capabilities');
  const capabilities: unknown = await response.json();
  expect(capabilities).toMatchObject({ sync: true, realtime: true, read_state: false });
});

test('real SDK snapshot-subscribe catch-up closes the gap and healthy idle has no HTTP polling', async ({
  page,
}) => {
  const { meeting } = await apiCreate(page, 'Гонка подписки');
  const headers = await writeHeaders(page);
  const key = randomUUID();
  let injected = false;
  await page.route(
    `**/meetings/${meeting.id}/sync?limit=50`,
    async (route) => {
      const snapshot = await route.fetch();
      const response = await page.request.post(
        `/api/v1/meetings/${meeting.id}/messages`,
        {
          headers: { ...headers, 'Idempotency-Key': key },
          data: { text: 'Между snapshot и subscribe', client_request_id: key },
        },
      );

      expect(response.status()).toBe(201);
      injected = true;
      await route.fulfill({ response: snapshot });
    },
    { times: 1 },
  );
  let connected = false;
  const frames: string[] = [];
  page.on('websocket', (socket) => {
    connected = true;
    socket.on('framesent', ({ payload }) => frames.push(String(payload)));
  });
  await page.goto(`/meetings/${meeting.id}`);
  await expect(
    page.getByTestId('feed-message').filter({ hasText: 'Между snapshot и subscribe' }),
  ).toHaveAttribute('data-delivery', 'accepted');
  expect(injected).toBe(true);
  expect(connected).toBe(true);
  expect(frames.some((frame) => frame.includes(`meeting:${meeting.id}`))).toBe(true);
  // Let the publication hint already in flight coalesce with the subscribe catch-up.
  await page.waitForTimeout(500);
  const requests: string[] = [];
  page.on('request', (request) => {
    if (
      request.method() === 'GET' &&
      /\/(feed|sync|reactions|date-polls|place-polls|preparation-tasks)(\?|\/)/.test(
        request.url(),
      )
    ) {
      requests.push(request.url());
    }
  });
  await page.waitForTimeout(13_500);
  expect(requests).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('healthy-sync.png') });
});

test('pending and canonical ACK retain the same mounted timeline row', async ({
  page,
}) => {
  const { meeting } = await apiCreate(page, 'Одна строка');
  await page.goto(`/meetings/${meeting.id}`);
  const gate: { release?: () => void } = {};
  await page.route(
    `**/meetings/${meeting.id}/messages`,
    async (route) => {
      await new Promise<void>((resolve) => {
        gate.release = resolve;
      });
      await route.continue();
    },
    { times: 1 },
  );
  await page.getByLabel('Сообщение', { exact: true }).fill('Строка без перемонтирования');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  const row = page
    .getByTestId('feed-message')
    .filter({ hasText: 'Строка без перемонтирования' });

  await expect(row).toHaveAttribute('data-delivery', /queued|sending/);
  await row.evaluate((element) => {
    element.setAttribute('data-mounted-before-ack', 'yes');
  });
  await expect.poll(() => !!gate.release).toBe(true);
  gate.release?.();
  await expect(row).toHaveAttribute('data-delivery', 'accepted');
  await expect(row).toHaveAttribute('data-mounted-before-ack', 'yes');
  await expect(row).toHaveCount(1);
});

test('pinned JS 5.8.0 accepts cookie auth with both undefined and empty connect data', async ({
  page,
}) => {
  const { meeting } = await apiCreate(page, 'SDK cookie probe');
  await page.goto('/profile');
  await page.addScriptTag({
    path: path.resolve('../../node_modules/centrifuge/dist/centrifuge.js'),
  });
  const result = await page.evaluate(async (meetingID) => {
    const sdk = window as Window & { Centrifuge?: typeof Centrifuge };
    const Client = sdk.Centrifuge;

    if (!Client) {
      throw new Error('SDK missing');
    }

    const results: { data: string; subscribed: boolean }[] = [];

    for (const empty of [false, true]) {
      await new Promise<void>((resolve, reject) => {
        const client = new Client(`wss://${location.host}/api/v1/realtime`, {
          getData: () => Promise.resolve(empty ? {} : undefined),
        });

        const sub = client.newSubscription(`meeting:${meetingID}`);
        const timeout = setTimeout(() => {
          client.disconnect();
          reject(new Error('SDK probe timed out'));
        }, 8_000);

        sub.on('subscribed', () => {
          clearTimeout(timeout);
          results.push({ data: empty ? '{}' : 'undefined', subscribed: true });
          client.disconnect();
          resolve();
        });
        sub.on('error', ({ error }) => {
          clearTimeout(timeout);
          client.disconnect();
          reject(new Error(`Subscribe error ${error.code}`));
        });
        sub.subscribe();
        client.connect();
      });
    }

    return results;
  }, meeting.id);

  expect(result).toEqual([
    { data: 'undefined', subscribed: true },
    { data: '{}', subscribed: true },
  ]);
  await test.info().attach('sdk-cookie-probe', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  });
});

test('transport reconnect performs cursor catch-up and terminal auth stops SDK retries', async ({
  page,
}) => {
  const { meeting } = await apiCreate(page, 'Возвращение транспорта');
  const headers = await writeHeaders(page);
  const fault = await realtimeFault(page);
  const cursorResponse = () =>
    page.waitForResponse((response) => {
      const url = new URL(response.url());

      return (
        url.pathname === `/api/v1/meetings/${meeting.id}/sync` &&
        url.searchParams.has('cursor') &&
        response.request().method() === 'GET'
      );
    });

  const initialCatchUp = cursorResponse();
  await page.goto(`/meetings/${meeting.id}`);
  await expect.poll(() => fault.connections[0]?.subscribed).toBe(true);
  expect((await initialCatchUp).status()).toBe(200);
  fault.hold();
  await fault.disconnect(fault.connections[0]!);
  const text = 'Пришло во время отключения';
  const entry = await postMessage(page, meeting.id, headers, text);
  const message = page.getByTestId('feed-message').filter({ hasText: text });
  await expect(message).toHaveCount(0);
  const recovered = cursorResponse();
  fault.resume();
  await expect.poll(() => fault.connections.length).toBeGreaterThan(1);
  await expect
    .poll(() => fault.connections.slice(1).some((connection) => connection.subscribed))
    .toBe(true);
  const response = await recovered;
  expect(response.status()).toBe(200);
  const changes = chatChangesSchema.parse(await response.json());
  expect(
    changes.changes.some(
      (change) => change.kind === 'entry_upsert' && change.entry_id === entry.id,
    ),
  ).toBe(true);
  await expect(message).toHaveAttribute('data-delivery', 'accepted');
  await expect(message).toHaveCount(1);
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'unauthorized' } }),
    }),
  );
  const before = fault.connections.length;
  await fault.disconnect(fault.connections.at(-1)!);
  await expect(page.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
  await page.waitForTimeout(3_500);
  expect(fault.connections.length).toBe(before);
  await test.info().attach('transport-catch-up', {
    body: JSON.stringify({ connections: before, recoveredEntry: entry.id, changes }),
    contentType: 'application/json',
  });
});

test('online recovery catches up over HTTP and revalidates terminal authentication', async ({
  page,
  context,
}) => {
  const { meeting } = await apiCreate(page, 'Возвращение сети');
  const headers = await writeHeaders(page);
  await page.addInitScript(() => {
    const events: string[] = [];
    Reflect.set(window, '__testNetworkEvents', events);
    window.addEventListener('offline', () => events.push('offline'));
    window.addEventListener('online', () => events.push('online'));
  });
  const events = () =>
    page.evaluate(() => {
      const value: unknown = Reflect.get(window, '__testNetworkEvents');

      return value;
    });

  let connections = 0;
  page.on('websocket', () => {
    connections += 1;
  });
  await page.goto(`/meetings/${meeting.id}`);
  await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
  await context.setOffline(true);
  await expect.poll(events).toEqual(['offline']);
  const text = 'Получено после online';
  await postMessage(page, meeting.id, headers, text);
  const catchUp = page.waitForResponse((response) => {
    const url = new URL(response.url());

    return url.pathname === `/api/v1/meetings/${meeting.id}/sync`;
  });

  await context.setOffline(false);
  await expect.poll(events).toEqual(['offline', 'online']);
  expect((await catchUp).status()).toBe(200);
  await expect(
    page.getByTestId('feed-message').filter({ hasText: text }),
  ).toHaveAttribute('data-delivery', 'accepted');
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'unauthorized' } }),
    }),
  );
  await context.setOffline(true);
  await expect.poll(events).toEqual(['offline', 'online', 'offline']);
  const before = connections;
  await context.setOffline(false);
  await expect.poll(events).toEqual(['offline', 'online', 'offline', 'online']);
  await expect(page.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
  await page.waitForTimeout(3_500);
  expect(connections).toBe(before);
});

test('sustained websocket failure enables bounded HTTP fallback', async ({ page }) => {
  const { meeting } = await apiCreate(page, 'Недоступен WebSocket');
  const headers = await writeHeaders(page);
  await page.routeWebSocket('**/api/v1/realtime', (route) =>
    route.close({ code: 1013, reason: 'controlled fault' }),
  );
  let cursorReads = 0;
  page.on('request', (request) => {
    if (request.url().includes(`/meetings/${meeting.id}/sync?cursor=`)) {
      cursorReads += 1;
    }
  });
  await page.goto(`/meetings/${meeting.id}`);
  await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
  const key = randomUUID();
  const response = await page.request.post(`/api/v1/meetings/${meeting.id}/messages`, {
    headers: { ...headers, 'Idempotency-Key': key },
    data: { text: 'Получено через fallback', client_request_id: key },
  });

  expect(response.status()).toBe(201);
  await expect(
    page.getByTestId('feed-message').filter({ hasText: 'Получено через fallback' }),
  ).toHaveAttribute('data-delivery', 'accepted', { timeout: 20_000 });
  expect(cursorReads).toBe(1);
});
