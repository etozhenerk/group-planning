import { test, expect } from '@playwright/test';
import { chatSnapshotSchema } from '@/entities/meeting/model/chatSchema';
import { readChat, postMessage } from '@tests/helpers/readChat';

test('ten thousand messages open around first unread without walking history and jump to real tail', async ({
  page,
  browser,
}) => {
  test.setTimeout(240_000);
  const { meeting, friend, context, headers, friendHeaders } = await readChat(
    page,
    browser,
    'Десять тысяч сообщений',
  );

  let marker = '0';
  let last = '';

  for (let batch = 0; batch < 1000; batch += 1) {
    const messages = await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        postMessage(page, meeting.id, headers, `Длинная история ${batch * 10 + index}`),
      ),
    );

    const ordered = messages.sort((a, b) =>
      BigInt(a.sequence) < BigInt(b.sequence) ? -1 : 1,
    );

    if (batch === 499) {
      marker = ordered.at(-1)!.sequence;
    }

    if (batch === 999) {
      last = ordered.at(-1)!.id;
    }
  }

  expect(
    (
      await friend.request.put(`/api/v1/meetings/${meeting.id}/read-marker`, {
        headers: friendHeaders,
        data: { read_through_sequence: marker },
      })
    ).status(),
  ).toBe(200);
  const response = await friend.request.get(
    `/api/v1/meetings/${meeting.id}/sync?limit=50`,
  );

  const raw: unknown = await response.json();
  const snapshot = chatSnapshotSchema.parse(raw);
  expect(snapshot.unread_count).toBe('5000');
  expect(snapshot.entries.some((entry) => entry.id === snapshot.first_unread)).toBe(true);
  const historyRequests: string[] = [];
  friend.on('request', (request) => {
    if (/\/(sync|feed)\?/.test(request.url())) {
      historyRequests.push(request.url());
    }
  });
  await friend.bringToFront();
  await friend.goto(`/meetings/${meeting.id}`);
  await expect(friend.getByText('Непрочитанные', { exact: true })).toBeVisible();
  const first = friend.locator(`[data-entry-id="${snapshot.first_unread}"]`);
  await expect(first).toBeVisible();
  const scroll = friend.locator('[data-server-count]');
  expect(Number(await scroll.getAttribute('data-server-count'))).toBeLessThanOrEqual(500);
  expect(await friend.locator('[data-entry-id]').count()).toBeLessThanOrEqual(200);
  expect(historyRequests.length).toBeLessThanOrEqual(6);
  await friend.waitForTimeout(1100);
  await expect(friend.getByText('Непрочитанные', { exact: true })).toBeVisible();
  const opened = await friend.request.get(`/api/v1/meetings/${meeting.id}/sync?limit=50`);
  const currentRaw: unknown = await opened.json();
  const current = chatSnapshotSchema.parse(currentRaw);
  expect(BigInt(current.my_read_state ?? '0')).toBeLessThan(BigInt(marker) + 100n);
  const beforeTail = [...historyRequests];
  await friend.getByRole('button', { name: 'К новым сообщениям', exact: true }).click();
  await expect(friend.locator(`[data-entry-id="${last}"]`)).toBeVisible();
  await expect(
    friend.getByRole('button', { name: 'К новым сообщениям', exact: true }),
  ).toHaveCount(0);
  await test.info().attach('first-unread-window', {
    body: JSON.stringify({
      count: 10000,
      marker,
      firstUnread: snapshot.first_unread,
      openingRequests: beforeTail,
      allRequests: historyRequests,
    }),
    contentType: 'application/json',
  });
  await friend.screenshot({ path: test.info().outputPath('ten-thousand-tail.png') });
  await context.close();
});
