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
    const decrypt = crypto.subtle.decrypt.bind(crypto.subtle);
    let held = true;
    const pending: Array<() => void> = [];
    crypto.subtle.decrypt = (...args: Parameters<SubtleCrypto['decrypt']>) =>
      decrypt(...args).then((value) => {
        if (!held) {
          return value;
        }

        document.documentElement.dataset.draftDecryptPending = 'true';
        return new Promise<ArrayBuffer>((resolve) => pending.push(() => resolve(value)));
      });
    document.addEventListener('focusin', (event) => {
      if (!(event.target instanceof HTMLTextAreaElement)) {
        return;
      }

      setTimeout(() => {
        held = false;
        pending.splice(0).forEach((resolve) => resolve());
      }, 0);
    });
  });
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.draftDecryptPending === 'true');
  await expect(input).toHaveValue('');
  await input.fill('Черновик под составом');
  await expect(input).toHaveValue('Черновик под составом');
});
