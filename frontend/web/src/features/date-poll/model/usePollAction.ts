import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accessEpoch, changeDatePoll, guarded, useAccess } from '@/entities/meeting';
import type { PollAction } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { useIntent } from '@/shared/lib/intent';

export const usePollAction = (meeting: string, id: string, session: Session) => {
  const client = useQueryClient();
  const intent = useIntent();
  const access = useAccess(session.user.id, meeting);

  return useMutation({
    mutationFn: (action: PollAction) =>
      guarded(client, session.user.id, meeting, access.epoch, () =>
        changeDatePoll(meeting, id, action, session.csrf, intent(action)),
      ),
    onSettled: () => {
      if (accessEpoch(session.user.id, meeting) !== access.epoch) {
        return;
      }

      void client.invalidateQueries({ queryKey: ['private', session.user.id, meeting] });
      void client.invalidateQueries({ queryKey: ['meetings', session.user.id] });
      void client.invalidateQueries({ queryKey: ['invitation'] });
    },
    retry: false,
  });
};
