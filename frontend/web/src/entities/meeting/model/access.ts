import { useSyncExternalStore } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api';
import type { ResponseState } from '@/entities/meeting/model/types';

type Access = { epoch: number; denied: boolean; revision: string };
const states = new Map<string, Access>();
const listeners = new Set<() => void>();
const initial: Access = { epoch: 0, denied: false, revision: '0' };
const read = (user: string, id: string): Access => {
  return states.get(`${user}:${id}`) ?? initial;
};

const publish = (user: string, id: string, value: Access) => {
  states.set(`${user}:${id}`, value);

  for (const listener of listeners) {
    listener();
  }
};

export const useAccess = (user: string, id: string) => {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    () => read(user, id),
  );
};

export const accessEpoch = (user: string, id: string) => {
  return read(user, id).epoch;
};

export const privateKey = (user: string, id: string, epoch: number, kind: string) => {
  return ['private', user, id, epoch, kind] as const;
};

export const clearMeeting = (client: QueryClient, user: string, id: string) => {
  void client.cancelQueries({ queryKey: ['private', user, id] });
  client.removeQueries({ queryKey: ['private', user, id] });
};

export const denyAccess = (
  client: QueryClient,
  user: string,
  id: string,
  epoch: number,
) => {
  const state = read(user, id);

  if (state.epoch !== epoch) {
    return;
  }

  publish(user, id, { ...state, epoch: epoch + 1, denied: true });
  clearMeeting(client, user, id);
};

export const applyResponse = (
  client: QueryClient,
  user: string,
  result: ResponseState,
  epoch: number,
): boolean => {
  const state = read(user, result.meetingId);

  if (state.epoch !== epoch || BigInt(result.revision) < BigInt(state.revision)) {
    return false;
  }

  clearMeeting(client, user, result.meetingId);
  publish(user, result.meetingId, {
    epoch: state.epoch + 1,
    denied: !result.canAccess,
    revision: result.revision,
  });
  void client.invalidateQueries({ queryKey: ['meetings', user] });
  void client.invalidateQueries({ queryKey: ['saved-invitations', user] });
  void client.invalidateQueries({ queryKey: ['invitation'] });

  return true;
};

export const guarded = async <T>(
  client: QueryClient,
  user: string,
  id: string,
  epoch: number,
  operation: () => Promise<T>,
): Promise<T> => {
  if (read(user, id).denied || read(user, id).epoch !== epoch) {
    throw new ApiError(403, 'forbidden');
  }

  try {
    const result = await operation();

    if (read(user, id).epoch !== epoch) {
      throw new DOMException('Stale access', 'AbortError');
    }

    return result;
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      denyAccess(client, user, id, epoch);
    }

    throw error;
  }
};

export const resetAccess = () => {
  states.clear();

  for (const listener of listeners) {
    listener();
  }
};
