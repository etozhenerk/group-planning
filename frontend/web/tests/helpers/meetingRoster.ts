import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Browser, BrowserContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { createdSchema, participantsSchema } from '@/shared/api';
import { writeHeaders } from '@tests/helpers';

export const meetingRoster = async (browser: Browser, organizer: Page) => {
  const cover = await readFile(
    path.resolve(
      '../../openspec/changes/meeting-experience-refresh/assets/boardgame.png',
    ),
  );

  const created = await organizer.request.post('/api/v1/meetings', {
    headers: await writeHeaders(organizer),
    data: {
      title: 'Состав встречи',
      starts_at: '2099-10-24T19:00:00+03:00',
      timezone: 'Europe/Moscow',
      place: 'У Саши дома',
      cover: { media_type: 'image/png', data: cover.toString('base64') },
    },
  });

  expect(created.status()).toBe(201);
  const result = createdSchema.parse(await created.json());
  const contexts: BrowserContext[] = [];
  let member: Page | undefined;

  try {
    for (const [name, answer] of [
      ['Лена', 'Приду'],
      ['Миша', 'Приду'],
      ['Аня', 'Приду'],
      ['Дима', 'Приду'],
      ['Катя', 'Приду'],
      ['Олег', 'Возможно'],
      ['Ира', 'Не смогу'],
    ] as const) {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      contexts.push(context);
      const page = await context.newPage();
      await page.goto(result.invitation_url);
      await page.getByRole('button', { name: 'Войти и ответить', exact: true }).click();
      await page.getByRole('link', { name: `Войти как ${name}`, exact: true }).click();
      await page.getByRole('button', { name: answer, exact: true }).click();
      await expect(page.getByRole('status')).toContainText(`Вы ответили «${answer}»`);

      if (name === 'Лена') {
        member = page;
      }
    }

    if (!member) {
      throw new Error('Member context was not created');
    }

    const response = await organizer.request.get(
      `/api/v1/meetings/${result.meeting.id}/participants`,
    );

    expect(response.status()).toBe(200);
    const { participants } = participantsSchema.parse(await response.json());
    expect(participants).toHaveLength(8);

    return {
      ...result,
      member,
      participants,
      close: () => Promise.all(contexts.map((context) => context.close())),
    };
  } catch (error) {
    await Promise.all(contexts.map((context) => context.close()));
    throw error;
  }
};
