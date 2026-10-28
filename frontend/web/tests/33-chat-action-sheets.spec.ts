import { test, expect } from '@playwright/test';
import { actionSurface, apiCreate, login, writeHeaders } from '@tests/helpers';
import { datePollSchema, placePollSchema } from '@/shared/api';
import { meetingRoster } from '@tests/helpers/meetingRoster';

test('TC-CHAT-INFO-EXPAND: both roles reveal the real roster and retain independent actions', async ({
  page,
  browser,
}) => {
  // Eight real OAuth users plus both roles at four widths share this budget.
  // Keep individual action/assertion timeouts unchanged.
  test.setTimeout(240_000);
  await login(page, 'Саша');
  const fixture = await meetingRoster(browser, page);
  const attending = fixture.participants.filter(
    (person) => person.role === 'organizer' || person.rsvp === 'going',
  );

  expect(attending).toHaveLength(6);

  try {
    for (const [viewer, organizer] of [
      [page, true],
      [fixture.member, false],
    ] as const) {
      for (const width of [320, 390, 768, 1440]) {
        await viewer.setViewportSize({ width, height: 844 });
        await viewer.goto(
          new URL(`/meetings/${fixture.meeting.id}`, fixture.invitation_url).href,
        );
        const composer = viewer.getByLabel('Сообщение', { exact: true });
        await expect(composer).toHaveValue(width === 320 ? '' : 'Черновик под составом');
        await composer.fill('Черновик под составом');
        const open = viewer.getByRole('button', {
          name: 'Информация о встрече',
          exact: true,
        });

        await open.click();
        const info = viewer.getByRole('dialog', {
          name: fixture.meeting.title,
          exact: true,
        });

        const chips = info.getByRole('button', {
          name: 'Все участники встречи. Придут: 6',
          exact: true,
        });

        const roster = info.getByRole('list', {
          name: 'Все участники встречи',
          exact: true,
        });

        const settings = info.getByRole('button', {
          name: width < 740 ? 'Настройки встречи' : 'Изменить настройки',
          exact: true,
        });

        const invite = info.getByRole('button', {
          name: 'Пригласить друзей',
          exact: true,
        });

        const answer = info.getByRole('button', { name: 'Приду', exact: true });
        await expect(chips).toHaveAttribute('aria-expanded', 'false');
        await expect(chips).toContainText(width < 740 ? '+3' : 'ещё 3');
        await expect(roster).toHaveCount(0);
        await expect(info.locator('img')).toHaveCount(0);
        await expect(settings).toHaveCount(organizer ? 1 : 0);
        await expect(invite).toHaveCount(organizer ? 1 : 0);
        await expect(answer).toHaveCount(organizer ? 0 : 1);

        for (const person of attending.slice(0, 3)) {
          await expect(chips).toContainText(person.user.display_name);
        }

        await chips.click();
        await expect(roster.getByRole('listitem')).toHaveCount(8);
        await expect(
          info.getByRole('heading', {
            name: width < 740 ? /^Все ответы\s*8$/ : 'Участники',
            exact: true,
          }),
        ).toBeVisible();
        await expect(roster.getByText('Организатор', { exact: true })).toHaveCount(1);
        await expect(roster.getByText('Возможно', { exact: true })).toHaveCount(1);
        await expect(roster.getByText('Не смогу', { exact: true })).toHaveCount(1);
        const last = roster.getByRole('listitem').last();
        await last.scrollIntoViewIfNeeded();
        await expect(last).toBeInViewport({ ratio: 1 });
        await expect(organizer ? settings : answer).toBeEnabled();
        const collapse = info.getByRole('button', {
          name: width < 740 ? 'Свернуть список' : 'Скрыть состав',
          exact: true,
        });

        await collapse.click();
        await expect(roster).toHaveCount(0);
        await expect(chips).toBeFocused();
        await chips.press('Enter');
        await expect(roster.getByRole('listitem')).toHaveCount(8);
        await expect(collapse).toBeFocused();

        if (organizer) {
          const scroll = info.getByTestId('meeting-info-scroll');
          await invite.scrollIntoViewIfNeeded();
          const position = await scroll.evaluate((element) => element.scrollTop);
          await invite.click();
          const share = actionSurface(viewer, 'Пригласить друзей');

          await expect(share).toHaveAttribute('data-motion', 'open');
          await expect(info).not.toBeVisible();
          await expect(viewer.locator('dialog:modal')).toHaveCount(1);
          await share
            .getByRole('button', {
              name: 'Закрыть',
              exact: true,
            })
            .click();
          await expect(info).toHaveAttribute('data-motion', 'open');
          await expect(invite).toBeFocused();
          await expect(scroll).toHaveJSProperty('scrollTop', position);
          await expect(composer).toHaveValue('Черновик под составом');
        }

        await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
        await expect(info).not.toBeVisible();
        await expect(open).toBeFocused();
        await expect(composer).toHaveValue('Черновик под составом');
      }
    }
  } finally {
    await fixture.close();
  }
});

for (const kind of ['date', 'place'] as const) {
  test(`${kind} poll freezes a committed request after a lost response and retries after reopening`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Опрос без дубликата');
    await page.goto(`/meetings/${meeting.id}`);
    const keys: string[] = [];
    const bodies: string[] = [];
    const ids: string[] = [];
    await page.route(`**/api/v1/meetings/${meeting.id}/${kind}-polls`, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();

        return;
      }

      keys.push(route.request().headers()['idempotency-key'] ?? '');
      bodies.push(route.request().postData() ?? '');
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      const body: unknown = await response.json();
      const poll =
        kind === 'date' ? datePollSchema.parse(body) : placePollSchema.parse(body);

      ids.push(poll.id);

      if (keys.length === 1) {
        await route.abort('failed');
      } else {
        await route.fulfill({ response });
      }
    });
    const title = kind === 'date' ? 'Предложить дату' : 'Предложить место';
    await page.getByRole('button', { name: 'Добавить к встрече' }).click();
    await page.getByRole('menuitem', { name: title, exact: true }).click();
    const sheet = page.getByRole('dialog', {
      name: kind === 'date' ? 'Новая дата встречи' : title,
      exact: true,
    });

    if (kind === 'place') {
      await sheet.getByLabel('Новое место').fill('Кафе у парка');
      await sheet.getByLabel('Почему здесь').fill('Здесь есть большой стол');
    }

    await sheet
      .getByRole('button', {
        name: kind === 'date' ? 'Создать опрос' : 'Предложить место',
        exact: true,
      })
      .click();
    const retry = sheet.getByRole('button', { name: 'Повторить отправку', exact: true });
    await expect(retry).toBeEnabled();
    const form = sheet.locator('form:visible');
    await expect(form).toHaveCount(1);
    const inputs = form.locator('input, textarea, select');
    expect(await inputs.count()).toBeGreaterThan(0);

    for (const input of await inputs.all()) {
      await expect(input).toBeDisabled();
    }

    if (kind === 'date') {
      const dates = form.getByRole('button', { name: /^(Вариант \d+|Дата)$/ });
      await expect(dates).toHaveCount(3);

      for (const date of await dates.all()) {
        await expect(date).toBeDisabled();
      }
    }

    if (kind === 'date') {
      await expect(
        sheet.getByRole('button', { name: 'Добавить дату', exact: true }),
      ).toBeDisabled();
    }

    await sheet.getByRole('button', { name: 'Закрыть', exact: true }).click();
    await page.getByRole('button', { name: 'Добавить к встрече' }).click();
    await page.getByRole('menuitem', { name: title, exact: true }).click();

    for (const input of await inputs.all()) {
      await expect(input).toBeDisabled();
    }

    if (kind === 'date') {
      const dates = form.getByRole('button', { name: /^(Вариант \d+|Дата)$/ });
      await expect(dates).toHaveCount(3);

      for (const date of await dates.all()) {
        await expect(date).toBeDisabled();
      }
    }

    await retry.click();
    await expect(sheet).not.toBeVisible();
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
    expect(bodies[1]).toBe(bodies[0]);
    expect(ids[1]).toBe(ids[0]);
    await expect(
      page.getByRole('region', {
        name: kind === 'date' ? 'Опрос о дате' : 'Опрос о месте',
      }),
    ).toHaveCount(1);
  });
}

test('mobile task sheet preserves an uncertain request across close and resize', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Задача без потери контекста');
  await page.goto(`/meetings/${meeting.id}`);
  await page.getByLabel('Сообщение', { exact: true }).fill('Обсудим после');
  const keys: string[] = [];
  const bodies: string[] = [];
  await page.route(
    `**/api/v1/meetings/${meeting.id}/preparation-tasks`,
    async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();

        return;
      }

      keys.push(route.request().headers()['idempotency-key'] ?? '');
      bodies.push(route.request().postData() ?? '');
      const response = await route.fetch();

      if (keys.length === 1) {
        await route.abort('failed');
      } else {
        await route.fulfill({ response });
      }
    },
  );
  await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  await page.getByRole('menuitem', { name: 'Предложить задачу', exact: true }).click();
  const sheet = actionSurface(page, 'Предложить задачу');
  await expect(page.getByRole('dialog', { name: 'Предложить задачу' })).toBeVisible();
  await expect(page.locator('main#main')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Назад' })).toHaveCount(0);
  await sheet.getByLabel('Что сделать').fill('Принести настолку');
  await sheet.getByRole('button', { name: 'Предложить задачу', exact: true }).click();
  await expect(sheet.getByRole('button', { name: 'Повторить отправку' })).toBeVisible();
  await sheet.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
    'Обсудим после',
  );
  await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  await page.getByRole('menuitem', { name: 'Предложить задачу', exact: true }).click();
  await expect(sheet.getByLabel('Что сделать')).toHaveValue('Принести настолку');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(sheet.getByLabel('Что сделать')).toHaveValue('Принести настолку');
  await expect(sheet.getByRole('button', { name: 'Закрыть', exact: true })).toBeVisible();
  await expect(page.locator('dialog:modal')).toHaveCount(1);
  await sheet.getByRole('button', { name: 'Повторить отправку' }).click();
  await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBeTruthy();
  expect(keys[0]).toBe(keys[1]);
  expect(bodies[0]).toBe(bodies[1]);
  await expect(
    page.getByRole('button', {
      name: 'Подробности задачи «Принести настолку»',
      exact: true,
    }),
  ).toHaveCount(1);
});

test('meeting information shares in one sheet, excludes service links and keeps an edit draft', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await login(page, 'Саша');
  const { meeting, invitation_url } = await apiCreate(page, 'Информация о встрече');
  const changed = await page.request.patch(`/api/v1/meetings/${meeting.id}`, {
    headers: await writeHeaders(page),
    data: {
      expected_revision: meeting.revision,
      description: 'Собираемся вечером, подробности обсудим в чате. '.repeat(30),
    },
  });

  expect(changed.ok()).toBe(true);
  await page.goto(`/meetings/${meeting.id}`);
  await page.getByLabel('Сообщение', { exact: true }).fill('Черновик под сведениями');
  const open = page.getByRole('button', {
    name: 'Информация о встрече',
    exact: true,
  });

  await open.click();
  const info = page.getByRole('dialog', { name: meeting.title, exact: true });
  await expect(
    info.getByRole('heading', { name: meeting.title, exact: true }),
  ).toBeVisible();
  const monitor = await page.evaluateHandle(() => {
    let maximum = document.querySelectorAll('dialog:modal').length;
    const observer = new MutationObserver(() => {
      maximum = Math.max(maximum, document.querySelectorAll('dialog:modal').length);
    });

    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['open'],
    });

    return {
      stop: () => {
        observer.disconnect();

        return maximum;
      },
    };
  });

  await expect(
    info.getByRole('link', {
      name: /Помощь|Сообщить|О somewhere|Политика|Cookie|Версия/,
    }),
  ).toHaveCount(0);
  const invite = info.getByRole('button', { name: 'Пригласить друзей', exact: true });
  await invite.scrollIntoViewIfNeeded();
  expect(
    await info.getByTestId('meeting-info-scroll').evaluate((node) => node.scrollTop),
  ).toBeGreaterThan(0);
  await expect(info.getByRole('button', { name: 'Закрыть', exact: true })).toBeInViewport(
    { ratio: 1 },
  );
  await invite.click();
  const share = page.getByRole('dialog', { name: 'Пригласить друзей', exact: true });
  await expect(info).not.toBeVisible();
  await expect(share).toHaveAttribute('data-motion', 'open');
  await expect(share.getByLabel('Ссылка приглашения')).toHaveValue(invitation_url);
  await expect
    .poll(() => share.evaluate((node) => node.contains(document.activeElement)))
    .toBe(true);
  await share.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(share).not.toBeVisible();
  await expect(info).toHaveAttribute('data-motion', 'open');
  await expect
    .poll(() => info.evaluate((node) => node.contains(document.activeElement)))
    .toBe(true);
  await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(info).not.toBeVisible();
  await expect(open).toBeFocused();
  await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
    'Черновик под сведениями',
  );
  await open.click();
  await info.getByRole('button', { name: 'Настройки встречи', exact: true }).click();
  const edit = page.getByRole('dialog', { name: 'Настройки встречи' });
  await edit.getByLabel('Название', { exact: true }).fill('Сохраним позже');
  await edit.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(info).toBeVisible();
  await expect(
    info.getByRole('button', { name: 'Настройки встречи', exact: true }),
  ).toBeFocused();
  await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(open).toBeFocused();
  expect(await monitor.evaluate((value) => value.stop())).toBe(1);
  await monitor.dispose();
  await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
    'Черновик под сведениями',
  );
  await open.click();
  await info.getByRole('button', { name: 'Настройки встречи', exact: true }).click();
  await expect(edit.getByLabel('Название', { exact: true })).toHaveValue(
    'Сохраним позже',
  );
  await edit.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await page.goto('/profile');
  await expect(
    page.getByRole('link', { name: 'Сообщить о проблеме', exact: true }),
  ).toBeVisible();
});

for (const width of [320, 390]) {
  test(`chat action keeps its heading and close button visible in a real ${width}x430 viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Длинная форма в низком окне');
    await page.goto(`/meetings/${meeting.id}`);
    await page.getByLabel('Сообщение', { exact: true }).fill('Обсудим после опроса');
    await page.getByRole('button', { name: 'Добавить к встрече' }).click();
    await page.getByRole('menuitem', { name: 'Предложить дату', exact: true }).click();
    const sheet = page.getByRole('dialog', { name: 'Новая дата встречи', exact: true });
    await expect(sheet).toHaveAttribute('data-motion', 'open');
    await page.setViewportSize({ width, height: 430 });
    const heading = sheet.getByRole('heading', {
      name: 'Новая дата встречи',
      exact: true,
    });

    const close = sheet.getByRole('button', { name: 'Закрыть', exact: true });
    const content = sheet.getByTestId('poll-form-scroll');
    const submit = sheet.getByRole('button', { name: 'Создать опрос', exact: true });
    await expect(close).toBeInViewport({ ratio: 1 });
    const headingTop = (await heading.boundingBox())?.y;
    await expect(submit).toBeInViewport({ ratio: 1 });
    const footerTop = (await submit.boundingBox())?.y;
    await sheet
      .getByRole('textbox', { name: 'Время', exact: true })
      .scrollIntoViewIfNeeded();
    expect(await content.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    expect((await submit.boundingBox())?.y).toBe(footerTop);
    await expect(submit).toBeInViewport({ ratio: 1 });
    await expect(close).toBeInViewport({ ratio: 1 });
    await expect(heading).toBeInViewport({ ratio: 1 });
    expect((await heading.boundingBox())?.y).toBe(headingTop);
    expect(await sheet.evaluate((node) => node.scrollTop)).toBe(0);
    expect(await sheet.evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(width);
    await close.click();
    await expect(sheet).not.toBeVisible();
    await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
      'Обсудим после опроса',
    );
  });
}

test('mobile task details keep inline actions and require a reversible cancellation confirmation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Контекст задачи');
  await page.goto(`/meetings/${meeting.id}`);
  const composer = page.getByLabel('Сообщение', { exact: true });
  await composer.fill('Обсудим задачу');
  await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  await page.getByRole('menuitem', { name: 'Предложить задачу', exact: true }).click();
  const form = actionSurface(page, 'Предложить задачу');
  await form.getByLabel('Что сделать').fill('Принести настолку');
  await form.getByRole('button', { name: 'Предложить задачу', exact: true }).click();
  await expect(form).not.toBeVisible();
  const card = page.getByRole('region', { name: 'Задача подготовки' });
  await card.getByRole('button', { name: 'Взять на себя', exact: true }).click();
  await expect(
    card.getByRole('button', { name: 'Отметить выполненной', exact: true }),
  ).toBeVisible();
  const opener = card.getByRole('button', {
    name: 'Подробности задачи «Принести настолку»',
    exact: true,
  });

  await opener.click();
  const details = page.getByRole('dialog', { name: 'Принести настолку', exact: true });
  await expect(
    details.getByRole('heading', { name: 'Принести настолку', exact: true }),
  ).toHaveCount(1);
  await expect(details.getByText('Исполняет Саша', { exact: true })).toHaveCount(1);
  await expect(details.getByText('Контекст задачи', { exact: true })).toHaveCount(0);
  await expect(details.getByText('Предложение от', { exact: true })).toBeVisible();
  await expect(details.locator('dd').nth(0)).toContainText('Саша');
  await expect(details.locator('dd').nth(1)).toHaveText('Саша');
  await expect(details.getByTestId('avatar')).toBeVisible();
  await details.getByRole('button', { name: 'Отменить задачу', exact: true }).click();
  const confirmation = page.getByRole('dialog', {
    name: 'Отменить задачу?',
    exact: true,
  });

  await expect(page.locator('dialog:modal')).toHaveCount(1);
  await expect(confirmation).toContainText('Задача останется в истории');
  await confirmation
    .getByRole('button', { name: 'Оставить как есть', exact: true })
    .click();
  await expect(
    details.getByRole('button', { name: 'Отменить задачу', exact: true }),
  ).toBeFocused();
  await expect(details.getByText('Исполняет Саша', { exact: true })).toBeVisible();
  await details.getByRole('button', { name: 'Отменить задачу', exact: true }).click();
  await confirmation
    .getByRole('button', { name: 'Отменить задачу', exact: true })
    .click();
  await expect(details.getByText('Отменено', { exact: true })).toBeVisible();
  await expect(
    details.getByRole('button', {
      name: /Отметить выполненной|Отказаться|Отменить задачу/,
    }),
  ).toHaveCount(0);
  await expect
    .poll(() => details.evaluate((node) => node.contains(document.activeElement)))
    .toBe(true);
  await details.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(opener).toBeFocused();
  await expect(card.getByText('Отменено', { exact: true })).toBeVisible();
  await expect(composer).toHaveValue('Обсудим задачу');
});
