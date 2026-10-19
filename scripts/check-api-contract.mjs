import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const contract = YAML.parse(fs.readFileSync(`${root}contracts/openapi.yaml`, 'utf8'));
const fixtures = JSON.parse(fs.readFileSync(`${root}contracts/fixtures/cases.json`, 'utf8'));
const schemaID = 'urn:somewhere:api';
const ajv = new Ajv2020({ strict: true, allErrors: true });
addFormats(ajv);
const definitions = JSON.parse(JSON.stringify(contract.components.schemas).replaceAll('#/components/schemas/', '#/$defs/'));
ajv.addSchema({ $id: schemaID, $defs: definitions });

export function validate(schema, value) {
  const checker = ajv.getSchema(`${schemaID}#/$defs/${schema}`);
  assert(checker, `Unknown schema: ${schema}`);
  assert(checker(value), `${schema}: ${ajv.errorsText(checker.errors)}`);
}

export function responseSchema(operation, status) {
  let response = operation.responses[String(status)];
  assert(response, `Undocumented status ${status}`);
  if (response.$ref) response = contract.components.responses[response.$ref.split('/').at(-1)];
  const ref = response.content?.['application/json']?.schema?.$ref;
  assert(ref, `Response ${status} has no JSON schema`);
  return ref.split('/').at(-1);
}

for (const name of Object.keys(definitions)) {
  assert(ajv.getSchema(`${schemaID}#/$defs/${name}`), `Cannot compile ${name}`);
}
for (const fixture of fixtures) {
  validate(fixture.schema, fixture.body);
  if (fixture.path) {
    const operation = contract.paths[fixture.path]?.[fixture.method];
    assert(operation, `Fixture ${fixture.name}: missing operation`);
    assert.equal(responseSchema(operation, fixture.status), fixture.schema);
  }
}
const publicCase = fixtures.find(item => item.name === 'public-invitation');
assert(publicCase);
for (const key of ['organizer_id', 'participants', 'entries', 'messages', 'description', 'invitation_url']) {
  assert(!(key in publicCase.body), `Private field ${key} in public fixture`);
}
// Negative probes prove that these privacy/precision checks can actually fail.
for (const [schema, value] of [
  ['InvitationPreview', { ...publicCase.body, messages: [] }],
  ['InvitationPreview', { ...publicCase.body, starts_at: 'tomorrow' }],
  ['RsvpRequest', { answer: 'yes', expected_revision: '0' }],
  ['RsvpRequest', { answer: 'going', expected_revision: 9007199254740992 }],
  ['MessageRequest', { text: 'Привет', client_request_id: 'not-a-uuid' }],
]) {
  assert.throws(() => validate(schema, value), `Checker accepted invalid ${schema}`);
}
console.log(`API contract: ${Object.keys(definitions).length} schemas and ${fixtures.length} fixtures checked.`);
