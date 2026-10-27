import type { z } from 'zod';
import type { entryReactionsSchema } from '@/entities/meeting/model/reactions';
import type { QueryClient } from '@tanstack/react-query';
import { mapDatePoll } from '@/entities/meeting/lib/mapDatePoll';
import { mapPlacePoll } from '@/entities/meeting/lib/mapPlacePoll';
import { mapPreparationTask } from '@/entities/meeting/lib/mapPreparationTask';
import { privateKey } from '@/entities/meeting/model/access';
import type { DatePoll } from '@/entities/meeting/model/datePoll';
import type { PlacePoll } from '@/entities/meeting/model/placePoll';
import type { PreparationTask } from '@/entities/meeting/model/preparationTask';
import type { ChatProjection } from '@/entities/meeting/model/chatSchema';

export const applyChatProjections = (
  client: QueryClient,
  user: string,
  id: string,
  epoch: number,
  projections: ChatProjection[],
) => {
  for (const projection of projections) {
    if (projection.date_poll) {
      const next = mapDatePoll(projection.date_poll);
      const key = privateKey(user, id, epoch, `poll:${next.id}`);
      void client.cancelQueries({ queryKey: key, exact: true });
      client.setQueryData<DatePoll>(key, (previous) =>
        previous && BigInt(previous.revision) > BigInt(next.revision) ? previous : next,
      );
    }

    if (projection.place_poll) {
      const next = mapPlacePoll(projection.place_poll);
      const key = privateKey(user, id, epoch, `place-poll:${next.id}`);
      void client.cancelQueries({ queryKey: key, exact: true });
      client.setQueryData<PlacePoll>(key, (previous) =>
        previous && BigInt(previous.revision) > BigInt(next.revision) ? previous : next,
      );
    }

    if (projection.preparation_task) {
      const next = mapPreparationTask(projection.preparation_task);
      const key = privateKey(user, id, epoch, `preparation-task:${next.id}`);
      void client.cancelQueries({ queryKey: key, exact: true });
      client.setQueryData<PreparationTask>(key, (previous) =>
        previous && BigInt(previous.revision) > BigInt(next.revision) ? previous : next,
      );
    }

    if (projection.reactions !== undefined) {
      const key = privateKey(user, id, epoch, 'reactions');
      const current = new Map(
        projection.reactions.map((entry) => [entry.entry_id, entry]),
      );

      void client.cancelQueries({ queryKey: key });
      client.setQueriesData<z.infer<typeof entryReactionsSchema>[]>(
        { queryKey: key },
        (previous) => previous?.map((entry) => current.get(entry.entry_id) ?? entry),
      );
    }
  }
};
