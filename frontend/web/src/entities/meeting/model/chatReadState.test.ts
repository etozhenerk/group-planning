import { afterEach, describe, expect, it, vi } from 'vitest';
import { putChatReadMarker, queryChatReceipts } from '@/entities/meeting/api/readState';
import {
  mergeChatReadState,
  readStateFromSync,
} from '@/entities/meeting/model/chatReadState';
import {
  chatReadMarkerSchema,
  chatReadersSchema,
} from '@/entities/meeting/model/chatReadSchema';
import { chatChangesSchema } from '@/entities/meeting/model/chatSchema';

const id = '11111111-1111-4111-a111-111111111111';
const entry = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const marker = (sequence: string, version = sequence, unread = '0') => ({
  read_through_sequence: sequence,
  unread_baseline_sequence: '0',
  unread_count: unread,
  first_unread: unread === '0' ? null : entry,
  projection_version: version,
});

afterEach(() => vi.unstubAllGlobals());

describe('read DTO and projection boundaries', () => {
  it('preserves counters above Number.MAX_SAFE_INTEGER and rejects overflow/rounded wire values', () => {
    expect(
      chatReadMarkerSchema.parse(marker('18446744073709551615')).read_through_sequence,
    ).toBe('18446744073709551615');
    expect(chatReadMarkerSchema.safeParse(marker('18446744073709551616')).success).toBe(
      false,
    );
    expect(
      chatReadMarkerSchema.safeParse({ ...marker('1'), unread_count: 1 }).success,
    ).toBe(false);
  });

  it('accepts enabled and legacy missing read fields and distinguishes baseline from reading', () => {
    const base = {
      mode: 'changes',
      stream_epoch: 'epoch',
      next_cursor: 'next',
      through_cursor: 'through',
      has_more: false,
      changes: [],
      projection_version: '150',
      meeting: {
        id,
        organizer_id: id,
        title: 'Встреча',
        description: null,
        starts_on: null,
        starts_at: null,
        timezone: 'Europe/Moscow',
        place: null,
        cover_url: null,
        period: 'upcoming',
        revision: '1',
        participant_count: 2,
        my_rsvp: null,
        my_rsvp_revision: '0',
      },
    };

    const legacy = chatChangesSchema.parse(base);

    expect(readStateFromSync(legacy)).toBeNull();
    const enabled = chatChangesSchema.parse({
      ...base,
      my_read_state: '0',
      unread_baseline_sequence: '100',
      unread_count: '2',
      first_unread: entry,
    });

    expect(readStateFromSync(enabled)).toEqual({
      ...marker('0', '150', '2'),
      unread_baseline_sequence: '100',
    });
  });

  it('does not reintroduce older unread state or regress the actual marker', () => {
    const current = marker('150', '200');

    expect(mergeChatReadState(current, marker('140', '199', '3'))).toBe(current);
    expect(mergeChatReadState(current, marker('140', '201', '3'))).toBe(current);
    expect(mergeChatReadState(current, marker('160', '201'))).toEqual(
      marker('160', '201'),
    );
  });

  it('keeps only allowed reader profile fields and validates bounded page/counters', () => {
    const parsed = chatReadersSchema.parse({
      readers: [
        {
          id,
          display_name: 'Тест',
          avatar_url: null,
          phone: 'private',
          email: 'private',
          read_at: 'invented',
        },
      ],
      reader_count: '1',
      next_cursor: null,
      projection_version: '1',
    });

    expect(parsed.readers).toEqual([{ id, display_name: 'Тест', avatar_url: null }]);
    expect(chatReadersSchema.safeParse({ ...parsed, reader_count: '-1' }).success).toBe(
      false,
    );
  });
});

describe('read command contract', () => {
  it('sends exact uint64 marker with CSRF, abort and keepalive; rejects a regressed ACK', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(marker('9007199254740993')))
      .mockResolvedValueOnce(Response.json(marker('1')));

    const controller = new AbortController();

    vi.stubGlobal('fetch', fetcher);
    await putChatReadMarker(id, '9007199254740993', 'csrf-test', controller.signal, true);
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
      method: 'PUT',
      keepalive: true,
      signal: controller.signal,
      headers: { 'X-CSRF-Token': 'csrf-test' },
      body: '{"read_through_sequence":"9007199254740993"}',
    });
    await expect(putChatReadMarker(id, '2', null)).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('normalizes UUID case, rejects oversized/duplicate requests and mismatching response IDs', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          receipts: [{ entry_id: entry, reader_count: '2' }],
          projection_version: '9',
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          receipts: [{ entry_id: id, reader_count: '1' }],
          projection_version: '9',
        }),
      );

    vi.stubGlobal('fetch', fetcher);
    await queryChatReceipts(id, [entry.toUpperCase()], 'csrf-test');
    expect(fetcher.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ entry_ids: [entry] }));
    await expect(
      queryChatReceipts(id, [entry, entry.toUpperCase()], null),
    ).rejects.toThrow('distinct');
    await expect(
      queryChatReceipts(
        id,
        Array.from({ length: 101 }, () => entry),
        null,
      ),
    ).rejects.toThrow('1–100');
    expect(fetcher).toHaveBeenCalledTimes(1);
    await expect(queryChatReceipts(id, [entry], null)).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });
});
