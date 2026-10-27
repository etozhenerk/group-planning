import { chromium, webkit } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const results = [];
for (const [name, launcher] of [['chromium', chromium], ['webkit', webkit]] as const) {
  const browser = await launcher.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => { errors.push(error.message); console.log(error.message); });
  await page.goto('http://127.0.0.1:8460');
  const trigger = page.locator('[data-ui-key="alice:intent-0"] [data-testid="message-actions"]');
  await trigger.waitFor();
  await trigger.focus();
  const before = await page.evaluate(() => ({ mounted: document.querySelectorAll('[data-testid="feed-message"]').length, active: document.activeElement?.closest('[data-ui-key]')?.getAttribute('data-ui-key') }));
  await page.locator('[data-testid="virtual-scroller"]').evaluate((element) => { element.scrollTop = element.scrollHeight - element.clientHeight; });
  await page.locator('[data-ui-key="alice:intent-499"]').waitFor();
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => ({ mounted: document.querySelectorAll('[data-testid="feed-message"]').length, retained: !!document.querySelector('[data-ui-key="alice:intent-0"]'), active: document.activeElement?.closest('[data-ui-key]')?.getAttribute('data-ui-key') ?? document.activeElement?.tagName }));
  results.push({ name, before, after, errors });
  await page.screenshot({ path: `.cache/virtualization-spike/${name}.png` });
  await browser.close();
}
await writeFile('.cache/virtualization-spike/results.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results));
