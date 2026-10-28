import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { contract, responseSchema, root, validate } from './check-api-contract.mjs';

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'somewhere-api-'));
try {
  const capture = path.join(temporary, 'responses.json');
  const result = spawnSync(process.env.GO_BIN || 'go', ['test', '-count=1', '-run', '^(TestOpenAPIResponses|TestAuthOpenAPIResponses|TestMeetingOpenAPIResponses|TestCalendarOpenAPIResponses|TestDatePollOpenAPIResponses|TestSavedInvitationsOpenAPIResponses|TestPlacePollOpenAPIResponses|TestPreparationTaskOpenAPIResponses|TestCoverOpenAPIResponses|TestAccountDeletionOpenAPIResponses|TestExperienceOpenAPIResponses|TestSupportOpenAPIResponses|TestAlbumExportOpenAPIResponses)$', './internal/httpapi'], {
    cwd: path.join(root, 'backend'),
    env: { ...process.env, SOMEWHERE_CONTRACT_CAPTURE: capture },
    encoding: 'utf8', timeout: 120_000,
  });
  assert.equal(result.status, 0, `HTTP tests failed: ${result.error || ''}\n${result.stdout}\n${result.stderr}`);
  const responses = [...JSON.parse(fs.readFileSync(capture, 'utf8')), ...JSON.parse(fs.readFileSync(`${capture}.auth`, 'utf8')), ...JSON.parse(fs.readFileSync(`${capture}.meetings`, 'utf8')), ...JSON.parse(fs.readFileSync(`${capture}.calendar`, 'utf8')), ...JSON.parse(fs.readFileSync(`${capture}.polls`, 'utf8')), ...JSON.parse(fs.readFileSync(`${capture}.invitations`, 'utf8')), ...JSON.parse(fs.readFileSync(`${capture}.place-polls`, 'utf8')), ...JSON.parse(fs.readFileSync(`${capture}.preparation-tasks`, 'utf8')), ...JSON.parse(fs.readFileSync(`${capture}.covers`, 'utf8')), ...JSON.parse(fs.readFileSync(`${capture}.accounts`, 'utf8')), ...JSON.parse(fs.readFileSync(`${capture}.experience`, 'utf8')), ...JSON.parse(fs.readFileSync(`${capture}.support`, 'utf8')), ...JSON.parse(fs.readFileSync(`${capture}.album-export`, 'utf8'))];
  assert(responses.length >= 6, 'No captured HTTP responses');
  for (const response of responses) {
    const item = contract.paths[response.path];
    assert(item, `Undocumented route ${response.path}`);
    let schema;
    if (response.status === 405) {
      assert(!item[response.method], '405 for an allowed operation');
      schema = responseSchema(item.get, response.status);
    } else {
      const operation = item[response.method];
      assert(operation?.['x-implemented'], `Unimplemented operation ${response.path}`);
      if (response.status === 204 || response.status === 303) {
        assert(operation.responses[String(response.status)], 'Undocumented empty response');
        assert.equal(response.body, null);
        if (response.status === 303) assert(response.headers.Location?.[0], 'Missing callback Location');
      } else if (response.headers['Content-Type']?.[0] === 'application/zip') {
        const binary = operation.responses[String(response.status)]?.content?.['application/zip']?.schema;
        assert.equal(binary?.format, 'binary');
        const archive = Buffer.from(response.body, 'base64');
        assert.equal(archive.length, Number(response.headers['Content-Length']?.[0]));
        assert.equal(archive.subarray(0, 4).toString('hex'), '504b0304');
      } else {
        schema = responseSchema(operation, response.status);
      }
    }
    if (schema) validate(schema, response.body);
    assert.equal(response.headers['Cache-Control']?.[0], 'no-store');
    validate('UUID', response.headers['X-Request-Id']?.[0]);
  }
  console.log(`HTTP contract: ${responses.length} actual responses match OpenAPI.`);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
