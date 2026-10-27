import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

// Только свежий render опубликованного raw; не функциональная приёмка приложения.
const output = join(dirname(fileURLToPath(import.meta.url)), 'reference');
const root = process.cwd();
const sourceHash = '7281d60a82c41d4dc7fdb8f0427df0771649e255caf7e94ccfc351a8b3da2671';
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const sources = [
  'design-system/authority.json',
  'openspec/changes/meeting-experience-refresh/assets/list.html',
  'openspec/changes/meeting-experience-refresh/assets/styles.css',
  ...['chat.html', 'tokens.css', 'chat.css', 'panels.css', 'generated/chat.js', 'source-hashes.json'].map(
    (file) => `openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/${file}`,
  ),
];
const sourceFiles = {};
for (const path of sources) sourceFiles[path] = sha256(await readFile(join(root, path)));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const captures = [];
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ru-RU', timezoneId: 'Europe/Moscow', deviceScaleFactor: 1 });
  const page = await context.newPage();
  const views = [
    ['list', 'http://127.0.0.1:8786/list.html'],
    ...['chat', 'emoji', 'reactions', 'info', 'settings', 'task', 'date'].map(
      (view) => [view, `http://127.0.0.1:8786/revisions/2026-10-27-telegram-chat/chat.html?view=${view}`],
    ),
  ];
  for (const [view, url] of views) {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const file = `${view}-390x844.png`;
    await page.screenshot({ path: join(output, file), animations: 'disabled' });
    captures.push({ view, url, file, sha256: sha256(await readFile(join(output, file))), capturedAt: new Date().toISOString(), observation: await page.evaluate(() => ({ viewport: { width: innerWidth, height: innerHeight }, fontFamily: getComputedStyle(document.body).fontFamily, language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, title: document.title })) });
  }
  await writeFile(join(output, 'metadata.json'), JSON.stringify({ scope: 'raw-reference-render-only', sourceHash, sourceFiles, runtime: await browser.version(), fixture: 'Неизменённые встроенные вымышленные данные raw HTML/JS; отличается от native design seed', textScale: 1, captures }, null, 2) + '\n');
  console.log(JSON.stringify({ scope: 'raw-reference-render-only', captures: captures.length, output }));
} finally {
  await browser.close();
}
