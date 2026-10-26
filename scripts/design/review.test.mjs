import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { readManifest, reviewStatus } from './review.mjs';
import { sha256 } from './files.mjs';
import { stopDecision } from './stop.mjs';

const fixture = async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'design-review-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const put = async (path, value) => {
    await mkdir(dirname(`${root}/${path}`), { recursive: true });
    await writeFile(
      `${root}/${path}`,
      typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value),
    );
  };
  const path = 'openspec/changes/example/design-manifest.json';
  const reportPath = 'openspec/changes/example/review.json';
  for (const p of [
    'design-system/tokens.json',
    'design-system/authority.json',
    'docs/design/contract.md',
    'scripts/design/code.mjs',
    'frontend/web/src/card.css',
    'frontend/ios/Somewhere/Card.swift',
    'frontend/android/app/src/main/Card.kt',
    'reference.html',
  ])
    await put(p, 'source');
  await put('design-system/version.json', { version: '1.0.0' });
  await put('design-system/registry.json', {
    manifests: [path],
    legacyChanges: [],
    nonUiChanges: [],
  });
  const manifest = {
    schemaVersion: 1,
    id: 'example',
    designVersion: '1.0.0',
    phase: 'review',
    approval: 'user approved',
    implementer: 'author',
    report: reportPath,
    screens: [
      {
        id: 'card',
        platforms: ['web', 'ios', 'android'],
        states: ['default'],
        inputs: ['frontend/web/src', 'frontend/ios/Somewhere', 'frontend/android/app/src/main'],
        references: ['reference.html'],
        contracts: ['docs/design/contract.md'],
        tasks: { web: ['1.1'], ios: ['1.2'], android: ['1.3'] },
      },
    ],
  };
  await put(path, manifest);
  await put(
    'openspec/changes/example/tasks.md',
    '- [ ] 1.1 Web\n- [ ] 1.2 iOS\n- [ ] 1.3 Android\n',
  );
  const { inputHash } = await readManifest(root, path);
  const evidence = [];
  for (const [kind, p] of [
    ['actual', 'evidence/actual.png'],
    ['reference', 'evidence/reference.png'],
    ['interaction', 'evidence/actions.txt'],
  ]) {
    const data =
      kind === 'interaction'
        ? kind
        : Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9mQAAAAASUVORK5CYII=',
            'base64',
          );
    await put(p, data);
    evidence.push({ path: p, sha256: sha256(data), kind });
  }
  const report = {
    schemaVersion: 1,
    manifest: path,
    inputHash,
    reviewer: 'independent-agent',
    reviewedAt: '2026-10-26T18:00:00Z',
    mode: 'live',
    environment: 'isolated test fixture',
    summary: 'test',
    checks: ['web', 'ios', 'android'].map((platform) => ({
      screen: 'card',
      platform,
      state: 'default',
      status: 'pass',
      observations: 'checked fixture',
      capture: {
        sourceHash: inputHash,
        fixtureHash: sha256('fixture'),
        runtime: 'test',
        os: 'test',
        viewport: '390x844',
        fonts: ['test'],
        locale: 'ru-RU',
        timezone: 'Europe/Moscow',
        textScale: 1,
        capturedAt: '2026-10-26T18:00:00Z',
      },
      evidence,
    })),
  };
  await put(reportPath, report);
  return { root, put, path, reportPath, manifest, report };
};

test('current complete report passes; phase transition does not stale it', async (t) => {
  const f = await fixture(t);
  await reviewStatus(f.root, f.path, { ready: true });
  f.manifest.phase = 'complete';
  await f.put(f.path, f.manifest);
  assert.equal((await reviewStatus(f.root, f.path)).valid, true);
});

for (const input of [
  'frontend/web/src/card.css',
  'frontend/ios/Somewhere/Card.swift',
  'frontend/android/app/src/main/Card.kt',
  'reference.html',
  'design-system/tokens.json',
  'docs/design/contract.md',
]) {
  test(`changed input blocks ready: ${input}`, async (t) => {
    const f = await fixture(t);
    await f.put(input, 'changed');
    await assert.rejects(() => reviewStatus(f.root, f.path, { ready: true }), /stale/);
  });
}

test('missing platform cannot pass all clients; platform gate scopes correctly', async (t) => {
  const f = await fixture(t);
  f.report.checks.pop();
  await f.put(f.reportPath, f.report);
  await assert.rejects(() => reviewStatus(f.root, f.path, { ready: true }), /not passed/);
  await reviewStatus(f.root, f.path, { ready: true, platform: 'web' });
});

test('false independent review is rejected', async (t) => {
  const f = await fixture(t);
  f.report.reviewer = 'author';
  await f.put(f.reportPath, f.report);
  await assert.rejects(() => reviewStatus(f.root, f.path, { ready: true }), /independent/);
});

test('evidence tampering and omitted interactions are rejected', async (t) => {
  const f = await fixture(t);
  await f.put('evidence/actual.png', 'different');
  await assert.rejects(() => reviewStatus(f.root, f.path, { ready: true }), /Evidence changed/);
  await f.put(
    'evidence/actual.png',
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9mQAAAAASUVORK5CYII=',
      'base64',
    ),
  );
  f.report.checks[0].evidence = f.report.checks[0].evidence.filter((e) => e.kind !== 'interaction');
  await f.put(f.reportPath, f.report);
  await assert.rejects(() => reviewStatus(f.root, f.path, { ready: true }), /lacks/);
});

test('historical screenshots cannot pass current UI', async (t) => {
  const f = await fixture(t);
  f.report.mode = 'historical';
  await f.put(f.reportPath, f.report);
  await assert.rejects(() => reviewStatus(f.root, f.path, { ready: true }), /Historical/);
});

test('unknown schema fields and escaped input paths are rejected', async (t) => {
  const f = await fixture(t);
  f.manifest.assumePass = true;
  await f.put(f.path, f.manifest);
  await assert.rejects(() => readManifest(f.root, f.path), /additional properties/);
  delete f.manifest.assumePass;
  f.manifest.screens[0].inputs = ['../outside'];
  await f.put(f.path, f.manifest);
  await assert.rejects(() => readManifest(f.root, f.path), /Unsafe/);
  await symlink('/tmp', `${f.root}/linked`);
  f.manifest.screens[0].inputs = ['linked'];
  await f.put(f.path, f.manifest);
  await assert.rejects(() => readManifest(f.root, f.path), /Symlink/);
});

test('Stop asks for review once, but permits checkpoint and explicit pause', async (t) => {
  const f = await fixture(t);
  await rm(`${f.root}/${f.reportPath}`);
  assert.equal((await stopDecision({}, f.root)).decision, 'block');
  assert.deepEqual(await stopDecision({ stop_hook_active: true }, f.root), {});
  for (const phase of ['checkpoint', 'paused']) {
    f.manifest.phase = phase;
    await f.put(f.path, f.manifest);
    assert.deepEqual(await stopDecision({}, f.root), {});
  }
  await assert.rejects(() => reviewStatus(f.root, f.path, { ready: true }), /ENOENT/);
});

test('closing a UI checkbox demands review even while phase is checkpoint', async (t) => {
  const f = await fixture(t);
  await rm(`${f.root}/${f.reportPath}`);
  f.manifest.phase = 'checkpoint';
  await f.put(f.path, f.manifest);
  await reviewStatus(f.root, f.path);
  await f.put(
    'openspec/changes/example/tasks.md',
    '- [x] 1.1 Web\n- [ ] 1.2 iOS\n- [ ] 1.3 Android\n',
  );
  await assert.rejects(() => reviewStatus(f.root, f.path), /ENOENT/);
  assert.equal((await stopDecision({}, f.root)).decision, 'block');
});

test('renaming a task and adding a state invalidate acceptance', async (t) => {
  const f = await fixture(t);
  f.manifest.screens[0].states.push('error');
  await f.put(f.path, f.manifest);
  await assert.rejects(() => reviewStatus(f.root, f.path, { ready: true }), /not passed/);
  await f.put('openspec/changes/example/tasks.md', '- [ ] 2.1 Different task');
  await assert.rejects(() => readManifest(f.root, f.path), /Missing UI task/);
});

test('a pass needs reproducible capture provenance', async (t) => {
  const f = await fixture(t);
  delete f.report.checks[0].capture;
  await f.put(f.reportPath, f.report);
  await assert.rejects(() => reviewStatus(f.root, f.path, { ready: true }), /capture provenance/);
});

test('each declared platform must have hashed implementation inputs', async (t) => {
  const f = await fixture(t);
  f.manifest.screens[0].inputs = ['frontend/web/src'];
  await f.put(f.path, f.manifest);
  await assert.rejects(() => readManifest(f.root, f.path), /Missing platform inputs/);
});

test('scenario IDs cannot change the platform key separator', async (t) => {
  const f = await fixture(t);
  f.manifest.screens[0].id = 'card/ios';
  await f.put(f.path, f.manifest);
  await assert.rejects(
    () => reviewStatus(f.root, f.path, { ready: true, platform: 'web' }),
    /pattern/,
  );
});

test('local editor state does not invalidate the reproducible source hash', async (t) => {
  const f = await fixture(t);
  await f.put('frontend/ios/Somewhere/xcuserdata/local.xcuserstate', 'local editor');
  await f.put('frontend/web/src/.DS_Store', 'local finder');
  assert.equal((await reviewStatus(f.root, f.path, { ready: true })).valid, true);
});
