import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/shared/api';
import {
  accessEpoch,
  accessSessionEpoch,
  applyConfirmedResponse,
  saveResponse,
} from '@/entities/meeting';
import type { Invitation } from '@/entities/meeting';
import { useSession } from '@/entities/session';
import type { Session } from '@/entities/session';
import { useIntent } from '@/shared/lib/intent';
import { responseDestination } from '@/features/respond/model/responseDestination';
import type { ResponseRequest } from '@/features/respond/model/responseRequest';

export const useResponseController = () => {
  const client = useQueryClient();
  const navigate = useNavigate();
  const intent = useIntent();
  const session = useSession();
  const [request, setRequest] = useState<ResponseRequest | null>(null);
  const mutation = useMutation({
    mutationFn: async (input: ResponseRequest) => {
      const epoch = accessEpoch(input.session.user.id, input.id);
      const sessionEpoch = accessSessionEpoch();
      const body = { answer: input.answer, expected_revision: input.expected };
      const result = await saveResponse(
        input.token ? { token: input.token } : { id: input.id },
        input.answer,
        input.expected,
        input.session.csrf,
        intent({ meeting: input.id, ...body }),
      );

      const current = client.getQueryData<Session | null>(['session']);

      if (
        current?.user.id !== input.session.user.id ||
        current.csrf !== input.session.csrf ||
        !applyConfirmedResponse(
          client,
          input.session.user.id,
          result,
          epoch,
          sessionEpoch,
        )
      ) {
        throw new Error('Ответ изменился. Откройте приглашение ещё раз.');
      }

      return result;
    },
    onSuccess: async (result, input) => {
      client.setQueriesData<Invitation>(
        { queryKey: ['invitation', input.session.user.id] },
        (old) =>
          old?.meetingId === result.meetingId
            ? { ...old, myRsvp: result.answer, myRsvpRevision: result.revision }
            : old,
      );
      await navigate(responseDestination(result.meetingId, result.answer), {
        replace: true,
        state:
          result.answer === 'not_going'
            ? { declinedMeetingTitle: input.title, declinedUserId: input.session.user.id }
            : null,
      });
      setRequest(null);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        void client.invalidateQueries({ queryKey: ['invitation'] });
      }
    },
    retry: false,
  });

  const { reset } = mutation;

  useEffect(() => {
    if (
      request &&
      (request.session.user.id !== session.data?.user.id ||
        request.session.csrf !== session.data?.csrf)
    ) {
      setRequest(null);
      reset();
    }
  }, [request, session.data?.user.id, session.data?.csrf, reset]);

  return {
    request,
    mutation,
    submit: (input: ResponseRequest) => {
      if (mutation.isPending) {
        return;
      }

      setRequest(input);
      mutation.mutate(input);
    },
  };
};
