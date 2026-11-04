import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  datePollSchema,
  entrySchema,
  preparationTaskSchema,
  previewSchema,
} from '@/shared/api';
import { getParticipants } from '@/entities/meeting/api/read';
import { mapDatePoll } from '@/entities/meeting/lib/mapDatePoll';
import { mapEntry } from '@/entities/meeting/lib/mapFeed';
import { mapInvitation } from '@/entities/meeting/lib/mapMeeting';
import { mapPreparationTask } from '@/entities/meeting/lib/mapPreparationTask';
import fs from 'node:fs';
import { z } from 'zod';

const user = {
  id: '00000000-0000-4000-8000-000000000003',
  display_name: 'Лена',
  avatar_url: 'https://images.example.test/lena.jpg',
  email: 'private@example.test',
  phone: '+79990000000',
};

const publicUser = {
  id: user.id,
  displayName: user.display_name,
  avatarUrl: user.avatar_url,
};

const fixtures = z
  .array(z.object({ name: z.string(), body: z.record(z.string(), z.unknown()) }))
  .parse(
    JSON.parse(
      fs.readFileSync(
        new URL('../../../../../../contracts/fixtures/cases.json', import.meta.url),
        'utf8',
      ),
    ),
  );

const body = (name: string) => {
  const fixture = fixtures.find((item) => item.name === name);

  if (!fixture) {
    throw new Error(name);
  }

  return fixture.body;
};

afterEach(() => vi.unstubAllGlobals());

describe('public identity across meeting responses', () => {
  it('retains the same photo in participants without copying private contacts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          participants: [{ user, role: 'guest', rsvp: 'going', rsvp_revision: '1' }],
        }),
      ),
    );
    const participants = await getParticipants('meeting');
    expect(participants[0]?.user).toEqual(publicUser);
  });

  it('retains author and sender photos in feed and invitation mapping', () => {
    const entry = mapEntry(
      entrySchema.parse({
        ...body('late-message-retry'),
        actor: user,
        sender: { ...user, kind: 'user' },
      }),
    );

    const invitation = mapInvitation(
      previewSchema.parse({ ...body('undated-invitation'), organizer: user }),
    );

    expect(entry.actor).toEqual(publicUser);
    expect(entry.sender).toEqual({ ...publicUser, kind: 'user' });
    expect(invitation.organizer).toEqual(publicUser);
  });

  it('retains visible poll identities and does not invent hidden voters', () => {
    const fixture = fixtures.find((item) => item.name.startsWith('date-poll-'));

    if (!fixture) {
      throw new Error('date poll fixture missing');
    }

    const wire = datePollSchema.parse(fixture.body);
    const poll = mapDatePoll({
      ...wire,
      author: user,
      options: wire.options.map((option, index) => ({
        ...option,
        voters: index === 0 ? [user] : null,
      })),
    });

    expect(poll.author).toEqual(publicUser);
    expect(poll.options[0]?.voters).toEqual([publicUser]);
    expect(poll.options[1]?.voters).toBeNull();
  });

  it('normalizes omitted or removed photos in every task identity', () => {
    const wire = preparationTaskSchema.parse(body('preparation-task-accepted'));
    const task = mapPreparationTask({
      ...wire,
      author: user,
      recipient: user,
      assignee: { ...user, avatar_url: null },
      updated_by: { id: user.id, display_name: user.display_name },
    });

    expect(task.author).toEqual(publicUser);
    expect(task.recipient).toEqual(publicUser);
    expect(task.assignee?.avatarUrl).toBeNull();
    expect(task.updatedBy.avatarUrl).toBeNull();
  });
});
