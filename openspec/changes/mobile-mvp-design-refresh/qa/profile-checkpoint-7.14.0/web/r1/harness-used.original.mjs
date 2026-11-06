import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { crc32 } from 'node:zlib';
import { chromium, webkit } from '/Users/misha/Documents/Codex/projects/group-planning/node_modules/playwright/index.mjs';
import { sourceHash } from '/Users/misha/Documents/Codex/projects/group-planning/scripts/testing/catalog.mjs';

export const root = process.cwd();
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const check = (value, message) => { if (!value) throw Error(message); };
export const loopback = value => {
  const url = new URL(value);
  check(['127.0.0.1', 'localhost'].includes(url.hostname), 'Only isolated loopback origins allowed');
  return url.origin;
};
export const writeJSON = (name, value) => fs.writeFile(name, JSON.stringify(value, null, 2));
export const launch = name => ({ chromium, webkit })[name ?? 'chromium'].launch();

export const bindDisk = async candidate => {
  const pairs = [];
  for (const file of candidate.files) {
    const bytes = await fs.readFile(path.join(candidate.artifact, file.path));
    check(bytes.length === file.size && sha(bytes) === file.sha256, 'Frozen file mismatch: ' + file.path);
    pairs.push([file.path, sha(bytes)]);
  }
  const hash = sha(JSON.stringify(pairs));
  check(hash === candidate.artifactHash, 'Frozen aggregate mismatch');
  return { files: pairs.length, artifactHash: hash };
};
export const frozen = async () => {
  check(process.env.QA_FROZEN === '1', 'Prepared tooling only; explicit frozen-source authorization required');
  check(process.env.QA_CANDIDATE && process.env.QA_BASE_URL && process.env.QA_OUT_DIR, 'QA_CANDIDATE/QA_BASE_URL/QA_OUT_DIR required');
  const candidatePath = path.resolve(process.env.QA_CANDIDATE);
  const candidate = JSON.parse(await fs.readFile(candidatePath));
  const out = path.resolve(process.env.QA_OUT_DIR);
  check(out.startsWith(path.join(root, 'openspec/changes/mobile-mvp-design-refresh/qa/')), 'Evidence must stay in QA');
  const cfg = JSON.parse(await fs.readFile(path.join(root, 'testing/config.json')));
  const before = await sourceHash(root, cfg, ['web']);
  check(before === candidate.sourceHash, 'Source changed; stop stale review');
  await fs.mkdir(out, { recursive: true });
  return { candidatePath, candidate, out, base: loopback(process.env.QA_BASE_URL), cfg, before, diskBefore: await bindDisk(candidate) };
};
export const finish = async (env, result, page) => {
  const after = await sourceHash(root, env.cfg, ['web']);
  const diskAfter = await bindDisk(env.candidate);
  const html = await page.request.get(env.base + '/meetings');
  const htmlBytes = await html.body();
  const entries = [...htmlBytes.toString().matchAll(/(?:src|href)="\/(assets\/[^\"]+)"/g)].map(x => x[1]);
  const live = [];
  for (const asset of [...new Set(entries)]) {
    const response = await page.request.get(env.base + '/' + asset);
    const expected = env.candidate.files.find(x => x.path === asset);
    live.push({ path: asset, status: response.status(), sha256: sha(await response.body()), expected: expected?.sha256 });
  }
  const valid = after === env.before && live.every(x => x.status === 200 && x.sha256 === x.expected);
  await writeJSON(path.join(env.out, 'binding.json'), { candidateSha256: sha(await fs.readFile(env.candidatePath)), sourceBefore: env.before, sourceAfter: after, diskBefore: env.diskBefore, diskAfter, htmlSha256: sha(htmlBytes), htmlNote: 'Backend metadata transforms allowed; entry asset bytes compared', live, valid });
  await writeJSON(path.join(env.out, 'observations.json'), { ...result, inputStable: valid, kind: 'checkpoint observations; no final manifest/case gate' });
  check(valid, 'Input/binding changed: observations cannot accept current candidate');
};
export const login = async (page, base, name = 'Катя') => {
  await page.goto(base + '/meetings');
  await page.getByRole('button', { name: 'Войти через Яндекс ID', exact: true }).click();
  await page.getByRole('link', { name: 'Войти как ' + name, exact: true }).click();
  await page.waitForURL(base + '/meetings');
};
export const api = async (page, base, method, route, data, key = randomUUID()) => {
  loopback(base);
  const me = await (await page.request.get(base + '/api/v1/me')).json();
  const response = await page.request[method](base + route, { headers: { Origin: base, 'X-CSRF-Token': me.csrf_token, 'Idempotency-Key': key }, ...(data === undefined ? {} : { data }) });
  check(response.ok(), method + ' ' + route + ': ' + response.status());
  return response.status() === 204 ? null : response.json();
};
export const photoFiles = async () => Promise.all(['friends', 'boardgame', 'dinner'].map(async name => ({ name: name + '.png', mimeType: 'image/png', buffer: await fs.readFile(path.join(root, 'openspec/changes/mobile-mvp-design-refresh/assets/vibe-r3', name + '.png')) })));
export const seedAlbum = async (page, base) => {
  const created = await api(page, base, 'post', '/api/v1/meetings', { title: 'QA isolated vibe ' + randomUUID().slice(0, 6), starts_on: '2099-10-24', timezone: 'UTC', place: 'Лофт «Квартал»' });
  const id = created.meeting.id;
  await api(page, base, 'patch', '/api/v1/meetings/' + id, { expected_revision: created.meeting.revision, starts_at: null, starts_on: '2026-10-01', timezone: 'UTC' });
  const photos = [];
  for (const file of await photoFiles()) {
    const key = randomUUID();
    const reserved = await api(page, base, 'post', '/api/v1/meetings/' + id + '/media/uploads', { client_request_id: key, file_name: file.name, content_type: file.mimeType, size_bytes: file.buffer.length, purpose: 'memory' }, key);
    const route = '/api/v1/meetings/' + id + '/media/' + reserved.media.id;
    const me = await api(page, base, 'get', '/api/v1/me');
    const upload = await page.request.put(base + route + '/content', { headers: { Origin: base, 'X-CSRF-Token': me.csrf_token, 'Content-Type': file.mimeType }, data: file.buffer });
    check(upload.ok(), 'Fixture photo upload failed');
    await api(page, base, 'post', route + '/publish', {});
    const original = await page.request.get(base + route + '/content');
    photos.push({ id: reserved.media.id, name: file.name, sha256: sha(await original.body()) });
  }
  return { id, invitation_url: created.invitation_url, photos, note: 'API state setup, never product create/upload acceptance' };
};
export const capture = async (page, out, name) => {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(out, name + '.png') });
  return page.evaluate(() => ({ url: location.pathname + location.search, viewport: [innerWidth, innerHeight], overflow: document.documentElement.scrollWidth > innerWidth, active: document.activeElement?.outerHTML.slice(0, 400), dialogs: document.querySelectorAll('dialog:modal').length, text: document.body.innerText, controls: [...document.querySelectorAll('h1,header button,dialog[open] button,[data-testid=album-view-controls],[role=group][aria-label^="Фото встречи."]')].filter(e => e.getBoundingClientRect().width).map(e => { const c = getComputedStyle(e); return { tag: e.tagName, label: e.getAttribute('aria-label'), text: e.innerText, rect: e.getBoundingClientRect().toJSON(), color: c.color, font: c.fontSize, line: c.lineHeight, padding: c.padding, radius: c.borderRadius }; }) }));
};
export const drag = async (page, locator, { dx, dy = 2, hold = 180, steps = 8 }) => {
  const box = await locator.boundingBox();
  check(box, 'Gesture surface unavailable');
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps });
  const mid = await locator.evaluate(e => ({ offset: e.dataset.offset, phase: e.dataset.phase, frontTransform: getComputedStyle(e.querySelector('[data-front=true]') ?? e).transform }));
  await page.waitForTimeout(hold); await page.mouse.up(); await page.waitForTimeout(500);
  return { input: 'trusted Playwright mouse; not physical touch', dx, dy, hold, before: box, mid, after: await locator.boundingBox() };
};
export const touchDrag = async (page, locator, dx, cancel = false) => {
  const box = await locator.boundingBox(); check(box, 'Touch surface unavailable');
  const session = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 8; i++) { await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i / 8, y: y + 2 }] }); await page.waitForTimeout(16); }
  await session.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
  await session.detach();
};
export const failOnce = async (page, pattern, mode = 'known', status = 503) => {
  const requests = []; let faulted = false;
  const handler = async route => {
    requests.push({ method: route.request().method(), key: route.request().headers()['idempotency-key'], body: route.request().postData() });
    if (faulted) return route.continue();
    faulted = true;
    if (mode === 'lost-ack') { const response = await route.fetch(); requests.at(-1).commitStatus = response.status(); return route.abort('failed'); }
    return route.fulfill({ status, json: { error: { code: 'unavailable' } } });
  };
  await page.route(pattern, handler);
  return { requests, remove: () => page.unroute(pattern, handler) };
};
export const zipPhotos = bytes => {
  check(bytes.readUInt32LE(bytes.length - 22) === 0x06054b50, 'Expected ZIP Store EOCD');
  const count = bytes.readUInt16LE(bytes.length - 12), entries = []; let position = bytes.readUInt32LE(bytes.length - 6);
  for (let i = 0; i < count; i++) {
    check(bytes.readUInt32LE(position) === 0x02014b50 && bytes.readUInt16LE(position + 10) === 0, 'Expected ZIP Store central entry');
    const size = bytes.readUInt32LE(position + 24), n = bytes.readUInt16LE(position + 28), extra = bytes.readUInt16LE(position + 30), comment = bytes.readUInt16LE(position + 32), local = bytes.readUInt32LE(position + 42);
    const name = bytes.subarray(position + 46, position + 46 + n).toString(); check(!/[/\\]|\.\./.test(name), 'Unsafe archive filename');
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28), data = bytes.subarray(start, start + size);
    check(data.length === size && crc32(data) === bytes.readUInt32LE(position + 16), 'ZIP integrity mismatch');
    entries.push({ name, sha256: sha(data) }); position += 46 + n + extra + comment;
  }
  check(new Set(entries.map(x => x.name)).size === count, 'ZIP names not unique'); return entries;
};
