import { test, expect } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';

test('draft hydration during first focus does not duplicate replacement text', async ({ page }) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Гонка восстановления черновика');
  await page.goto(`/meetings/${meeting.id}`);
  const input = page.getByLabel('Сообщение', { exact: true });
  await input.fill('Черновик под составом');
  await input.blur();
  await page.reload();
  await expect(input).toHaveValue('Черновик под составом');

  await page.addInitScript(() => {
    const get = IDBObjectStore.prototype.get;
    let held = true;
    const pending: Array<() => void> = [];
    IDBObjectStore.prototype.get = new Proxy(get, {
      apply: (target, store: IDBObjectStore, args) => {
        const request: IDBRequest<unknown> = Reflect.apply(target, store, args);
        if (store.name === 'records' && held) {
          Object.defineProperty(request, 'onsuccess', {
            set: (listener: (event: Event) => void) => {
              request.addEventListener('success', (event) => {
                if (held) {
                  pending.push(() => listener.call(request, event));
                  document.documentElement.dataset.draftReadPending = 'true';
                } else {
                  listener.call(request, event);
                }
              });
            },
          });
        }
        return request;
      },
    });
    document.addEventListener('focusin', (event) => {
      if (!(event.target instanceof HTMLTextAreaElement)) {
        return;
      }

      setTimeout(() => {
        held = false;
        pending.splice(0).forEach((resolve) => resolve());
        document.documentElement.dataset.draftReadReleased = 'true';
      }, 0);
    });
  });
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.draftReadPending === 'true');
  await expect(input).toHaveValue('');
  await input.fill('Новый текст до восстановления');
  await page.waitForFunction(() => document.documentElement.dataset.draftReadReleased === 'true');
  await expect(input).toHaveValue('Новый текст до восстановления');
  await page.reload();
  await input.focus();
  await expect(input).toHaveValue('Новый текст до восстановления');
});
