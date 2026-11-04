import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import type { Answer } from '@/shared/api';
import { draftFor, draftInput } from '@/entities/meeting/model/draft';
import { useInfoModel } from '@preview/model/InfoContext';
export const useParticipants = () => {
  const model = useInfoModel();
  return {
    data:
      model.rosterError || model.scenario === 'roster-loading' ? undefined : model.people,
    isPending: model.scenario === 'roster-loading',
    error: model.rosterError ? new Error('Не удалось получить ответы') : null,
    refetch: async () => model.setRosterError(false),
  };
};
export const useCoverImage = (raw: string | null) => ({
  src: raw?.startsWith('data:') ? raw : './dinner.png',
  loading: false,
  error: null,
});
export const useRespond = () => {
  const m = useInfoModel();
  return {
    saved: m.answer,
    mutation: {
      isPending: m.busy,
      error: m.responseError
        ? new Error('Не удалось отправить ответ. Попробуйте ещё раз.')
        : null,
      mutate: (answer: Answer, options?: { onSuccess?: () => void }) =>
        m.respond(answer, options?.onSuccess),
    },
  };
};
export const useShare = () => {
  const m = useInfoModel(),
    [message, setMessage] = useState(''),
    [failed, setFailed] = useState(false),
    [error, setError] = useState(m.scenario === 'organizer-share-error');
  const link = new URL('../invite-r3/preview.html?state=guest', location.href).href;
  return {
    query: {
      data: error ? undefined : link,
      isPending: false,
      error: error ? new Error('Не удалось получить ссылку приглашения') : null,
      refetch: async () => setError(false),
    },
    message,
    failed,
    canShare: false,
    copy: async () => {
      try {
        await navigator.clipboard.writeText(link);
        setMessage('Ссылка скопирована.');
        setFailed(false);
      } catch {
        setMessage('Не удалось скопировать. Выделите ссылку и скопируйте вручную.');
        setFailed(true);
      }
    },
    share: () => undefined,
  };
};
export { useEdit } from '@preview/model/useEditPreview';
