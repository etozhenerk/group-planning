import fs from 'node:fs/promises';
import path from 'node:path';
import { frozen, finish, launch, login, seedAlbum, capture, drag, photoFiles, check, writeJSON } from './harness.mjs';

if (process.argv.includes('--plan')) {
  console.log(await fs.readFile(new URL('scope.json', import.meta.url), 'utf8'));
  process.exit(0);
}
const env = await frozen();
const browserName = process.env.QA_BROWSER ?? 'chromium';
const browser = await launch(browserName);
const context = await browser.newContext({ ignoreHTTPSErrors: true, acceptDownloads: true, viewport: { width: 390, height: 844 }, locale: 'ru-RU', timezoneId: 'Europe/Moscow' });
const page = await context.newPage(), reference = await context.newPage();
page.setDefaultTimeout(12000);
const records = [], errors = [];
try {
  await login(page, env.base);
  const fixture = await seedAlbum(page, env.base);
  await writeJSON(path.join(env.out, 'fixture.json'), fixture);
  await page.goto(env.base + '/meetings/' + fixture.id + '/memories');
  const deck = page.getByRole('group', { name: 'Фото встречи. Листайте клавишами влево и вправо', exact: true });
  await deck.waitFor();
  await page.waitForFunction(() => { const e=document.querySelector('[data-front=true] img'); return e && e.complete && e.naturalWidth>0; });
  const counter = page.getByTestId('album-counter');
  const initial = await counter.innerText();
  records.push({ name: 'deck-ready', actual: await capture(page, env.out, 'deck-ready-actual') });
  if (process.env.QA_REFERENCE_URL) {
    await reference.goto(process.env.QA_REFERENCE_URL);
    records.push({ name: 'deck-reference', reference: await capture(reference, env.out, 'deck-ready-reference') });
  }
  const controls = await page.getByTestId('album-view-controls').boundingBox();
  await page.getByRole('button', { name: 'Показать сеткой', exact: true }).click();
  records.push({ name: 'grid', beforeControls: controls, afterControls: await page.getByTestId('album-view-controls').boundingBox(), actual: await capture(page, env.out, 'grid-actual') });
  await page.getByRole('button', { name: 'Открыть фото 2', exact: true }).click();
  await page.getByRole('dialog', { name: 'Фото встречи', exact: true }).waitFor();
  records.push({ name: 'viewer', actual: await capture(page, env.out, 'viewer-actual') });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Показать стопкой', exact: true }).click();
  await deck.focus();
  const beforeRollback = await counter.innerText();
  const rollback = await drag(page, deck, { dx: 24, hold: 220 });
  check(await counter.innerText() === beforeRollback, 'Short drag advanced instead of rollback');
  records.push({ name: 'rollback', ...rollback });
  for (const dx of [-145, 145, -145]) {
    await page.waitForFunction(() => { const e=document.querySelector('[role=group][aria-label^="Фото встречи."]'); return e && e.dataset.phase==='idle' && e.dataset.resetting!=='true'; });
    const motion=await drag(page, deck, { dx });
    await page.waitForFunction(() => { const e=document.querySelector('[role=group][aria-label^="Фото встречи."]'); return e && e.dataset.phase==='idle' && e.dataset.resetting!=='true'; });
    records.push({ name:'swipe-cycle',...motion,counter:await counter.innerText() });
  }
  records.push({ name: 'gesture-checkpoint', initial, actual: await capture(page, env.out, 'cycle-actual') });
  await page.getByRole('button', { name: 'Добавить фото', exact: true }).click();
  const upload = page.getByRole('dialog', { name: 'Добавить фото в альбом', exact: true });
  await upload.waitFor();
  const files = await photoFiles();
  await upload.getByLabel('Файлы для альбома', { exact: true }).setInputFiles(files.slice(0, 1));
  records.push({ name: 'upload-selected', actual: await capture(page, env.out, 'upload-selected-actual') });
  // Remaining manual steps are explicit in scope.json; no automatic pass for unexecuted steps.
  await writeJSON(path.join(env.out, 'remaining-steps.json'), { status: 'not-executed', steps: ['upload picker cancel/preserve', 'partial upload known fault + one retry', 'save native ZIP + hashes', 'outsider privacy read/export denied', 'desktop preservation1100', '320/WebKit spot', 'touch cancel/vertical/flick; RM and200% where requested'] });
} catch (error) { errors.push({ error: String(error), stack: error.stack }); }
finally {
  try { await finish(env, { browser: browserName, records, errors, note: 'Partial driver only; named remaining steps never get pass' }, page); }
  finally { await browser.close(); }
}
