import { test, expect } from '@playwright/test';
import { login } from '@tests/helpers';
import { calendarItems, calendarResponse } from '@tests/calendar-helpers';

test('midnight follows persisted server status, waits for worker, refreshes on foreground', async ({
  page,
}) => {
  await login(page, 'Саша');
  const items = (await calendarItems(page)).slice(0, 1);
  let reads = 0;
  let complete = false;
  await page.clock.install({ time: new Date('2020-01-01T00:00:00Z') });
  await page.route('**/api/v1/meetings?*', (route) => {
    reads++;
    const wire = calendarResponse(items, route.request().url());
    wire.as_of = '2026-10-24T20:59:59Z';
    wire.next_transition_at = '2026-10-24T21:00:00Z';

    if (complete) {
      wire.as_of = '2026-10-24T21:00:05Z';
      wire.next_transition_at = null;
    }

    return route.fulfill({ json: wire });
  });
  await page.goto('/meetings?view=calendar&period=upcoming&upcoming=2026-10-24');
  const agenda = page.getByRole('region', { name: 'Встречи выбранного дня' });
  await expect(agenda.getByTestId('agenda-meeting')).toHaveCount(1);
  // Reaching the deadline never changes the client-side classification itself.
  await page.clock.runFor(1_050);
  await expect(agenda.getByTestId('agenda-meeting')).toHaveCount(1);
  items[0]!.period = 'past';
  complete = true;
  await page.clock.runFor(5_050);
  await expect(agenda.getByText('На этот день встреч нет.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Прошедшие/ })).toHaveText('Прошедшие1');
  await expect(page.locator('[data-day="2026-10-24"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(reads).toBeLessThan(20);
  items[0]!.period = 'upcoming';
  const refreshed = page.waitForResponse((response) =>
    response.url().includes('from=2026-10-24'),
  );

  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await refreshed;
  await page.clock.runFor(100);
  await expect(agenda.getByTestId('agenda-meeting')).toHaveCount(1);
});

test('409 discards old pages and keeps day; failures retain confirmed data', async ({
  page,
}) => {
  await login(page, 'Лена');
  const items = (await calendarItems(page)).slice(0, 1);
  let continuation = 'old';
  let conflict = true;
  let fail = false;
  await page.route('**/api/v1/meetings?*', (route) => {
    const params = new URL(route.request().url()).searchParams;
    const daily = params.get('from') === '2026-10-24';

    if (fail) {
      return route.abort('failed');
    }

    if (daily && params.get('cursor') && conflict) {
      conflict = false;
      continuation = 'new';
      items[0]!.title = 'После обновления';

      return route.fulfill({
        status: 409,
        json: {
          error: {
            code: 'calendar_changed',
            field_errors: {},
            request_id: 'calendar-test',
          },
        },
      });
    }

    const wire = calendarResponse(items, route.request().url());

    if (daily && !params.has('cursor')) {
      wire.next_cursor = continuation;
    } else if (daily) {
      wire.meetings = [
        {
          ...items[0]!,
          id: '00000000-0000-4000-8000-000000000099',
          title: 'Вторая страница',
        },
      ];
    }

    return route.fulfill({ json: wire });
  });
  await page.goto('/meetings?view=calendar&period=upcoming&upcoming=2026-10-24');
  const agenda = page.getByRole('region', { name: 'Встречи выбранного дня' });
  await agenda.getByRole('button', { name: 'Показать ещё' }).click();
  await expect(agenda.getByTestId('agenda-meeting')).toHaveCount(1);
  await expect(agenda.getByTestId('agenda-meeting')).toContainText('После обновления');
  await expect(page.locator('[data-day="2026-10-24"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await agenda.getByRole('button', { name: 'Показать ещё' }).click();
  await expect(agenda.getByTestId('agenda-meeting')).toHaveCount(2);
  await expect(agenda.getByText('Вторая страница')).toBeVisible();
  fail = true;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(agenda.getByRole('alert')).toBeVisible({ timeout: 12_000 });
  await expect(agenda.getByTestId('agenda-meeting')).toHaveCount(2);
  await expect(
    page.getByRole('link', { name: 'Создать встречу', exact: true }),
  ).toHaveCount(1);
  fail = false;
  await agenda.getByRole('button', { name: 'Попробовать снова' }).click();
  await expect(agenda.getByRole('alert')).toHaveCount(0);
});

test('a delayed month response cannot replace the current selection', async ({
  page,
}) => {
  await login(page, 'Саша');
  const items = await calendarItems(page);
  let release: (() => void) | undefined;
  const delayed = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route('**/api/v1/meetings?*', async (route) => {
    const params = new URL(route.request().url()).searchParams;

    if (params.get('from') === '2026-09-28') {
      await delayed;
    }

    await route.fulfill({ json: calendarResponse(items, route.request().url()) });
  });
  await page.goto('/meetings?view=calendar&period=upcoming&upcoming=2026-10-24');
  await page.getByRole('button', { name: 'Следующий месяц' }).click();
  await expect(
    page.getByRole('heading', { name: 'ноябрь 2026', exact: true }),
  ).toBeVisible();
  release?.();
  await expect(page.locator('[data-day="2026-11-24"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('region', { name: 'Встречи выбранного дня' }),
  ).toContainText('На этот день встреч нет.');
  await expect(page.locator('[data-day="2026-10-31"]')).toHaveAccessibleName(/встреч: 2/);
});
