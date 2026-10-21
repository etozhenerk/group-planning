import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { parse } from 'yaml';

const directory = new URL('../../.github/workflows/', import.meta.url);
const workflows = new Map(
  readdirSync(directory).map((name) => [
    name.replace('.yaml', ''),
    parse(readFileSync(new URL(name, directory), 'utf8')),
  ]),
);

// GitHub path filters include dotfiles. The supported subset here is literal paths,
// * within a segment and a final **; no ordered exclusions or brace expressions.
const matchesPath = (file, pattern) => {
  assert.match(pattern, /^[a-zA-Z0-9_./*-]+$/);
  const expression = pattern.split('/').map((part, index, parts) => {
    if (part === '**') {
      assert.equal(index, parts.length - 1);
      return '.*';
    }
    return part.replaceAll('.', '\\.').replaceAll('*', '[^/]*');
  }).join('/');
  return new RegExp(`^${expression}$`).test(file);
};

const triggered = (files, event) => [...workflows]
  .filter(([, workflow]) => files.some((file) =>
    workflow.on[event].paths.some((pattern) => matchesPath(file, pattern))))
  .map(([name]) => name)
  .sort();

const cases = [
  ['iOS source', ['frontend/ios/Somewhere/App/SomewhereApp.swift'], ['ios']],
  ['Android source', ['frontend/android/app/src/main/java/dev/groupplanning/android/ui/SomewhereApp.kt'], ['android']],
  ['Web source', ['frontend/web/src/app/App.tsx'], ['web']],
  ['Backend source', ['backend/internal/httpapi/router.go'], ['backend', 'contracts']],
  ['Mixed native change', ['frontend/ios/.swift-format', 'frontend/android/app/build.gradle.kts'], ['android', 'ios']],
  ['Product docs', ['docs/product/overview.md'], ['repository']],
  ['OpenAPI schema', ['contracts/openapi.yaml'], ['contracts']],
  ['Shared native fixtures', ['contracts/fixtures/cases.json'], ['android', 'contracts', 'ios']],
  ['Node dependency lock', ['package-lock.json'], ['contracts', 'repository', 'web']],
  ['Android workflow', ['.github/workflows/android.yaml'], ['android', 'repository']],
  ['iOS workflow', ['.github/workflows/ios.yaml'], ['ios', 'repository']],
  ['Common reporter', ['scripts/ci/report.py'], ['android', 'backend', 'contracts', 'ios', 'repository', 'web']],
];

for (const event of ['push', 'pull_request']) {
  for (const [label, files, expected] of cases) {
    test(`${event}: ${label}`, () => assert.deepEqual(triggered(files, event), expected));
  }
}

test('Every workflow supports manual runs and reports all stages after failures', () => {
  for (const [name, workflow] of workflows) {
    assert.ok(Object.hasOwn(workflow.on, 'workflow_dispatch'), name);
    assert.equal(workflow.jobs.summary.if, 'always()', name);
    assert.deepEqual(
      [...workflow.jobs.summary.needs].sort(),
      Object.keys(workflow.jobs).filter((job) => job !== 'summary').sort(),
      name,
    );
  }
});

test('Platform build, checkers and tests are independent; failures are never ignored', () => {
  for (const name of ['web', 'backend', 'ios', 'android']) {
    for (const stage of ['build', 'checkers', 'tests']) {
      const job = workflows.get(name).jobs[stage];
      assert.ok(job, `${name}/${stage}`);
      assert.equal(job.needs, undefined);
      assert.equal(job['continue-on-error'], undefined);
      const report = job.steps.find((step) => step.id === 'report');
      assert.equal(report.if, 'always()');
      for (const step of job.steps) assert.equal(step['continue-on-error'], undefined);
    }
  }
});
