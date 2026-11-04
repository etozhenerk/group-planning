export {
  openPrivateScope,
  readPrivateScope,
  updatePrivateScope,
  purgePrivateStore,
  claimPrivateScope,
} from '@/shared/lib/private-store/scope';

export type { PrivateScope } from '@/shared/lib/private-store/scope';

export { withPrivateScopeLock } from '@/shared/lib/private-store/withPrivateScopeLock';

export {
  observePrivateStore,
  publishPrivateStore,
} from '@/shared/lib/private-store/events';
