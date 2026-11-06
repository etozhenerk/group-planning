import type { useProfile } from '@/entities/session';

export type ProfileRecord = NonNullable<ReturnType<typeof useProfile>['data']>;
