import { FeedReactionError } from '@/widgets/conversation/ui/FeedReactionError';
import { UnreadDivider } from '@/widgets/conversation/ui/UnreadDivider';
import { eventTimestamp } from '@/widgets/conversation/ui/SystemEvent/lib/eventTimestamp';
import type { FeedEntry, Reaction } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { FeedEntryRecord } from '@/widgets/conversation/ui/FeedEntryRecord';
import type { useViewport } from '@/widgets/conversation/ui/FeedTimeline/hooks/useViewport';
import type { ConversationSurface } from '@/widgets/conversation/model/useConversationSurface';
import styles from '@/widgets/conversation/ui/FeedRecords/FeedRecords.module.css';

export type FeedRecordsProps = {
  read: {
    enabled: boolean;
    version: string | undefined;
    counts: Map<string, string>;
    divider: string | null;
  };
  error?: boolean;
  retry?: () => void;
  entries: FeedEntry[];
  viewport: ReturnType<typeof useViewport>;
  session: Session;
  reactions: { entry_id: string; reactions: Reaction[] }[];
  surface: ConversationSurface;
};

export const FeedRecords = ({
  entries,
  read,
  viewport,
  session,
  reactions,
  error = false,
  retry,
  surface,
}: FeedRecordsProps) => (
  <>
    <div
      className={styles.timeline}
      ref={viewport.list}
      role="list"
      aria-label="Разговор встречи"
      style={{ height: viewport.virtual.getTotalSize() }}
      onFocusCapture={(event) => {
        const entry =
          event.target.closest<HTMLElement>('[data-entry-id]')?.dataset.entryId;

        if (entry) {
          viewport.setFocused(entry);
        }
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget) && !surface.panel) {
          viewport.setFocused(null);
        }
      }}
    >
      {viewport.virtual.getVirtualItems().map((item) => {
        const entry = entries[item.index]!;

        return (
          <div
            key={item.key}
            className={styles.row}
            data-index={item.index}
            data-entry-id={entry.id}
            data-protected={viewport.hidden.has(entry.id)}
            ref={viewport.virtual.measureElement}
            style={{
              transform: viewport.hidden.has(entry.id)
                ? undefined
                : `translateY(${item.start - viewport.margin}px)`,
            }}
          >
            {entry.kind === 'message' &&
              (item.index === 0 ||
                new Date(entries[item.index - 1]?.occurredAt ?? '').toDateString() !==
                  new Date(entry.occurredAt).toDateString()) && (
                <div className={styles.day}>
                  {eventTimestamp(entry.occurredAt).split(' · ')[0]}
                </div>
              )}
            {read.enabled && read.divider === entry.id && <UnreadDivider />}
            <FeedEntryRecord
              read={{
                enabled: read.enabled,
                count: read.counts.get(entry.id),
                version: read.version,
              }}
              surface={surface}
              entry={entry}
              session={session}
              reactions={
                reactions.find((value) => value.entry_id === entry.id)?.reactions ?? []
              }
            />
          </div>
        );
      })}
    </div>
    {error && <FeedReactionError retry={retry} />}
  </>
);
