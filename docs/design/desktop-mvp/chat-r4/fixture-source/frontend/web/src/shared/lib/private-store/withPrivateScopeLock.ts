import type { PrivateScope } from '@/shared/lib/private-store/scope';

export const withPrivateScopeLock = async (
  scope: PrivateScope,
  operation: (browserOwned: boolean) => Promise<void>,
): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    await operation(false);

    return true;
  }

  const name = `somewhere:outbox:${JSON.stringify([scope.user, scope.meeting])}`;

  return navigator.locks.request(name, { ifAvailable: true }, async (lock) => {
    if (!lock) {
      return false;
    }

    await operation(true);

    return true;
  });
};
