import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

for (const mode of ['404', 'disabled'] as const) {
  test(`current client capabilities ${mode} keeps one legacy path and no read UI`, async ({ page }) => {
    const network: { method: string; path: string }[] = [];
    let sockets = 0;
    let capabilityResponses = 0;
    page.on('websocket', () => { sockets += 1; });
    page.on('request', (request) => {
      const path = new URL(request.url()).pathname;
      if (path.startsWith('/api/')) network.push({ method: request.method(), path });
    });
    await page.route('**/api/v1/chat-capabilities', async (route) => {
      capabilityResponses += 1;
      if (mode === '404') {
        await route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not found' });
      } else {
        const response = await route.fetch();
        expect(response.status()).toBe(200);
        expect(await response.json()).toMatchObject({ sync: false, realtime: false, read_state: false });
        await route.fulfill({ response });
      }
    });
    await page.goto('/meetings');
    await page.getByRole('button', { name: 'Войти через Яндекс ID' }).click();
    await page.getByRole('link', { name: 'Войти как Саша' }).click();
    await expect(page).toHaveURL(/\/meetings$/);
    const me = await (await page.request.get('/api/v1/me')).json();
    const created = await page.request.post('/api/v1/meetings', {
      headers: { Origin: 'https://127.0.0.1:8492', 'X-CSRF-Token': me.csrf_token, 'Idempotency-Key': randomUUID() },
      data: { title: `Synthetic capabilities ${mode}`, starts_at: '2099-10-24T19:00:00+03:00', timezone: 'Europe/Moscow' },
    });
    expect(created.status()).toBe(201);
    const meeting = (await created.json()).meeting;
    const base = `/api/v1/meetings/${meeting.id}`;
    await page.goto(`/meetings/${meeting.id}`);
    const input = page.getByLabel('Сообщение', { exact: true });
    await expect(input).toBeVisible();
    await expect.poll(() => network.filter((item) => item.path === `${base}/feed`).length).toBeGreaterThan(0);
    let releaseFeed = () => {};
    const feedGate = new Promise<void>((resolve) => { releaseFeed = resolve; });
    let holdFeed = true;
    await page.route(`**${base}/feed?*`, async (route) => {
      if (holdFeed) await feedGate;
      await route.continue();
    });
    const writes: { key: string | undefined; intent: string; id: string; sequence: string; status: number }[] = [];
    await page.route(`**${base}/messages`, async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      writes.push({ key: route.request().headers()['idempotency-key'], intent: route.request().postDataJSON().client_request_id, id: body.id, sequence: body.sequence, status: response.status() });
      if (writes.length === 1) await route.abort('connectionreset');
      else await route.fulfill({ response });
    });
    try {
      const text = `Synthetic lost ACK ${mode}`;
      await input.fill(text);
      await page.getByRole('button', { name: 'Отправить сообщение' }).click();
      await expect.poll(() => writes.length, { timeout: 15_000 }).toBe(2);
      expect(writes[0].status).toBe(201);
      expect(writes[1]).toEqual(writes[0]);
      expect(writes[0].key).toBeTruthy();
      expect(writes[0].intent).toBe(writes[0].key);
      holdFeed = false;
      releaseFeed();
      const row = page.getByTestId('feed-message').filter({ hasText: text });
      await expect(row).toHaveCount(1);
      await expect(row).toHaveAttribute('data-delivery', 'accepted');
      const feedResponse = await page.request.get(`${base}/feed?limit=50`);
      expect(feedResponse.status()).toBe(200);
      const feed = await feedResponse.json();
      const messages = feed.entries.filter((entry: { kind: string }) => entry.kind === 'message');
      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({ id: writes[0].id, sequence: writes[0].sequence, client_request_id: writes[0].intent });
      await row.getByTestId('message-actions').press('Enter');
      await expect(page.getByRole('button', { name: 'Кто прочитал', exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /^Прочитали/ })).toHaveCount(0);
      await expect(page.getByTestId('readers-viewport')).toHaveCount(0);
      await page.screenshot({ path: test.info().outputPath(`capabilities-${mode}-no-read-ui.png`) });
      await page.keyboard.press('Escape');
      await page.reload();
      await expect(page.getByTestId('feed-message').filter({ hasText: text })).toHaveAttribute('data-delivery', 'accepted');
      expect(capabilityResponses).toBeGreaterThan(0);
      expect(sockets).toBe(0);
      expect(network.filter((item) => /\/(sync|realtime|read-marker|read-receipts|readers)(\/|$)/.test(item.path))).toEqual([]);
      await test.info().attach('actual-actions', { body: JSON.stringify({ mode, meeting: meeting.id, capabilityResponses, writes, sockets, network, cleanup: 'own browser context closed by runner; complete owned memory fixture destroyed on exit' }, null, 2), contentType: 'application/json' });
    } finally {
      holdFeed = false;
      releaseFeed();
    }
  });
}
