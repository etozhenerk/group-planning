import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api';
import {
  createMessageQueue,
  matchingMessage,
} from '@/features/send-message/model/createMessageQueue';
import {
  emptyMessageDocument,
  readMessageDocument,
  updateMessageDocument,
} from '@/features/send-message/model/messageStore';
import { claimPrivateScope } from '@/shared/lib/private-store';
import type {
  MessageDocument,
  MessageIntent,
} from '@/features/send-message/model/messageStore';
import type { FeedEntry } from '@/entities/meeting';

vi.mock('@/shared/lib/private-store', () => ({
  claimPrivateScope: vi.fn(() => Promise.resolve(true)),
  withPrivateScopeLock: async (
    _scope: unknown,
    operation: (browserOwned: boolean) => Promise<void>,
  ) => {
    await operation(false);

    return true;
  },
}));
vi.mock('@/features/send-message/model/messageStore', async (original) => ({
  ...(await original<object>()),
  readMessageDocument: vi.fn(),
  updateMessageDocument: vi.fn(),
}));
const scope = { user: 'user', meeting: 'meeting', keys: [], epochs: [], generation: '0' };
const intent = (id: string): MessageIntent => ({
  id,
  text: id,
  state: 'queued',
  createdAt: '2026-10-27T00:00:00Z',
});

const ack = (item: MessageIntent): FeedEntry => ({
  id: `server:${item.id}`,
  meetingId: 'meeting',
  actor: { id: 'user', displayName: 'Автор' },
  clientRequestId: item.id,
  text: item.text,
  sequence: '101',
  kind: 'message',
  occurredAt: item.createdAt,
  supported: true,
  event: '',
});

let document: MessageDocument;
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  document = { ...emptyMessageDocument(), intents: [intent('one'), intent('two')] };
  vi.mocked(readMessageDocument).mockImplementation(() =>
    Promise.resolve(structuredClone(document)),
  );
  vi.mocked(updateMessageDocument).mockImplementation((_scope, change) => {
    document = change(document);

    return Promise.resolve(document);
  });
  vi.mocked(claimPrivateScope).mockResolvedValue(true);
});
afterEach(() => vi.useRealTimers());
const options = () => ({
  scope,
  active: () => true,
  send: vi.fn((item: MessageIntent) => Promise.resolve(ack(item))),
  accepted: vi.fn(),
  changed: vi.fn(),
  denied: vi.fn(),
  storageError: vi.fn(),
});

it('does not claim ownership for draft changes without outgoing messages', async () => {
  document = emptyMessageDocument();
  document.draft.text = 'Private draft';
  const opts = options();
  const queue = createMessageQueue(opts);
  await queue.drain();
  expect(claimPrivateScope).not.toHaveBeenCalled();
  expect(opts.send).not.toHaveBeenCalled();
  queue.stop();
});

it('does not start a POST if the queue stops during its durable sending update', async () => {
  const opts = options();
  const queue = createMessageQueue(opts);
  vi.mocked(updateMessageDocument).mockImplementationOnce((_scope, change) => {
    document = change(document);
    queue.stop();

    return Promise.resolve(document);
  });
  await queue.drain();
  expect(opts.send).not.toHaveBeenCalled();
  expect(opts.accepted).not.toHaveBeenCalled();
});

it('serializes several intents, persists sending before POST, and removes only a matching ACK', async () => {
  const opts = options();
  opts.send.mockImplementation((item) => {
    expect(document.intents.find((value) => value.id === item.id)?.state).toBe('sending');

    return Promise.resolve(ack(item));
  });
  const queue = createMessageQueue(opts);
  await Promise.all([queue.drain(), queue.drain()]);
  expect(opts.send.mock.calls.map(([item]) => item.id)).toEqual(['one', 'two']);
  expect(document.intents).toEqual([]);
  queue.stop();
});

it('reconciles a lost ACK with the same id before sending the next intent', async () => {
  const opts = options();
  opts.send.mockRejectedValueOnce(new TypeError('Lost ACK'));
  const queue = createMessageQueue(opts);
  await queue.drain();
  expect(document.intents[0]?.state).toBe('uncertain');
  await vi.advanceTimersByTimeAsync(3_000);
  expect(opts.send.mock.calls.map(([item]) => item.id)).toEqual(['one', 'one', 'two']);
  expect(document.intents).toEqual([]);
  queue.stop();
});

it('rejects foreign author or changed body ACK instead of discarding the durable intent', async () => {
  const opts = options();
  opts.send.mockImplementation((item) =>
    Promise.resolve({
      ...ack(item),
      actor: { id: 'foreign', displayName: 'Другой' },
    }),
  );
  const queue = createMessageQueue(opts);
  await queue.drain();
  expect(document.intents[0]?.state).toBe('uncertain');
  expect(opts.accepted).not.toHaveBeenCalled();
  expect(
    matchingMessage({ ...ack(intent('one')), text: 'different' }, scope, intent('one')),
  ).toBe(false);
  queue.stop();
});

it('an explicit rejection does not block subsequent messages, and a lease belongs to one tab', async () => {
  const opts = options();
  vi.mocked(claimPrivateScope).mockResolvedValueOnce(false);
  const queue = createMessageQueue(opts);
  await queue.drain();
  expect(opts.send).not.toHaveBeenCalled();
  opts.send.mockRejectedValueOnce(new ApiError(422, 'invalid_text'));
  await vi.advanceTimersByTimeAsync(3_000);
  expect(document.intents).toMatchObject([{ id: 'one', state: 'rejected' }]);
  queue.stop();
});

it('discards an in-flight ACK after logout and cancels all automatic retries', async () => {
  const opts = options();
  const gate: { finish?: (entry: FeedEntry) => void } = {};
  opts.send.mockImplementationOnce(
    () =>
      new Promise<FeedEntry>((resolve) => {
        gate.finish = resolve;
      }),
  );
  const queue = createMessageQueue(opts);
  const running = queue.drain();
  await vi.advanceTimersByTimeAsync(0);
  queue.stop();
  gate.finish?.(ack(intent('one')));
  await running;
  await vi.advanceTimersByTimeAsync(60_000);
  expect(opts.accepted).not.toHaveBeenCalled();
  expect(opts.send).toHaveBeenCalledTimes(1);
});

it('does not accept a media message as the canonical result of a plain text intent', async () => {
  const opts = options();
  opts.send.mockImplementation((item) =>
    Promise.resolve({
      ...ack(item),
      attachments: [
        {
          id: 'media',
          meeting_id: 'meeting',
          file_name: 'image.png',
          content_type: 'image/png',
          size_bytes: 10,
          kind: 'photo',
          purpose: 'message',
          status: 'published',
          download_url: null,
          thumbnail_url: null,
          created_at: item.createdAt,
          uploaded_by: { id: 'user', display_name: 'Автор' },
        },
      ],
    }),
  );
  const queue = createMessageQueue(opts);
  await queue.drain();
  expect(opts.accepted).not.toHaveBeenCalled();
  expect(document.intents).toHaveLength(2);
  expect(document.intents[0]?.state).toBe('uncertain');
  queue.stop();
});
