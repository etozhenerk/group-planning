import { writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { apiCreate, login, writeHeaders } from '@tests/helpers';
import { ownedBrowserMemory } from '@tests/helpers/ownedBrowserMemory';

test.afterEach(async ({ page }, info) => {
  if (info.status === 'passed') {
    return;
  }

  const frames: unknown = await page.evaluate(() =>
    Reflect.get(window, '__qaBaselineFrames'),
  );
  await info.attach('incomplete-frame-samples', {
    body: JSON.stringify(frames ?? null),
    contentType: 'application/json',
  });
});

test('10k mixed-height history baseline in both directions', async ({
  page,
  browser,
}, info) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Baseline прокрутки 10k');
  const headers = await writeHeaders(page);
  const digest = createHash('sha256');

  for (let batch = 0; batch < 1000; batch += 1) {
    const texts = Array.from({ length: 10 }, (_, index) => {
      const number = batch * 10 + index;

      return `${number}: ${'Переменная высота строки. '.repeat(1 + (number % 32))}`;
    });

    texts.forEach((text) => digest.update(text));
    const responses = await Promise.all(
      texts.map((text) => {
        const key = randomUUID();

        return page.request.post(`/api/v1/meetings/${meeting.id}/messages`, {
          headers: { ...headers, 'Idempotency-Key': key },
          data: { text, client_request_id: key },
        });
      }),
    );

    expect(responses.every((response) => response.status() === 201)).toBe(true);

    if (batch % 100 === 99) {
      const title = `Подготовка ${batch}: ${'длинная карточка '.repeat(batch % 200 ? 8 : 1)}`;
      digest.update(title);
      const task = await page.request.post(
        `/api/v1/meetings/${meeting.id}/preparation-tasks`,
        {
          headers: { ...headers, 'Idempotency-Key': randomUUID() },
          data: { title, recipient_id: null },
        },
      );

      expect(task.status()).toBe(201);
    }
  }

  await page.route('**/api/v1/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 75));
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, 75));
    await route.fulfill({ response });
  });
  await page.goto(`/meetings/${meeting.id}`);
  const view = page.locator('[data-server-count]');
  await expect(view).toBeVisible();
  const tail = await view.getAttribute('data-window-last');
  const checkpoints: unknown[] = [];
  await page.evaluate(() => {
    const state = { active: true, previous: 0, intervals: [] as number[] };
    Reflect.set(window, '__qaBaselineFrames', state);
    const frame = (time: number) => {
      if (!state.active) {
        return;
      }

      if (state.previous) {
        state.intervals.push(time - state.previous);
      }

      state.previous = time;
      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  });
  let pages = 0;
  const snapshot = async (direction: string) => {
    const state = await view.evaluate((element) => ({
      first: element.getAttribute('data-window-first'),
      last: element.getAttribute('data-window-last'),
      stored: Number(element.getAttribute('data-server-count')),
      mounted: element.querySelectorAll('[data-entry-id]').length,
      heights: [...element.querySelectorAll('[data-entry-id]')]
        .slice(0, 8)
        .map((row) => row.getBoundingClientRect().height),
    }));

    expect(state.stored).toBeLessThanOrEqual(500);
    expect(state.mounted).toBeLessThanOrEqual(200);
    checkpoints.push({ direction, pages, ...state, memory: await ownedBrowserMemory() });
    await writeFile(
      info.outputPath('checkpoints.json'),
      JSON.stringify(checkpoints, null, 2),
    );
    console.log(
      `BASELINE ${info.project.name} ${direction} ${pages} ${state.first}..${state.last}`,
    );
  };

  await snapshot('tail-start');

  for (
    ;
    pages < 500 && (await view.getAttribute('data-has-older')) === 'true';
    pages += 1
  ) {
    const before = await view.getAttribute('data-window-first');
    await page
      .getByRole('button', { name: 'Предыдущие записи', exact: true })
      .dispatchEvent('click');
    await view.evaluate((element) => {
      element.scrollTop = 1;
    });
    await expect
      .poll(() => view.getAttribute('data-window-first'), { timeout: 15_000 })
      .not.toBe(before);

    if (pages % 20 === 0) {
      await snapshot('older');
    }
  }

  expect(await view.getAttribute('data-has-older')).toBe('false');
  await snapshot('oldest');

  for (
    let step = 0;
    step < 500 && (await view.getAttribute('data-window-last')) !== tail;
    step += 1
  ) {
    const before = await view.getAttribute('data-window-last');
    await page
      .getByRole('button', { name: 'Следующие записи', exact: true })
      .dispatchEvent('click');
    await view.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect
      .poll(() => view.getAttribute('data-window-last'), { timeout: 15_000 })
      .not.toBe(before);

    if (step % 20 === 0) {
      await snapshot('newer');
    }
  }

  expect(await view.getAttribute('data-window-last')).toBe(tail);
  await snapshot('tail-return');
  const frames = await page.evaluate(() => {
    const state = Reflect.get(window, '__qaBaselineFrames') as {
      active: boolean;
      intervals: number[];
    };

    state.active = false;

    return state.intervals;
  });

  const ordered = [...frames].sort((a, b) => a - b);
  const result = {
    browser: browser.version(),
    project: info.project.name,
    viewport: page.viewportSize(),
    dataset: { messages: 10000, tasks: 10, sha256: digest.digest('hex') },
    network: '75ms before and after each browser HTTP API request; loopback HTTPS',
    frameScope:
      'requestAnimationFrame heartbeat intervals; not GPU presented-frame durations',
    memoryScope:
      'RSS sum of this QA worker browser descendants, excludes worker/probe; shared pages may repeat',
    frameP95Ms: ordered[Math.ceil(ordered.length * 0.95) - 1],
    frameP99Ms: ordered[Math.ceil(ordered.length * 0.99) - 1],
    intervalsMs: frames,
    checkpoints,
  };

  await writeFile(info.outputPath('baseline.json'), JSON.stringify(result, null, 2));
  await info.attach('baseline', {
    body: JSON.stringify(result),
    contentType: 'application/json',
  });
  await page.screenshot({ path: info.outputPath('tail-return.png') });
});
