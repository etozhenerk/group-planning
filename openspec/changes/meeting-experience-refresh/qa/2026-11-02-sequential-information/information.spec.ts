import { expect, test } from '@playwright/test';
import { login, writeHeaders } from '@tests/helpers';
import { meetingRoster } from '@tests/helpers/meetingRoster';

test('mixed replies and a real second actor update the compact roster without service links', async ({ page, browser }, testInfo) => {
  await login(page, 'Саша');
  const fixture = await meetingRoster(browser, page);
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/meetings/${fixture.meeting.id}`);
    const composer = page.getByLabel('Сообщение', { exact: true });
    await composer.fill('Черновик под составом');
    const open = page.getByRole('button', { name: 'Информация о встрече', exact: true });
    await open.click();
    const info = page.getByRole('dialog', { name: fixture.meeting.title, exact: true });
    const summary = info.getByRole('button', { name: 'Все участники встречи. Придут: 6', exact: true });
    await expect(summary).toContainText('+3');
    for (const label of ['Помощь', 'Сообщить о проблеме', 'Предложить идею', 'О приложении', 'Политика конфиденциальности', 'Cookie и хранение']) {
      await expect(info.getByText(label, { exact: true })).toHaveCount(0);
    }
    await summary.click();
    const roster = info.getByRole('list', { name: 'Все участники встречи', exact: true });
    await expect(roster.getByRole('listitem')).toHaveCount(8);
    await expect(roster.getByText('Возможно', { exact: true })).toHaveCount(1);
    await expect(roster.getByText('Не смогу', { exact: true })).toHaveCount(1);
    const collapse = info.getByRole('button', { name: 'Свернуть список', exact: true });
    await collapse.click();
    await expect(summary).toBeFocused();
    const detail = await fixture.member.request.get(`/api/v1/meetings/${fixture.meeting.id}`);
    expect(detail.status()).toBe(200);
    const before = await detail.json();
    const changed = await fixture.member.request.put(`/api/v1/meetings/${fixture.meeting.id}/rsvp`, {
      headers: await writeHeaders(fixture.member),
      data: { answer: 'maybe', expected_revision: before.my_rsvp_revision },
    });
    expect(changed.status()).toBe(200);
    await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
    await open.click();
    const updated = info.getByRole('button', { name: 'Все участники встречи. Придут: 5', exact: true });
    await expect(updated).toContainText('+2');
    await updated.press('Enter');
    await expect(collapse).toBeFocused();
    await expect(roster.getByRole('listitem')).toHaveCount(8);
    await expect(roster.getByText('Возможно', { exact: true })).toHaveCount(2);
    await expect(roster.getByText('Не смогу', { exact: true })).toHaveCount(1);
    await page.screenshot({ path: testInfo.outputPath('mixed-roster-updated.png') });
    await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
    await expect(open).toBeFocused();
    await expect(composer).toHaveValue('Черновик под составом');
  } finally {
    await fixture.close();
  }
});
