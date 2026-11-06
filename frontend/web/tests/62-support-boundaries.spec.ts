import { expect, test } from '@playwright/test';
import { login } from '@tests/helpers';

for (const width of [390, 1440]) {
  test(`support validates Unicode boundaries before sending at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page, 'Саша');
    const requests: unknown[] = [];

    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/v1/support/feedback'
      ) {
        requests.push(request.postDataJSON());
      }
    });

    await page.goto('/support?kind=idea&screen=profile');
    const description = page.getByRole('textbox', {
      name: width < 740 ? 'Сообщение' : 'Ваше сообщение',
    });

    const submit = page.getByRole('button', {
      name: width < 740 ? 'Отправить обращение' : 'Отправить сообщение ↗',
    });

    const short = `\u0085\u00a0${'🙂'.repeat(9)} \u3000`;

    await description.fill(short);
    await submit.click();
    await expect(page.getByRole('alert')).toHaveText(
      'Добавьте описание — хотя бы 10 символов.',
    );
    await expect(description).toHaveValue(short);
    await expect(description).toBeFocused();
    await expect(page.getByRole('radio', { name: 'Идея' })).toBeChecked();

    if (width < 740) {
      await expect(
        page.getByRole('button', { name: 'Раздел приложения: Профиль' }),
      ).toBeVisible();
    } else {
      await expect(page.getByRole('combobox', { name: 'Раздел' })).toHaveValue('profile');
    }

    expect(requests).toHaveLength(0);

    const long = '🙂'.repeat(3001);

    await description.fill(long);
    await submit.click();
    await expect(page.getByRole('alert')).toHaveText(
      'Сократите сообщение до 3000 символов.',
    );
    await expect(description).toHaveValue(long);
    expect(requests).toHaveLength(0);

    for (const length of [10, 3000]) {
      await page.goto('/support?kind=idea&screen=profile');
      await description.fill(`\u0085${'🙂'.repeat(length)}\u00a0`);
      const accepted = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname === '/api/v1/support/feedback',
      );

      await submit.click();
      const response = await accepted;

      expect(response.status()).toBe(201);
      await expect(
        page.getByRole('heading', { name: 'Обращение принято' }),
      ).toBeVisible();
      const receipt: unknown = await response.json();

      expect(receipt).toEqual(
        expect.objectContaining({ reference: expect.any(String), status: 'accepted' }),
      );
      expect(requests.at(-1)).toEqual(
        expect.objectContaining({ description: '🙂'.repeat(length), email: null }),
      );
    }

    expect(requests).toHaveLength(2);
  });
}
