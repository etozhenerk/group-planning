import type { z } from 'zod';
import type { userSchema } from '@/shared/api/primitives';

export type PublicUser = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
};

export const mapPublicUser = (wire: z.infer<typeof userSchema>) => ({
  id: wire.id,
  displayName: wire.display_name,
  avatarUrl: wire.avatar_url ?? null,
});
