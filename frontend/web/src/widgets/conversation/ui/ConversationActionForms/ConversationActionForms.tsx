import type { DraftExitRegistration } from '@/shared/lib/form';
import { useMobileLayout } from '@/shared/lib/media';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { PollCreateForm } from '@/features/date-poll';
import { PlacePollForm } from '@/features/place-poll';
import { ShareForm } from '@/features/share-invitation';
import { ConversationUploadForms } from '@/widgets/conversation/ui/ConversationUploadForms';
import { TaskForm } from '@/features/preparation-task';
import type { ConversationActionKind } from '@/widgets/conversation/model/actionKind';
import { useActionCompletion } from '@/widgets/conversation/ui/ConversationActionForms/hooks/useActionCompletion';
import styles from '@/widgets/conversation/ui/ConversationActionForms/ConversationActionForms.module.css';

export type ConversationActionFormsProps = {
  kind: ConversationActionKind;
  open: boolean;
  meeting: Meeting;
  session: Session;
  done: () => void;
  registerClose: DraftExitRegistration;
  onModeChange: (title: string) => void;
};

export const ConversationActionForms = ({
  kind,
  open,
  meeting,
  session,
  done,
  registerClose,
  onModeChange,
}: ConversationActionFormsProps) => {
  const { generation, complete } = useActionCompletion(kind, open, done);
  const mobile = useMobileLayout();

  return (
    <>
      <div className={styles.form} hidden={kind !== 'date'}>
        {(!mobile || kind === 'date') && (
          <PollCreateForm
            key={generation.date}
            meeting={meeting}
            session={session}
            done={() => complete('date')}
            onDiscard={(navigating) => complete('date', navigating)}
            active={open && kind === 'date'}
            onRegisterClose={registerClose}
            onModeChange={onModeChange}
          />
        )}
      </div>
      <div className={styles.form} hidden={kind !== 'place'}>
        {(!mobile || kind === 'place') && (
          <PlacePollForm
            key={generation.place}
            meeting={meeting}
            session={session}
            done={() => complete('place')}
            onDiscard={(navigating) => complete('place', navigating)}
            active={open && kind === 'place'}
            onRegisterClose={registerClose}
            onModeChange={onModeChange}
          />
        )}
      </div>
      <div className={styles.form} hidden={kind !== 'task'}>
        {(!mobile || kind === 'task') && (
          <TaskForm
            key={generation.task}
            meeting={meeting.id}
            session={session}
            done={() => complete('task')}
            onDiscard={(navigating) => complete('task', navigating)}
            onRegisterClose={registerClose}
            onModeChange={onModeChange}
            active={open && kind === 'task'}
          />
        )}
      </div>
      <ConversationUploadForms
        kind={kind}
        open={open}
        meeting={meeting.id}
        session={session}
        done={done}
      />
      <div className={styles.form} hidden={kind !== 'share'}>
        {kind === 'share' && <ShareForm id={meeting.id} meeting={meeting} />}
      </div>
    </>
  );
};
