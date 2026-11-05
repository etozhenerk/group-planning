import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import type { ConversationActionKind } from '@/widgets/conversation/model/actionKind';
import { useActionFormExit } from '@/widgets/conversation/ui/ConversationActionScreen/hooks/useActionFormExit';
import { ConversationActionForms } from '@/widgets/conversation/ui/ConversationActionForms';
import { Dialog } from '@/shared/ui/Dialog';

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
  const exit = useActionFormExit(kind, done);

  return (
    <Dialog
      open={open}
      title={exit.title}
      onClose={exit.close}
      chatAction
      formLayout={kind === 'date' || kind === 'place' || kind === 'task'}
    >
      <ConversationActionForms
        kind={kind}
        open={open}
        meeting={meeting}
        session={session}
        done={done}
        registerClose={exit.register}
        onModeChange={exit.setTitle}
      />
    </Dialog>
  );
};
