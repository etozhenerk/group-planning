import { readFileSync } from 'node:fs';
import { previewSchema } from './meetingSchema';
const root = new URL('../', import.meta.url);
for (const name of ['public-preview.json', 'signed-preview.json', 'missing-identity-preview.json', 'no-identity-service-preview.json']) {
  const raw: unknown = JSON.parse(readFileSync(new URL(name, root), 'utf8'));
  const result = previewSchema.parse(raw);
  console.log(JSON.stringify({ fixture: name, schemaCommit: '3e25d63c', parsed: true, hasOrganizer: result.organizer !== undefined, title: result.title, myRsvp: result.my_rsvp }));
}
