import fs from 'node:fs';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import {
  entrySchema,
  previewSchema,
  responseSchema,
  revision,
  invitationsSchema,
  placePollSchema,
} from '@/shared/api';
import { mapEntry, mergeEntries } from '@/entities/meeting/lib/mapFeed';

const raw: unknown = JSON.parse(
  fs.readFileSync(
    new URL('../../../../../../contracts/fixtures/cases.json', import.meta.url),
    'utf8',
  ),
);

const fixtures = z.array(z.object({ name: z.string(), body: z.unknown() })).parse(raw);
const body = (name: string): unknown => {
  const fixture = fixtures.find((item) => item.name === name);

  if (!fixture) {
    throw new Error(name);
  }

  return fixture.body;
};

describe('shared API fixtures', () => {
  it('decodes place votes, large revisions and every final state', () => {
    const open = placePollSchema.parse(body('place-poll-open'));
    expect(open.previous_place).toBeNull();
    expect(open.my_vote).toBe('for');
    expect([open.votes_for, open.votes_against]).toEqual([2, 1]);
    expect(open.revision).toBe('9007199254740993');
    expect(open.can_vote).toBe(true);
    expect(open.closed_at).toBeNull();

    for (const state of ['applied', 'rejected', 'cancelled']) {
      const poll = placePollSchema.parse(body(`place-poll-${state}`));
      expect(poll.state).toBe(state);
      expect(poll.can_vote).toBe(false);
      expect(poll.closed_at).not.toBeNull();
    }
  });
  it('decodes saved invitations with only the current maybe answer', () => {
    const page = invitationsSchema.parse(body('saved-invitations'));
    expect(page.invitations[0]?.preview.my_rsvp).toBe('maybe');
    expect(page.next_cursor).toBeNull();
  });
  it('keeps missing date, place and own answer as null', () => {
    const data = previewSchema.parse(body('undated-invitation'));
    expect(data.starts_at).toBeNull();
    expect(data.place).toBeNull();
    expect(data.my_rsvp).toBeNull();
  });
  it('retains decimal precision and safely handles an unknown entry', () => {
    const entry = mapEntry(entrySchema.parse(body('unknown-feed-kind')));
    expect(entry.sequence).toBe('9007199254740993');
    expect(entry.supported).toBe(false);
    expect(entry.text).toBeNull();
  });
  it('accepts all three answers and a stale retry with closed access', () => {
    for (const name of ['rsvp-going', 'rsvp-maybe', 'rsvp-not_going']) {
      expect(responseSchema.safeParse(body(name)).success).toBe(true);
    }

    expect(
      responseSchema.parse(body('late-going-retry-after-maybe')).can_access_feed,
    ).toBe(false);
  });
  it('does not round revision values into JS numbers', () => {
    expect(revision.safeParse(9007199254740992).success).toBe(false);
    expect(revision.safeParse('18446744073709551616').success).toBe(false);
  });
  it('deduplicates by ID and sorts sequence as decimal values', () => {
    const base = mapEntry(entrySchema.parse(body('late-message-retry')));
    const a = { ...base, id: 'a', sequence: '9007199254740993' };
    const b = { ...base, id: 'b', sequence: '9007199254740992' };
    expect(mergeEntries([a], [b, a]).map((entry) => entry.id)).toEqual(['b', 'a']);
  });
});
