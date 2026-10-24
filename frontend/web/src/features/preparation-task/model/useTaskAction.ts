import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  accessEpoch,
  actOnPreparationTask,
  guarded,
  useAccess,
} from '@/entities/meeting';
import type { PreparationActionInput } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { useIntent } from '@/shared/lib/intent';

export const useTaskAction = (meeting: string, id: string, session: Session) => {
  const client = useQueryClient();
  const intent = useIntent();
  const access = useAccess(session.user.id, meeting);

  return useMutation({
    mutationFn: (input: PreparationActionInput) =>
      guarded(client, session.user.id, meeting, access.epoch, () =>
        actOnPreparationTask(meeting, id, input, session.csrf, intent(input)),
      ),
    onSettled: async () => {
      if (accessEpoch(session.user.id, meeting) !== access.epoch) {
        return;
      }

      await client.invalidateQueries({ queryKey: ['private', session.user.id, meeting] });
    },
    retry: false,
  });
};
