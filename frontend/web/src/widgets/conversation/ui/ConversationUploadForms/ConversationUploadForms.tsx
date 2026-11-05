import type { Session } from '@/entities/session';
import { UploadDraft } from '@/features/upload-media';
import type { ConversationActionKind } from '@/widgets/conversation/model/actionKind';
import styles from '@/widgets/conversation/ui/ConversationUploadForms/ConversationUploadForms.module.css';

export type ConversationUploadFormsProps = {
  kind: ConversationActionKind;
  open: boolean;
  meeting: string;
  session: Session;
  done: () => void;
};

export const ConversationUploadForms = ({
  kind,
  open,
  meeting,
  session,
  done,
}: ConversationUploadFormsProps) => (
  <>
    <div className={styles.form} hidden={kind !== 'photo'}>
      <UploadDraft
        id={meeting}
        session={session}
        photo
        purpose="message"
        active={open && kind === 'photo'}
        done={done}
      />
    </div>
    <div className={styles.form} hidden={kind !== 'file'}>
      <UploadDraft
        id={meeting}
        session={session}
        photo={false}
        purpose="message"
        active={open && kind === 'file'}
        done={done}
      />
    </div>
  </>
);
