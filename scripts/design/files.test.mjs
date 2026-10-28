import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { digestFiles, treeFiles } from './files.mjs';

test('source fingerprints match clean checkouts without private dotenv files', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'somewhere-inputs-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'backend'));
  const put = (name, value) => writeFile(join(root, 'backend', name), value);
  await put('main.go', 'package main');
  await put('.env.example', 'SOMEWHERE_AUTH_ENABLED=true');
  await put('.env.yandex.example', 'SOMEWHERE_YANDEX_CLIENT_ID=');
  const files = await treeFiles(root, ['backend']);
  const clean = await digestFiles(root, files);
  for (const name of ['.env', '.env.local', '.env.yandex.local']) {
    await put(name, 'synthetic private runtime value');
  }
  assert.deepEqual(await treeFiles(root, ['backend']), files);
  assert.equal(await digestFiles(root, await treeFiles(root, ['backend'])), clean);
  await put('.env.yandex.local', 'changed synthetic private runtime value');
  assert.equal(await digestFiles(root, await treeFiles(root, ['backend'])), clean);
  await put('.env.example', 'SOMEWHERE_AUTH_ENABLED=false');
  assert.notEqual(await digestFiles(root, await treeFiles(root, ['backend'])), clean);
  assert.deepEqual(files, ['backend/.env.example', 'backend/.env.yandex.example', 'backend/main.go']);
});

test('native machine overrides are excluded while shared build configuration stays hashed', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'somewhere-native-inputs-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'frontend/ios/Config'), { recursive: true });
  await mkdir(join(root, 'frontend/android'), { recursive: true });
  await writeFile(join(root, 'frontend/ios/Config/Development.xcconfig'), 'API = shared');
  await writeFile(join(root, 'frontend/android/gradle.properties'), 'shared=true');
  const files = await treeFiles(root, ['frontend']);
  const clean = await digestFiles(root, files);
  await writeFile(join(root, 'frontend/ios/Config/Local.xcconfig'), 'TEAM = private');
  await writeFile(join(root, 'frontend/android/local.properties'), 'sdk.dir=/local/sdk');
  await mkdir(join(root, 'frontend/android/.idea'), { recursive: true });
  await mkdir(join(root, 'frontend/android/.kotlin/sessions'), { recursive: true });
  await writeFile(join(root, 'frontend/android/.idea/workspace.xml'), '<local/>');
  await writeFile(join(root, 'frontend/android/.kotlin/sessions/compiler.salive'), 'alive');
  assert.deepEqual(await treeFiles(root, ['frontend']), files);
  assert.equal(await digestFiles(root, await treeFiles(root, ['frontend'])), clean);
  await writeFile(join(root, 'frontend/ios/Config/Development.xcconfig'), 'API = changed');
  assert.notEqual(await digestFiles(root, await treeFiles(root, ['frontend'])), clean);
});
