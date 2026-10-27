import { useMemo } from 'react';
import { useAccess } from '@/entities/meeting';
import type { FeedEntry } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { usePendingMessages, matchingMessage } from '@/features/send-message';

export const useOutgoingEntries = (
  id: string,
  session: Session,
  confirmed: FeedEntry[],
) => {
  const access = useAccess(session.user.id, id);
  const { pending } = usePendingMessages(session.user.id, id, access.epoch);

  return useMemo(() => {
    const local: FeedEntry[] = pending
      .filter(
        (intent) =>
          !confirmed.some((entry) =>
            matchingMessage(entry, { user: session.user.id, meeting: id }, intent),
          ),
      )
      .map((intent) => ({
        id: `outbox:${intent.id}`,
        meetingId: id,
        sequence: '0',
        kind: 'message',
        actor: session.user,
        occurredAt: intent.createdAt ?? new Date().toISOString(),
        clientRequestId: intent.id,
        text: intent.text,
        event: '',
        supported: true,
        delivery:
          intent.delivery ?? (intent.state === 'failed' ? 'uncertain' : 'sending'),
      }));

    return [...confirmed, ...local];
  }, [confirmed, pending, id, session.user]);
};
