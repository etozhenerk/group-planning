import { expect, test } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';

for (const width of [390, 1440]) {
  for (const answer of ['Возможно', 'Не смогу'] as const) {
    for (const lost of [false, true]) {
      test(`${answer} after realtime revocation at ${width}px with ${lost ? 'lost' : 'held'} ACK`, async ({
        page,
        browser,
      }) => {
        await login(page, 'Саша');
        const created = await apiCreate(
          page,
          `Revoke ${test.info().project.name} ${answer} ${width} ${lost}`,
        );

        const id = created.meeting.id;
        const context = await browser.newContext({
          ignoreHTTPSErrors: true,
          viewport: { width, height: 900 },
        });

        const guest = await context.newPage();
        const frames: string[] = [];
        guest.on('websocket', (socket) => {
          socket.on('framesent', ({ payload }) => frames.push(String(payload)));
        });
        const gate = { release: () => {} };
        const pending = new Promise<void>((resolve) => {
          gate.release = resolve;
        });

        const endpoint = `**/api/v1/meetings/${id}/rsvp`;
        const keys: string[] = [];

        try {
          await login(guest, 'Лена');
          await guest.goto(created.invitation_url);
          await guest.getByRole('button', { name: 'Приду', exact: true }).click();
          await expect(guest).toHaveURL(`/meetings/${id}`);
          await expect(guest.getByLabel('Сообщение', { exact: true })).toBeVisible();
          await expect
            .poll(() => frames.some((frame) => frame.includes(`meeting:${id}`)))
            .toBe(true);
          await guest
            .getByRole('button', { name: 'Информация о встрече', exact: true })
            .click();

          if (width < 740) {
            await guest.getByRole('button', { name: 'Изменить', exact: true }).click();
          }

          await guest.route(endpoint, async (route) => {
            keys.push(route.request().headers()['idempotency-key'] ?? '');
            const response = await route.fetch();
            expect(response.status()).toBe(200);
            await pending;

            if (lost) {
              await route.abort('connectionreset');
            } else {
              await route.fulfill({ response });
            }
          });
          await guest.getByRole('button', { name: answer, exact: true }).click();
          // Real server revokes its live subscription before the held HTTP ACK arrives.
          await expect(guest.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
          const recovery = guest.getByRole('region', {
            name: 'Ответ на приглашение',
            exact: true,
          });

          await expect(recovery).toBeVisible();
          await expect(recovery.getByRole('status')).toContainText('Сохраняем ответ');
          await expect(guest).toHaveURL(`/meetings/${id}`);
          gate.release();

          if (lost) {
            await expect(recovery.getByRole('alert')).toBeVisible();
            await expect(guest).toHaveURL(`/meetings/${id}`);
            await guest.unroute(endpoint);
            guest.on('request', (request) => {
              if (
                request.method() === 'PUT' &&
                request.url().endsWith(`/meetings/${id}/rsvp`)
              ) {
                keys.push(request.headers()['idempotency-key'] ?? '');
              }
            });
            await recovery.getByRole('button', { name: answer, exact: true }).click();
            await expect.poll(() => keys.length).toBe(2);
            expect(keys[1]).toBe(keys[0]);
          }

          if (answer === 'Возможно') {
            await expect(guest).toHaveURL('/invitations');
            await expect(
              guest
                .getByTestId('saved-invitation')
                .filter({ hasText: created.meeting.title }),
            ).toBeVisible();
          } else {
            await expect(guest).toHaveURL(`/meetings/${id}/declined`);
            await expect(
              guest.getByRole('heading', { name: 'Вы ответили «Не смогу»', exact: true }),
            ).toBeVisible();
          }

          expect((await guest.request.get(`/api/v1/meetings/${id}/feed`)).status()).toBe(
            403,
          );
          const { feedSchema } = await import('@/shared/api');
          const result = await page.request.get(`/api/v1/meetings/${id}/feed`);
          const raw: unknown = await result.json();
          expect(
            feedSchema
              .parse(raw)
              .entries.filter((entry) => entry.kind === 'participant_left'),
          ).toHaveLength(1);
        } finally {
          gate.release();
          await context.close();
        }
      });
    }
  }
}
