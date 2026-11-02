import { test, expect } from '@playwright/test';
import type { Browser, Page, TestInfo } from '@playwright/test';
import { apiCreate, apiMeeting, login, writeHeaders } from '@tests/helpers';

const guestPage = async (browser: Browser, page: Page, info: TestInfo) => {
  const context = await browser.newContext({
    ...info.project.use,
    baseURL: new URL(page.url()).origin,
    ignoreHTTPSErrors: true,
  });
  const guest = await context.newPage();
  await login(guest, 'Лена');
  return { guest, context };
};

const reschedule = async (page: Page, id: string, timed: boolean) => {
  const current = await apiMeeting(page, id);
  const day = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const response = await page.request.patch(`/api/v1/meetings/${id}`, {
    headers: await writeHeaders(page),
    data: {
      expected_revision: current.revision,
      starts_at: timed ? new Date(Date.now() + 1800000).toISOString() : null,
      starts_on: timed ? new Date().toISOString().slice(0, 10) : day,
      timezone: 'UTC',
    },
  });
  expect(response.status()).toBe(200);
};

test('open tab crosses cutoff by timer and foreground clock refresh without hiding details', async ({ page, browser }, info) => {
  await login(page, 'Саша');
  const start = Date.now() + 3605000;
  const created = await apiCreate(page, 'Открытая вкладка отсечки', new Date(start + 10800000).toISOString().replace('Z', '+03:00'));
  const { guest, context } = await guestPage(browser, page, info);
  try {
    await guest.clock.install({ time: start - 3605000 });
    await guest.goto(new URL(created.invitation_url).pathname);
    const going = guest.getByRole('button', { name: 'Приду', exact: true });
    await expect(going).toBeEnabled();
    await guest.clock.fastForward(6000);
    await expect(going).toBeDisabled();
    await expect(guest.getByRole('heading', { name: 'Открытая вкладка отсечки', exact: true })).toBeVisible();
    await expect(guest.getByRole('button', { name: 'Возможно', exact: true })).toBeEnabled();
    await guest.clock.setSystemTime(start - 3660000);
    await guest.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(going).toBeEnabled();
    await guest.clock.setSystemTime(start - 3590000);
    await guest.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect(going).toBeDisabled();
    await guest.screenshot({ path: info.outputPath('clock-closed.png') });
  } finally {
    await context.close();
  }
});

test('stale invitation is rejected by real server, refreshed and remains readable', async ({ page, browser }, info) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Устаревшее приглашение');
  const { guest, context } = await guestPage(browser, page, info);
  try {
    await guest.goto(new URL(created.invitation_url).pathname);
    const going = guest.getByRole('button', { name: 'Приду', exact: true });
    await expect(going).toBeEnabled();
    await reschedule(page, created.meeting.id, true);
    const rejected = guest.waitForResponse(response => response.url().endsWith('/rsvp') && response.request().method() === 'PUT');
    await going.click();
    const response = await rejected;
    expect(response.status()).toBe(409);
    expect((await response.json()).error.code).toBe('join_closed');
    await expect(going).toBeDisabled();
    await expect(guest.getByRole('heading', { name: 'Устаревшее приглашение', exact: true })).toBeVisible();
    await expect(guest.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
    await expect(guest.getByText('Участие закрыто за час до начала встречи.').first()).toBeVisible();
    await page.goto(`/meetings/${created.meeting.id}`);
    await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
    await guest.screenshot({ path: info.outputPath('stale-closed.png') });
  } finally {
    await context.close();
  }
});

test('date-only stays joinable; current member retains chat; returning after refusal is closed', async ({ page, browser }, info) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Дата без времени и возврат');
  await reschedule(page, created.meeting.id, false);
  const { guest, context } = await guestPage(browser, page, info);
  try {
    const invitation = new URL(created.invitation_url).pathname;
    await guest.goto(invitation);
    await expect(guest.getByRole('button', { name: 'Приду', exact: true })).toBeEnabled();
    await guest.getByRole('button', { name: 'Приду', exact: true }).click();
    await guest.getByRole('link', { name: 'Открыть встречу', exact: true }).click();
    await expect(guest.getByLabel('Сообщение', { exact: true })).toBeVisible();
    await reschedule(page, created.meeting.id, true);
    await guest.reload();
    await expect(guest.getByLabel('Сообщение', { exact: true })).toBeVisible();
    const details = await apiMeeting(guest, created.meeting.id);
    const left = await guest.request.put(`/api/v1/meetings/${created.meeting.id}/rsvp`, {
      headers: await writeHeaders(guest),
      data: { answer: 'not_going', expected_revision: details.my_rsvp_revision },
    });
    expect(left.status()).toBe(200);
    const revision = (await left.json()).rsvp_revision;
    await guest.goto(invitation);
    await expect(guest.getByRole('button', { name: 'Приду', exact: true })).toBeDisabled();
    const retry = await guest.request.put(`/api/v1/invitations/${invitation.split('/').at(-1)}/rsvp`, {
      headers: await writeHeaders(guest),
      data: { answer: 'going', expected_revision: revision },
    });
    expect(retry.status()).toBe(409);
    expect((await retry.json()).error.code).toBe('join_closed');
    await guest.screenshot({ path: info.outputPath('return-closed.png') });
  } finally {
    await context.close();
  }
});
