const text = { type: 'string', minLength: 1 };
const identifier = { type: 'string', pattern: '^[a-z0-9][a-z0-9-]*$' };
const identifiers = { type: 'array', items: identifier, minItems: 1, uniqueItems: true };
const texts = { type: 'array', items: text, minItems: 1, uniqueItems: true };
const hash = { type: 'string', pattern: '^[0-9a-f]{64}$' };
const platform = { enum: ['web', 'ios', 'android'] };
const object = (properties, required = Object.keys(properties)) => ({
  type: 'object',
  additionalProperties: false,
  properties,
  required,
});
export const manifestSchema = object({
  schemaVersion: { const: 1 },
  id: identifier,
  designVersion: text,
  phase: { enum: ['checkpoint', 'review', 'complete', 'paused'] },
  approval: text,
  implementer: text,
  report: text,
  screens: {
    type: 'array',
    minItems: 1,
    items: object({
      id: identifier,
      platforms: { type: 'array', minItems: 1, uniqueItems: true, items: platform },
      states: identifiers,
      inputs: texts,
      references: texts,
      contracts: texts,
      tasks: object({ web: texts, ios: texts, android: texts }, []),
    }),
  },
});
const capture = object({
  sourceHash: hash,
  fixtureHash: hash,
  runtime: text,
  os: text,
  viewport: text,
  fonts: texts,
  locale: text,
  timezone: text,
  textScale: { type: 'number', exclusiveMinimum: 0 },
  capturedAt: text,
});
export const reportSchema = object({
  schemaVersion: { const: 1 },
  manifest: text,
  inputHash: hash,
  reviewer: text,
  reviewedAt: text,
  mode: { enum: ['live', 'historical'] },
  environment: text,
  summary: text,
  checks: {
    type: 'array',
    minItems: 1,
    items: object(
      {
        screen: identifier,
        platform,
        state: identifier,
        status: { enum: ['pass', 'needs-fixes', 'blocked'] },
        observations: text,
        capture,
        evidence: {
          type: 'array',
          items: object({
            path: text,
            sha256: hash,
            kind: { enum: ['actual', 'reference', 'interaction'] },
          }),
        },
      },
      ['screen', 'platform', 'state', 'status', 'observations', 'evidence'],
    ),
  },
});
