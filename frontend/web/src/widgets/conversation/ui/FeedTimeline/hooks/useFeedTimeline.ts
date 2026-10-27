import { useReadVisibility } from '@/widgets/conversation/ui/FeedTimeline/hooks/useReadVisibility';
import { useChatRead, useReadReceipts } from '@/entities/meeting';
import { useMemo, useRef } from 'react';
import { useOutgoingEntries } from '@/widgets/conversation/model/useOutgoingEntries';
import type { Session } from '@/entities/session';
import type { RefObject } from 'react';
import { useConversation, useReactions } from '@/entities/meeting';
import { useViewport } from '@/widgets/conversation/ui/FeedTimeline/hooks/useViewport';

export const useFeedTimeline = (
  id: string,
  session: Session,
  boundary: RefObject<HTMLDivElement | null>,
  covered = false,
) => {
  const user = session.user.id;
  const query = useConversation(id, user);
  const confirmed = useMemo(
    () => [...(query.data?.protectedEntries ?? []), ...(query.data?.entries ?? [])],
    [query.data?.protectedEntries, query.data?.entries],
  );

  const entries = useOutgoingEntries(id, session, confirmed);

  const viewport = useViewport(entries, query, boundary, user);
  const rendered = viewport.virtual.getVirtualItems().flatMap((item) => {
    const entry = entries[item.index];

    return entry?.kind === 'message' && !entry.delivery && !viewport.hidden.has(entry.id)
      ? [entry.id]
      : [];
  });

  const reactions = useReactions(id, user, rendered);
  const read = useChatRead(id, user, session.csrf, query.data?.read);
  useReadVisibility(boundary, read, covered);
  const own = rendered.filter((entry) =>
    entries.some((row) => row.id === entry && row.actor.id === user),
  );

  const receipts = useReadReceipts(
    id,
    user,
    session.csrf,
    own,
    query.data?.read?.version,
    read.enabled,
  );

  const divider = useRef<string | null | undefined>(undefined);

  if (divider.current === undefined && query.data) {
    divider.current = query.data.read?.firstUnread ?? null;
  }

  return {
    query,
    reactions,
    viewport,
    entries,
    read: {
      enabled: read.enabled,
      version: query.data?.read?.version,
      counts: new Map(
        receipts.data?.map((receipt) => [receipt.entry_id, receipt.reader_count]),
      ),
      divider: divider.current ?? null,
    },
  };
};
