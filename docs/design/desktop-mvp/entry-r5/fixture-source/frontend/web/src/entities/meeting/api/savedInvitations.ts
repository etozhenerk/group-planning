import { invitationsSchema, request } from '@/shared/api';
import { mapInvitation } from '@/entities/meeting/lib/mapMeeting';
import type { SavedInvitation } from '@/entities/meeting/model/savedInvitation';

export const listSavedInvitations = async (
  cursor: string | null,
  signal: AbortSignal,
) => {
  const wire = await request(
    invitationsSchema,
    `/invitations?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
    { signal },
  );

  const invitations: SavedInvitation[] = wire.invitations.map((item) => {
    const url = new URL(item.invitation_url);

    if (!/^\/i\/(?:[A-Za-z0-9_-]{22}|[A-Za-z0-9_-]{43})$/.test(url.pathname)) {
      throw new Error('Не удалось открыть приглашение.');
    }

    return { preview: mapInvitation(item.preview), path: url.pathname };
  });

  return { invitations, nextCursor: wire.next_cursor };
};
