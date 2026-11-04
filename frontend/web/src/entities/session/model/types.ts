import type { PublicUser } from '@/shared/api';

export type Session = {
  user: PublicUser;
  expiresAt: string;
  csrf: string | null;
};
