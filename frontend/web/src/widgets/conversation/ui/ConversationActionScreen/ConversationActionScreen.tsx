import { ChevronLeft } from 'lucide-react';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import type { ConversationActionKind } from '@/widgets/conversation/model/actionKind';
import { actionTitle } from '@/widgets/conversation/model/actionKind';
import { ConversationActionForms } from '@/widgets/conversation/ui/ConversationActionForms';
import { useActionScreen } from '@/widgets/conversation/ui/ConversationActionScreen/hooks/useActionScreen';
import styles from '@/widgets/conversation/ui/ConversationActionScreen/ConversationActionScreen.module.css';

export type ConversationActionScreenProps = {
  kind: ConversationActionKind;
  open: boolean;
  meeting: Meeting;
  session: Session;
  done: () => void;
};

export const ConversationActionScreen = ({
  kind,
  open,
  meeting,
  session,
  done,
}: ConversationActionScreenProps) => {
  const heading = useActionScreen(open, done);

  return (
    <main
      id={open ? 'main' : undefined}
      className={styles.page}
      hidden={!open}
      aria-label={actionTitle(kind)}
    >
      <button type="button" className={styles.back} onClick={done}>
        <ChevronLeft size={18} />
        Назад
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {actionTitle(kind)}
      </h1>
      <div className={styles.panel}>
        <ConversationActionForms
          kind={kind}
          open={open}
          meeting={meeting}
          session={session}
          done={done}
        />
      </div>
    </main>
  );
};
