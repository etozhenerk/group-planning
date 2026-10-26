import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const text = { type: 'string', minLength: 1 };
const list = (items, minItems = 1) => ({ type: 'array', items, minItems, uniqueItems: true });
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
const choices = (...values) => ({ enum: values });
export const platforms = ['backend', 'web', 'ios', 'android', 'monitoring'];
const platform = choices(...platforms);
const hash = { type: 'string', pattern: '^[a-f0-9]{64}$' };
const time = { type: 'string', format: 'date-time' };
const testRef = object({ path: text, selector: text, runner: text, level: choices('unit', 'integration', 'e2e') });
const coverage = object({ status: choices('manual', 'planned', 'partial', 'automated'), health: choices('stable', 'flaky', 'quarantined', 'unknown'), tests: list(testRef, 0) });
const evidence = object({ path: text, sha256: hash, kind: choices('screenshot', 'interaction', 'log', 'video', 'raw') });
const caseSchema = object({
  id: { type: 'string', pattern: '^TC-[A-Z0-9-]+$' }, title: text,
  lifecycle: choices('draft', 'active', 'archived'), level: choices('unit', 'integration', 'e2e'),
  risk: choices('critical', 'high', 'normal'),
  source: object({ path: text, requirement: text, scenario: text, sha256: hash }),
  platforms: list(platform), preconditions: list(text),
  steps: list(object({ action: text, expected: text })), cleanup: list(text),
  automation: { type: 'object', minProperties: 1, additionalProperties: false,
    properties: Object.fromEntries(platforms.map((p) => [p, coverage])) },
});
const environment = object({ id: text, profile: text, platform, application: { const: 'product' }, url: text, build: text,
  os: text, device: text, locale: text, timezone: text, data: text, backend: text });
const artifact = object({ component: platform, version: text, manifestHash: hash, files: list(object({ path: text, sha256: hash })) });
const expected = object({ id: text, caseId: text, environment: text, mode: choices('manual', 'automated') });
const plan = object({ schemaVersion: { const: 1 }, id: text, purpose: choices('feature', 'release'),
  component: platform, createdAt: time, implementer: text, catalogHash: hash, sourceHash: hash,
  selectedCases: list(text), environments: list(environment), expected: list(expected), suites: list(text, 0),
  artifact: { anyOf: [artifact, { type: 'null' }] },
});
const check = object({ id: text, status: choices('not_run', 'running', 'passed', 'failed', 'blocked', 'skipped'),
  executor: object({ kind: choices('agent', 'human', 'runner'), id: text }),
  startedAt: time, finishedAt: time, actual: text, defect: { type: 'string' }, evidence: list(evidence, 0) });
const suite = object({ id: text, status: choices('passed', 'failed', 'blocked'),
  commandHash: hash, startedAt: time, finishedAt: time, exitCode: { type: ['integer', 'null'] },
  evidence: list(evidence), actual: text });
const schemas = {
  case: caseSchema, environment, plan,
  config: object({ schemaVersion: { const: 1 }, sources: list(text), excludedSources: list(object({ path: text, reason: text }), 0),
    profiles: { type: 'object', minProperties: 1, additionalProperties: object({ platform }) },
    releaseProfiles: { type: 'object', minProperties: 1, additionalProperties: list(text) },
    inputs: { type: 'object', minProperties: 1, additionalProperties: list(text) },
    runners: { type: 'object', minProperties: 1, additionalProperties: object({ platforms: list(platform), cwd: text, command: { type: 'array', minItems: 1, items: text }, scope: choices('source', 'artifact'), required: { type: 'boolean' } }) },
    manifests: list(text, 0), legacyChanges: list(text, 0), nonProductChanges: list(text, 0),
  }),
  run: object({ schemaVersion: { const: 1 }, planHash: hash, checks: list(check, 0), suites: list(suite, 0) }),
  manifest: object({ schemaVersion: { const: 1 }, change: text, phase: choices('checkpoint', 'review', 'complete', 'paused'),
    plan: text, run: text, tasks: list(object({ id: text, cases: list(text), platforms: list(platform) })),
    exemptTasks: list(object({ id: text, reason: text }), 0) }),
};
const ajv = new Ajv({ allErrors: true, strict: true, allowUnionTypes: true });
addFormats(ajv);
const validators = Object.fromEntries(Object.entries(schemas).map(([name, schema]) => [name, ajv.compile(schema)]));
export const validate = (name, value) => {
  const valid = validators[name];
  if (!valid(value)) throw new Error(`${name}: ${ajv.errorsText(valid.errors)}`);
  return value;
};
