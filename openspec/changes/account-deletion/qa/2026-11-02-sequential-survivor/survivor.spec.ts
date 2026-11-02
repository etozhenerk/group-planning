import { test, expect } from '@playwright/test';
import { randomBytes, randomUUID } from 'node:crypto';
import { apiCreate, apiMeeting, login, writeHeaders } from '@tests/helpers';

test('survivor retains shared meeting, transferred organization and anonymous history after real deletion', async ({ page, browser }, info) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Сохранённая общая встреча');
  const id = created.meeting.id;
  const context = await browser.newContext({ ...info.project.use, baseURL: new URL(page.url()).origin, ignoreHTTPSErrors: true });
  const survivor = await context.newPage();
  try {
    await login(survivor, 'Лена');
    await survivor.goto(new URL(created.invitation_url).pathname);
    await survivor.getByRole('button', { name: 'Приду', exact: true }).click();
    await survivor.getByRole('link', { name: 'Открыть встречу', exact: true }).click();
    const text = 'История остаётся участникам';
    const key = randomUUID();
    const posted = await page.request.post(`/api/v1/meetings/${id}/messages`, {
      headers: await writeHeaders(page, key),
      data: { text, client_request_id: key },
    });
    expect(posted.status()).toBe(201);
    const message = survivor.getByTestId('feed-message').filter({ hasText: text });
    await expect(message).toContainText('Саша');
    const removed = await page.request.delete('/api/v1/me', {
      headers: { ...await writeHeaders(page), 'X-Deletion-Token': randomBytes(32).toString('base64url') },
    });
    expect(removed.status()).toBe(204);
    await expect(message).toContainText('Удалённый аккаунт', { timeout: 15000 });
    await expect(message).not.toContainText('Саша');
    const me = await (await survivor.request.get('/api/v1/me')).json();
    const details = await apiMeeting(survivor, id);
    expect(details.organizer_id).toBe(me.user.id);
    expect(details.participant_count).toBe(1);
    const input = survivor.getByLabel('Сообщение', { exact: true });
    await input.fill('После передачи организации');
    await survivor.getByRole('button', { name: 'Отправить сообщение', exact: true }).click();
    await expect(survivor.getByTestId('feed-message').filter({ hasText: 'После передачи организации' })).toHaveAttribute('data-delivery', 'accepted');
    await survivor.reload();
    await expect(message).toContainText('Удалённый аккаунт');
    await expect(input).toBeVisible();
    await survivor.screenshot({ path: info.outputPath('survivor-history.png') });
  } finally {
    await context.close();
  }
});
