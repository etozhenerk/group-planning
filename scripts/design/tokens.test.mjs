import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateTokens, resolveTokens } from './tokens.mjs';
import { renderTokens } from './formats.mjs';
import { generate } from './generate.mjs';
import { collectLiterals, checkLiterals, pruneLiterals, uiRoots } from './literals.mjs';

const baseTokens = JSON.parse(
  await readFile(new URL('../../design-system/tokens.json', import.meta.url), 'utf8'),
);
const dimension = (v) => ({
  $type: 'dimension',
  $value: v,
  $description: 'Размер',
});

test('DTCG aliases preserve values and platform units', async () => {
  const tokens = await resolveTokens({
    ...baseTokens,
    space: { s4: dimension({ value: 4, unit: 'px' }) },
    component: { inset: dimension('{space.s4}') },
    motion: {
      fast: {
        $type: 'duration',
        $value: { value: 220, unit: 'ms' },
        $description: 'Движение',
      },
    },
  });
  const output = renderTokens(tokens, '1.0.0');
  assert.match(
    output['frontend/web/src/app/styles/design-tokens.css'],
    /--ds-component-inset: 4px/,
  );
  assert.match(
    output['frontend/ios/Somewhere/UI/DesignTokens.swift'],
    /componentInset = CGFloat\(4\)/,
  );
  assert.match(
    output['frontend/ios/Somewhere/UI/DesignTokens.swift'],
    /motionFast = 0.22/,
  );
  assert.match(
    output[
      'frontend/android/app/src/main/java/dev/groupplanning/android/ui/theme/DesignTokens.kt'
    ],
    /componentInset = 4.dp/,
  );
});

test('shared chat thresholds reach native while web routing breakpoints stay web-only', async () => {
  const output = renderTokens(await resolveTokens(baseTokens), '1.3.1');
  const swift = output['frontend/ios/Somewhere/UI/DesignTokens.swift'];
  const kotlin =
    output[
      'frontend/android/app/src/main/java/dev/groupplanning/android/ui/theme/DesignTokens.kt'
    ];

  assert.match(swift, /breakpointChatCompactHeight = CGFloat\(500\)/);
  assert.match(swift, /breakpointChatNarrowWidth = CGFloat\(350\)/);
  assert.match(kotlin, /breakpointChatCompactHeight = 500\.dp/);
  assert.match(kotlin, /breakpointChatNarrowWidth = 350\.dp/);

  for (const native of [swift, kotlin]) {
    assert.doesNotMatch(native, /breakpointMobile|breakpointTablet/);
  }

  assert.match(
    output['frontend/web/src/app/styles/design-tokens.css'],
    /--ds-breakpoint-mobile: 740px/,
  );
  assert.match(
    output['frontend/web/src/app/styles/design-tokens.css'],
    /--ds-breakpoint-tablet: 1100px/,
  );
});

for (const [label, source, error] of [
  ['cycle', { a: dimension('{b}'), b: dimension('{a}') }, /cycle/],
  ['unknown alias', { a: dimension('{missing}') }, /Unknown/],
  [
    'type mismatch',
    {
      a: dimension('{b}'),
      b: { $type: 'number', $value: 4, $description: 'Количество' },
    },
    /mismatch/,
  ],
  ['unsupported unit', { a: dimension({ value: 1, unit: 'rem' }) }, /Invalid dimension/],
  [
    'unknown type',
    { a: { $type: 'shadow', $value: {}, $description: 'Тень' } },
    /Unsupported/,
  ],
  ['negative size', { a: dimension({ value: -4, unit: 'px' }) }, /Invalid dimension/],
])
  test(`reject ${label}`, () => assert.throws(() => validateTokens(source), error));

test('generation is reproducible and hand edit is rejected', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'design-generate-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(`${root}/design-system`);
  await writeFile(
    `${root}/design-system/tokens.json`,
    JSON.stringify({
      ...baseTokens,
      space: { ...baseTokens.space, s4: dimension({ value: 4, unit: 'px' }) },
    }),
  );
  await writeFile(`${root}/design-system/version.json`, '{"version":"1.0.0"}');
  const paths = await generate(false, root);
  const before = await Promise.all(paths.map((p) => readFile(`${root}/${p}`, 'utf8')));
  await generate(false, root);
  assert.deepEqual(
    await Promise.all(paths.map((p) => readFile(`${root}/${p}`, 'utf8'))),
    before,
  );
  await generate(true, root);
  await writeFile(`${root}/${paths[0]}`, 'manual color');
  await assert.rejects(() => generate(true, root), /Generated file differs/);
});

test('web token modules preserve the flat public API without oversized source files', async () => {
  const output = renderTokens(await resolveTokens(baseTokens), '1.4.0');
  const prefix = 'frontend/web/src/shared/config/design-tokens/';
  assert.match(
    output[`${prefix}tokens.ts`],
    /\.\.\.foundationTokens, \.\.\.componentTokens/,
  );
  assert.match(output[`${prefix}foundations.ts`], /breakpointChatCompactHeight: "500px"/);
  assert.match(
    output[`${prefix}components.ts`],
    /componentEmojiDockPreferredHeight: "284px"/,
  );
  for (const file of ['tokens.ts', 'foundations.ts', 'components.ts']) {
    assert.ok(
      output[`${prefix}${file}`].split('\n').length <= 230,
      `${file} remains a focused data module`,
    );
  }
});

test('legacy entry allows original occurrence, not copying or new size/color', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'design-literals-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of [...uiRoots, 'design-system'])
    await mkdir(`${root}/${dir}`, { recursive: true });
  const file = `${root}/frontend/web/src/card.css`;
  await writeFile(file, '.card { color: #24252a; padding: 12px; }');
  const found = await collectLiterals(root);
  await writeFile(
    `${root}/design-system/legacy-literals.json`,
    JSON.stringify({ entries: found.map((x) => ({ ...x, count: 1 })) }),
  );
  await checkLiterals(root, []);
  await writeFile(file, '.card { color: #24252a; padding: 13px; }');
  await assert.rejects(() => checkLiterals(root, []), /New UI literals/);
  await writeFile(file, '.card { color: #ffffff; padding: 12px; }');
  await assert.rejects(() => checkLiterals(root, []), /New UI literals/);
  await writeFile(
    file,
    '.card { color: #24252a; padding: 12px; }\n.card { color: #24252a; padding: 12px; }',
  );
  await assert.rejects(() => checkLiterals(root, []), /New UI literals/);
  await writeFile(file, '.card { color: var(--ds-color-text); }');
  await assert.rejects(() => checkLiterals(root, []), /design:prune/);
  await pruneLiterals(root, []);
  await checkLiterals(root, []);
  await writeFile(file, '.card { color: #24252a; padding: 12px; }');
  await assert.rejects(() => checkLiterals(root, []), /New UI literals/);
});
