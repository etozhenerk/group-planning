import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { Answer } from '@/shared/api';
import { ApiError } from '@/shared/api';
import { accessEpoch, applyResponse, saveResponse } from '@/entities/meeting';
import type { Invitation } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { useIntent } from '@/shared/lib/intent';

export const useRespond = (
  session: Session,
  id: string,
  token: string | undefined,
  expected: string,
) => {
  const client = useQueryClient();
  const intent = useIntent();
  const [saved, setSaved] = useState<Answer | null>(null);

  return {
    saved,
    mutation: useMutation({
      mutationFn: async (answer: Answer) => {
        const epoch = accessEpoch(session.user.id, id);
        const body = { answer, expected_revision: expected };
        const result = await saveResponse(
          token ? { token } : { id },
          answer,
          expected,
          session.csrf,
          intent(body),
        );

        if (!applyResponse(client, session.user.id, result, epoch)) {
          throw new Error('Ответ изменился. Откройте приглашение ещё раз.');
        }

        return result;
      },
      onSuccess: (result) => {
        setSaved(result.answer);
        client.setQueriesData<Invitation>(
          { queryKey: ['invitation', session.user.id] },
          (old) =>
            old?.meetingId === result.meetingId
              ? { ...old, myRsvp: result.answer, myRsvpRevision: result.revision }
              : old,
        );
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          void client.invalidateQueries({ queryKey: ['invitation'] });
        }
      },
      retry: false,
    }),
  };
};
