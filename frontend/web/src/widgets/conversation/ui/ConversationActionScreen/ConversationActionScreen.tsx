import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import type { ConversationActionKind } from '@/widgets/conversation/model/actionKind';
import { actionTitle } from '@/widgets/conversation/model/actionKind';
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
}: ConversationActionScreenProps) => (
  <Dialog open={open} title={actionTitle(kind)} onClose={done} desktopPage chatAction>
    <ConversationActionForms
      kind={kind}
      open={open}
      meeting={meeting}
      session={session}
      done={done}
    />
  </Dialog>
);
