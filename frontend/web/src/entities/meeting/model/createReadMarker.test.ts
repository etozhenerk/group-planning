import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api';
import { createReadMarker } from '@/entities/meeting/model/createReadMarker';
import type { ChatReadMarker } from '@/entities/meeting/model/chatReadSchema';
import type { ReadMarkerOptions } from '@/entities/meeting/model/readMarkerTypes';

const result = (sequence: string): ChatReadMarker => ({
  read_through_sequence: sequence,
  unread_baseline_sequence: '0',
  unread_count: '0',
  first_unread: null,
  projection_version: sequence,
});

const fixture = (
  send = vi.fn<ReadMarkerOptions['send']>((sequence) =>
    Promise.resolve(result(sequence)),
  ),
) => {
  const onConfirmed = vi.fn();
  const onError = vi.fn();
  const owner = createReadMarker({ send, onConfirmed, onError, now: () => Date.now() });
  const show = (sequences: string[], active = true, covered = false) =>
    owner.setVisibility({ sequences, active, covered });

  return { owner, send, show, onConfirmed, onError };
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});

afterEach(() => vi.useRealTimers());

describe('visibility-qualified read marker', () => {
  it('data/ACK/background do not read; continuous bottom visibility needs exactly 500 ms', async () => {
    const f = fixture();

    f.show(['10'], false);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(f.send).not.toHaveBeenCalled();
    f.show(['10']);
    await vi.advanceTimersByTimeAsync(499);
    expect(f.send).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(f.send).toHaveBeenCalledWith('10', expect.any(AbortSignal), false);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(f.send).toHaveBeenCalledTimes(1);
    f.owner.dispose();
  });

  it('hidden bottom or overlay resets dwell without reading the message', async () => {
    const f = fixture();

    f.show(['10']);
    await vi.advanceTimersByTimeAsync(300);
    f.show(['10'], true, true);
    await vi.advanceTimersByTimeAsync(1_000);
    f.show(['10']);
    await vi.advanceTimersByTimeAsync(300);
    f.show([]);
    await vi.advanceTimersByTimeAsync(300);
    f.show(['10']);
    await vi.advanceTimersByTimeAsync(499);
    expect(f.send).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(f.send).toHaveBeenCalledTimes(1);
    f.owner.dispose();
  });

  it('coalesces the maximum qualified uint64 without rounding or resetting continuous visibility', async () => {
    const f = fixture();

    f.show(['9007199254740992']);
    await vi.advanceTimersByTimeAsync(250);
    f.show(['9007199254740992', '9007199254740993']);
    await vi.advanceTimersByTimeAsync(250);
    expect(f.send.mock.calls[0]?.[0]).toBe('9007199254740992');
    await vi.advanceTimersByTimeAsync(999);
    expect(f.send).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(f.send.mock.calls[1]?.[0]).toBe('9007199254740993');
    f.show(['18446744073709551615']);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(f.owner.getState().confirmed).toBe('18446744073709551615');
    f.owner.dispose();
  });

  it('allows only one active request and suppresses a lower late response after another device', async () => {
    const gate: { resolve?: (value: ChatReadMarker) => void } = {};
    const send = vi.fn<ReadMarkerOptions['send']>(
      () =>
        new Promise<ChatReadMarker>((done) => {
          gate.resolve = done;
        }),
    );

    const f = fixture(send);

    f.show(['10']);
    await vi.advanceTimersByTimeAsync(500);
    f.show(['20']);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(send).toHaveBeenCalledTimes(1);
    f.owner.confirm('30');
    gate.resolve?.(result('10'));
    await vi.advanceTimersByTimeAsync(0);
    expect(f.owner.getState().confirmed).toBe('30');
    expect(f.onConfirmed).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(1);
    f.owner.dispose();
  });

  it('keeps failed reading pending, pauses retries in background, and stops terminal access errors', async () => {
    const send = vi
      .fn<ReadMarkerOptions['send']>((sequence) => Promise.resolve(result(sequence)))
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockRejectedValueOnce(new ApiError(403, 'forbidden'));

    const f = fixture(send);

    f.show(['10']);
    await vi.advanceTimersByTimeAsync(500);
    expect(f.owner.getState().confirmed).toBe('0');
    f.show([], false);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(send).toHaveBeenCalledTimes(1);
    f.show(['10']);
    await vi.advanceTimersByTimeAsync(0);
    expect(send).toHaveBeenCalledTimes(2);
    expect(f.owner.getState().blocked).toBe(true);
    f.show(['30']);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(send).toHaveBeenCalledTimes(2);
    expect(f.onConfirmed).not.toHaveBeenCalled();
    f.owner.dispose();
  });

  it('dispose aborts in-flight work and fences an abort-ignoring late callback', async () => {
    const gate: { resolve?: (value: ChatReadMarker) => void } = {};
    const send = vi.fn<ReadMarkerOptions['send']>(
      () =>
        new Promise<ChatReadMarker>((done) => {
          gate.resolve = done;
        }),
    );

    const onConfirmed = vi.fn();
    const owner = createReadMarker({ send, onConfirmed, now: () => Date.now() });

    owner.setVisibility({ sequences: ['10'], active: true, covered: false });
    await vi.advanceTimersByTimeAsync(500);
    const signal = send.mock.calls[0]?.[1];

    owner.dispose();
    expect(signal?.aborted).toBe(true);
    gate.resolve?.(result('10'));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(onConfirmed).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('leave flush sends only qualified reading and keeps its request alive without late UI writes', async () => {
    const gate: { resolve?: (value: ChatReadMarker) => void } = {};
    const send = vi.fn<ReadMarkerOptions['send']>(
      () =>
        new Promise((done) => {
          gate.resolve = done;
        }),
    );

    const f = fixture(send);

    f.show(['10']);
    await vi.advanceTimersByTimeAsync(499);
    await f.owner.flush();
    expect(send).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    f.show(['20']);
    await vi.advanceTimersByTimeAsync(500);
    f.show([], false);
    gate.resolve?.(result('10'));
    await vi.advanceTimersByTimeAsync(500);
    const leaving = f.owner.flush();

    f.owner.dispose();
    await vi.advanceTimersByTimeAsync(0);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1]?.[0]).toBe('20');
    expect(send.mock.calls[1]?.[1].aborted).toBe(false);
    expect(send.mock.calls[1]?.[2]).toBe(true);
    gate.resolve?.(result('20'));
    await leaving;
    expect(f.onConfirmed).toHaveBeenCalledTimes(1);
    expect(f.owner.getState().confirmed).toBe('10');
  });
});
