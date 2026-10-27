import type { RefObject } from 'react';
import type { FeedRecordProps } from '@/widgets/conversation/ui/FeedRecord/FeedRecord';
import type { useEntrySurface } from '@/widgets/conversation/ui/FeedRecord/hooks/useEntrySurface';
import { ReadReceipt } from '@/widgets/conversation/ui/ReadReceipt';
import { ReadersDialog } from '@/widgets/conversation/ui/ReadersDialog';
import { MessageDelivery } from '@/features/send-message';
import { MessageReactions } from '@/features/message-reactions';

export type FeedRecordActionsProps = FeedRecordProps & {
  panel: ReturnType<typeof useEntrySurface>;
  anchor: RefObject<HTMLElement | null>;
};

export const FeedRecordActions = ({
  entry,
  session,
  reactions,
  surface,
  panel,
  anchor,
  read,
}: FeedRecordActionsProps) => {
  const interactive = entry.kind === 'message' && !entry.delivery;
  const own = entry.actor.id === session.user.id;

  return (
    <>
      {entry.delivery && entry.clientRequestId && (
        <MessageDelivery
          user={session.user.id}
          meeting={entry.meetingId}
          id={entry.clientRequestId}
          state={entry.delivery}
        />
      )}
      {interactive && (
        <MessageReactions
          id={entry.meetingId}
          entry={entry.id}
          session={session}
          reactions={reactions}
          open={panel.active}
          change={panel.change}
          people={panel.people}
          readers={own && read?.enabled ? panel.readers.show : undefined}
          anchor={anchor}
          boundary={surface.boundary}
          context={entry.text ?? 'Вложение'}
        />
      )}
      {interactive && own && read?.enabled && (
        <>
          <ReadReceipt count={read.count} open={panel.readers.show} />
          <ReadersDialog
            meeting={entry.meetingId}
            user={session.user.id}
            entry={entry.id}
            version={read.version}
            open={panel.readers.open}
            close={panel.readers.close}
            anchor={anchor}
          />
        </>
      )}
    </>
  );
};
