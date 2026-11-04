import { accessEpoch } from '@/entities/meeting';
import { openPrivateScope } from '@/shared/lib/private-store';
import { updateMessageDocument } from '@/features/send-message/model/messageStore';

export const changeOutgoing = async (
  user: string,
  meeting: string,
  id: string,
  action: 'retry' | 'restore',
) => {
  const epoch = accessEpoch(user, meeting);
  const scope = await openPrivateScope(user, meeting);

  if (accessEpoch(user, meeting) !== epoch) {
    return;
  }

  await updateMessageDocument(scope, (document) => {
    const intent = document.intents.find((item) => item.id === id);

    if (!intent) {
      return document;
    }

    if (action === 'retry') {
      return {
        ...document,
        intents: document.intents.map((item) =>
          item.id === id ? { ...item, state: 'queued' } : item,
        ),
      };
    }

    if (document.draft.text) {
      throw new Error('draft_not_empty');
    }

    return {
      intents: document.intents.filter((item) => item.id !== id),
      draft: {
        text: intent.text,
        revision: crypto.randomUUID(),
        selection: { start: intent.text.length, end: intent.text.length },
      },
    };
  });
};
