import { useState } from 'react';
import type { Session } from '@/entities/session';
import { SendMessage } from '@/features/send-message';
import { ConversationActions } from '@/widgets/conversation/ui/ConversationActions';

export type ConversationComposerProps = { id: string; session: Session };

export const ConversationComposer = ({ id, session }: ConversationComposerProps) => {
  const [panel, setPanel] = useState<'add' | 'emoji' | null>(null);

  return (
    <div>
      <SendMessage
        id={id}
        session={session}
        emojiOpen={panel === 'emoji'}
        toggleEmoji={() => setPanel((value) => (value === 'emoji' ? null : 'emoji'))}
        extraAction={
          <ConversationActions
            id={id}
            session={session}
            menu={panel === 'add'}
            toggle={() => setPanel((value) => (value === 'add' ? null : 'add'))}
            close={() => setPanel(null)}
          />
        }
      />
    </div>
  );
};
