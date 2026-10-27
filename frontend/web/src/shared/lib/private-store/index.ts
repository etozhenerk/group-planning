export {
  openPrivateScope,
  readPrivateScope,
  updatePrivateScope,
  purgePrivateStore,
  claimPrivateScope,
} from '@/shared/lib/private-store/scope';

export type { PrivateScope } from '@/shared/lib/private-store/scope';

export {
  observePrivateStore,
  publishPrivateStore,
} from '@/shared/lib/private-store/events';
