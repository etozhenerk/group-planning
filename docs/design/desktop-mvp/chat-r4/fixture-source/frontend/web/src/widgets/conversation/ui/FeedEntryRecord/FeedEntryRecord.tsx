import type { FeedEntry, Reaction } from '@/entities/meeting';
import { entryPresentation } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import type { ConversationSurface } from '@/widgets/conversation/model/useConversationSurface';
import { FeedRecord } from '@/widgets/conversation/ui/FeedRecord';
import { PlaceRecord } from '@/widgets/conversation/ui/PlaceRecord';
import { TaskRecord } from '@/widgets/conversation/ui/TaskRecord';
import { SystemEvent } from '@/widgets/conversation/ui/SystemEvent';

export type FeedEntryRecordProps = {
  read: { enabled: boolean; count: string | undefined; version: string | undefined };
  entry: FeedEntry;
  session: Session;
  reactions: Reaction[];
  surface: ConversationSurface;
};

export const FeedEntryRecord = (props: FeedEntryRecordProps) => {
  if (entryPresentation(props.entry) === 'system') {
    return <SystemEvent entry={props.entry} />;
  }

  if (props.entry.taskId) {
    return (
      <TaskRecord entry={props.entry} id={props.entry.taskId} session={props.session} />
    );
  }

  if (props.entry.placePollId) {
    return (
      <PlaceRecord
        entry={props.entry}
        session={props.session}
        id={props.entry.placePollId}
      />
    );
  }

  return <FeedRecord {...props} />;
};
