import { useState } from 'react';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { PollCreateForm } from '@/features/date-poll';
import { PlacePollForm } from '@/features/place-poll';
import { ShareForm } from '@/features/share-invitation';
import { UploadDraft } from '@/features/upload-media';
import { TaskForm } from '@/features/preparation-task';
import type { ConversationActionKind } from '@/widgets/conversation/model/actionKind';
import styles from '@/widgets/conversation/ui/ConversationActionForms/ConversationActionForms.module.css';

export type ConversationActionFormsProps = {
  kind: ConversationActionKind;
  open: boolean;
  meeting: Meeting;
  session: Session;
  done: () => void;
};

export const ConversationActionForms = ({
  kind,
  open,
  meeting,
  session,
  done,
}: ConversationActionFormsProps) => {
  const [generation, setGeneration] = useState({ date: 0, place: 0, task: 0 });
  const complete = (form: 'date' | 'place' | 'task') => {
    setGeneration((value) => ({ ...value, [form]: value[form] + 1 }));

    if (open && kind === form) {
      done();
    }
  };

  return (
    <>
      <div className={styles.form} hidden={kind !== 'date'}>
        <PollCreateForm
          key={generation.date}
          meeting={meeting}
          session={session}
          done={() => complete('date')}
        />
      </div>
      <div className={styles.form} hidden={kind !== 'place'}>
        <PlacePollForm
          key={generation.place}
          meeting={meeting}
          session={session}
          done={() => complete('place')}
        />
      </div>
      <div className={styles.form} hidden={kind !== 'task'}>
        <TaskForm
          key={generation.task}
          meeting={meeting.id}
          session={session}
          done={() => complete('task')}
          active={open && kind === 'task'}
        />
      </div>
      <div className={styles.form} hidden={kind !== 'photo'}>
        <UploadDraft
          id={meeting.id}
          session={session}
          photo
          purpose="message"
          active={open && kind === 'photo'}
          done={done}
        />
      </div>
      <div className={styles.form} hidden={kind !== 'file'}>
        <UploadDraft
          id={meeting.id}
          session={session}
          photo={false}
          purpose="message"
          active={open && kind === 'file'}
          done={done}
        />
      </div>
      <div className={styles.form} hidden={kind !== 'share'}>
        {kind === 'share' && <ShareForm id={meeting.id} meeting={meeting} />}
      </div>
    </>
  );
};
