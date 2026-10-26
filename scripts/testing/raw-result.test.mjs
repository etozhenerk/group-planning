import test from 'node:test';
import assert from 'node:assert/strict';
import { rawPassed } from './raw-result.mjs';

test('Playwright requires exact project, current start and a single successful attempt', () => {
  const time = new Date().toISOString();
  const ref = { path: 'frontend/web/tests/entry.spec.ts', selector: 'entry' };
  const result = { status: 'passed', startTime: time };
  const run = { projectName: 'chromium', expectedStatus: 'passed', results: [result] };
  const value = { suites: [{ specs: [{ file: 'tests/entry.spec.ts', title: 'entry', tests: [run] }] }] };
  const check = () => rawPassed(JSON.stringify(value), ref, { device: 'chromium' }, time);
  assert.equal(check(), true);
  result.startTime = '2020-01-01T00:00:00Z'; assert.equal(check(), false);
  result.startTime = time; run.projectName = 'webkit'; assert.equal(check(), false);
  run.projectName = 'chromium'; run.results.push({ ...result }); assert.equal(check(), false);
});

test('Go requires fresh run and pass for exact test/package, never skip or cached history', () => {
  const time = new Date().toISOString();
  const ref = { path: 'backend/internal/domain/entry_test.go', selector: 'TestEntry' };
  const events = ['run', 'pass'].map((Action) => ({ Action, Time: time, Test: 'TestEntry', Package: 'example/internal/domain' }));
  const check = () => rawPassed(events.map((e) => JSON.stringify(e)).join('\n'), ref, {}, time);
  assert.equal(check(), true);
  events[1].Action = 'skip'; assert.equal(check(), false);
  events[1].Action = 'pass'; events[0].Time = '2020-01-01T00:00:00Z'; assert.equal(check(), false);
});

test('unknown result formats and skipped Vitest assertions cannot prove pass', () => {
  const time = new Date().toISOString();
  assert.equal(rawPassed('{"status":"passed"}', { path: 'x.ts', selector: 'x' }, {}, time), false);
  const value = { testResults: [{ name: '/root/x.ts', startTime: Date.now(), assertionResults: [{ fullName: 'x', status: 'pending' }] }] };
  assert.equal(rawPassed(JSON.stringify(value), { path: 'x.ts', selector: 'x' }, {}, time), false);
});
