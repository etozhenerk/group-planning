import { z } from 'zod';
import { idbResult, privateTransaction } from '@/shared/lib/private-store/database';
import {
  privateGeneration,
  publishPrivateStore,
} from '@/shared/lib/private-store/events';

export type PrivateScope = {
  user: string;
  meeting: string;
  keys: string[];
  epochs: string[];
  generation: string;
};

const epoch = async (store: IDBObjectStore, key: string) => {
  const current: unknown = await idbResult(store.get(key));

  if (typeof current === 'string') {
    return current;
  }

  const value = crypto.randomUUID();
  store.put(value, key);

  return value;
};

export const openPrivateScope = (user: string, meeting: string) => {
  const generation = privateGeneration(user, meeting);

  return privateTransaction(async (transaction): Promise<PrivateScope> => {
    const keys = ['global', `user:${user}`, `meeting:${user}:${meeting}`];
    const epochs: string[] = [];

    for (const key of keys) {
      epochs.push(await epoch(transaction.objectStore('epochs'), key));
    }

    return { user, meeting, keys, epochs, generation };
  });
};

export const checkPrivateScope = async (
  transaction: IDBTransaction,
  scope: PrivateScope,
) => {
  if (scope.generation !== privateGeneration(scope.user, scope.meeting)) {
    throw new DOMException('Private scope expired', 'AbortError');
  }

  for (const [index, key] of scope.keys.entries()) {
    const current: unknown = await idbResult(transaction.objectStore('epochs').get(key));

    if (current !== scope.epochs[index]) {
      throw new DOMException('Private scope expired', 'AbortError');
    }
  }
};

export const updatePrivateScope = <T>(
  scope: PrivateScope,
  change: (current: unknown) => T,
) =>
  privateTransaction(async (transaction) => {
    await checkPrivateScope(transaction, scope);
    const store = transaction.objectStore('records');
    const value: unknown = await idbResult(store.get([scope.user, scope.meeting]));
    const next = change(value);
    store.put(next, [scope.user, scope.meeting]);

    return next;
  }).then((result) => {
    publishPrivateStore({ kind: 'changed', user: scope.user, meeting: scope.meeting });

    return result;
  });

export const readPrivateScope = (scope: PrivateScope): Promise<unknown> =>
  privateTransaction(async (transaction) => {
    await checkPrivateScope(transaction, scope);

    const value: unknown = await idbResult(
      transaction.objectStore('records').get([scope.user, scope.meeting]),
    );

    return value;
  });

export const purgePrivateStore = (user?: string, meeting?: string) => {
  publishPrivateStore({
    kind: 'purged',
    ...(user ? { user } : {}),
    ...(meeting ? { meeting } : {}),
  });

  return privateTransaction(async (transaction) => {
    const key = user
      ? meeting
        ? `meeting:${user}:${meeting}`
        : `user:${user}`
      : 'global';

    transaction.objectStore('epochs').put(crypto.randomUUID(), key);

    for (const name of ['records', 'leases']) {
      const store = transaction.objectStore(name);
      const keys = await idbResult(store.getAllKeys());

      for (const current of keys) {
        if (
          !user ||
          (Array.isArray(current) &&
            current[0] === user &&
            (!meeting || current[1] === meeting))
        ) {
          store.delete(current);
        }
      }
    }
  });
};

const leaseSchema = z.object({
  owner: z.string(),
  until: z.number(),
  browserOwned: z.boolean().optional(),
});

export const claimPrivateScope = (
  scope: PrivateScope,
  owner: string,
  release = false,
  browserOwned = false,
) =>
  privateTransaction(async (transaction) => {
    await checkPrivateScope(transaction, scope);
    const store = transaction.objectStore('leases');
    const key = [scope.user, scope.meeting];
    const value: unknown = await idbResult(store.get(key));
    const lease = leaseSchema.safeParse(value);

    if (
      lease.success &&
      lease.data.owner !== owner &&
      lease.data.until > Date.now() &&
      !(browserOwned && lease.data.browserOwned && !release)
    ) {
      return false;
    }

    if (release) {
      store.delete(key);
    } else {
      store.put({ owner, until: Date.now() + 30_000, browserOwned }, key);
    }

    return true;
  });
