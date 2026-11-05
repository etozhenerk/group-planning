import { useCallback, useRef, useState } from 'react';
import { useMobileLayout } from '@/shared/lib/media';
import type { ConversationActionKind } from '@/widgets/conversation/model/actionKind';
import { actionTitle } from '@/widgets/conversation/model/actionKind';

export const useActionFormExit = (kind: ConversationActionKind, done: () => void) => {
  const mobile = useMobileLayout();
  const handler = useRef<(() => boolean) | null>(null);
  const [formTitle, setFormTitle] = useState('Предложить дату');
  const register = useCallback((next: (() => boolean) | null) => {
    handler.current = next;
  }, []);

  return {
    title: mobile && kind === 'date' ? formTitle : actionTitle(kind),
    register,
    setTitle: setFormTitle,
    close: () => {
      if (mobile && kind === 'date' && handler.current && !handler.current()) {
        return;
      }

      done();
    },
  };
};
