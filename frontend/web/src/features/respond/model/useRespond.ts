import { useContext } from 'react';
import { responseContext } from '@/features/respond/model/responseContext';
import type { ResponseRequest } from '@/features/respond/model/responseRequest';
import type { Answer } from '@/shared/api';

export const useRespond = (input: Omit<ResponseRequest, 'answer'>) => {
  const controller = useContext(responseContext);

  if (!controller) {
    throw new Error('ResponseProvider is required');
  }

  const active =
    controller.request?.id === input.id &&
    controller.request.session.user.id === input.session.user.id;

  return {
    mutation: {
      isPending: active && controller.mutation.isPending,
      error: active ? controller.mutation.error : null,
      mutate: (answer: Answer) => controller.submit({ ...input, answer }),
    },
  };
};
