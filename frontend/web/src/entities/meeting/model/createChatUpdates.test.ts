import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createChatUpdates } from '@/entities/meeting/model/createChatUpdates';

type Events = Parameters<Parameters<typeof createChatUpdates>[0]['connect']>[0];
const fixture = (realtime = true) => {
  let events: Events | undefined;
  const disconnect = vi.fn();
  const refresh = vi.fn((): Promise<void> => Promise.resolve());
  const authenticate = vi.fn((): Promise<void> => Promise.resolve());
  const owner = createChatUpdates({
    realtime,
    refresh,
    authenticate,
    random: () => 0.5,
    terminal: (error) => error === 'denied',
    connect: (value) => {
      events = value;

      return disconnect;
    },
  });

  return { owner, refresh, authenticate, disconnect, events: () => events! };
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('catches up after every subscribe ACK and performs no idle polling while healthy', async () => {
  const test = fixture();
  await vi.advanceTimersByTimeAsync(0);
  test.events().ready();
  await vi.advanceTimersByTimeAsync(90_000);
  expect(test.refresh).toHaveBeenCalledTimes(1);
  test.events().unavailable();
  test.events().ready();
  await vi.advanceTimersByTimeAsync(90_000);
  expect(test.refresh).toHaveBeenCalledTimes(2);
  test.owner.stop();
});

it('coalesces hints and serializes a hint arriving during catch-up', async () => {
  const test = fixture();
  await vi.advanceTimersByTimeAsync(0);
  const gate = { finish: (): void => undefined };
  test.refresh.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        gate.finish = resolve;
      }),
  );
  test.events().ready();

  for (let index = 0; index < 20; index += 1) {
    test.events().hint();
  }

  await vi.advanceTimersByTimeAsync(100);
  expect(test.refresh).toHaveBeenCalledTimes(1);
  gate.finish();
  await vi.advanceTimersByTimeAsync(0);
  expect(test.refresh).toHaveBeenCalledTimes(2);
  test.owner.stop();
});

it('uses one bounded fallback after ten seconds and cancels it after catch-up', async () => {
  const test = fixture();
  await vi.advanceTimersByTimeAsync(9_999);
  expect(test.refresh).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(3_001);
  expect(test.refresh).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(3_000);
  expect(test.refresh).toHaveBeenCalledTimes(2);
  test.events().ready();
  await vi.advanceTimersByTimeAsync(60_000);
  expect(test.refresh).toHaveBeenCalledTimes(3);
  test.owner.stop();
});

it('stops all retries on terminal HTTP auth and ignores late subscription callbacks', async () => {
  const test = fixture();
  await vi.advanceTimersByTimeAsync(0);
  test.refresh.mockRejectedValueOnce('denied');
  test.events().ready();
  await vi.advanceTimersByTimeAsync(60_000);
  expect(test.disconnect).toHaveBeenCalledTimes(1);
  expect(test.refresh).toHaveBeenCalledTimes(1);
  test.events().hint();
  test.events().ready();
  await vi.advanceTimersByTimeAsync(60_000);
  expect(test.refresh).toHaveBeenCalledTimes(1);
});

it('stops background work including delayed retries and restarts only as a new owner', async () => {
  const test = fixture(false);
  await vi.advanceTimersByTimeAsync(0);
  expect(test.refresh).toHaveBeenCalledTimes(1);
  test.owner.stop();
  await vi.advanceTimersByTimeAsync(60_000);
  expect(test.refresh).toHaveBeenCalledTimes(1);
  const foreground = fixture(false);
  await vi.advanceTimersByTimeAsync(0);
  expect(foreground.authenticate).toHaveBeenCalledTimes(1);
  expect(foreground.refresh).toHaveBeenCalledTimes(1);
  foreground.owner.stop();
});

it('keeps successful legacy refreshes fresh and backs off only consecutive errors', async () => {
  const test = fixture(false);
  await vi.advanceTimersByTimeAsync(0);
  expect(test.refresh).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(9_000);
  expect(test.refresh).toHaveBeenCalledTimes(4);
  test.refresh.mockRejectedValueOnce('offline').mockRejectedValueOnce('offline');
  await vi.advanceTimersByTimeAsync(3_000);
  expect(test.refresh).toHaveBeenCalledTimes(5);
  await vi.advanceTimersByTimeAsync(5_999);
  expect(test.refresh).toHaveBeenCalledTimes(5);
  await vi.advanceTimersByTimeAsync(1);
  expect(test.refresh).toHaveBeenCalledTimes(6);
  await vi.advanceTimersByTimeAsync(11_999);
  expect(test.refresh).toHaveBeenCalledTimes(6);
  await vi.advanceTimersByTimeAsync(1);
  expect(test.refresh).toHaveBeenCalledTimes(7);
  await vi.advanceTimersByTimeAsync(3_000);
  expect(test.refresh).toHaveBeenCalledTimes(8);
  test.owner.stop();
});
